import {MISSIONS,DIFFICULTIES,landAt} from './content.js';
export const SIZE = 22;
export const DEFS = {
 keep:{hp:1500,cost:{},workers:0},
 house:{hp:160,cost:{wood:35,gold:15},workers:0},
 farm:{hp:130,cost:{wood:45,gold:20},workers:2},
 lumber:{hp:150,cost:{wood:25,gold:25},workers:2},
 quarry:{hp:220,cost:{wood:40,gold:35},workers:2},
 market:{hp:180,cost:{wood:65,stone:25,gold:70},workers:1},
 barracks:{hp:350,cost:{wood:80,stone:50,gold:65},workers:1},
 wall:{hp:450,cost:{stone:15},workers:0},
 gate:{hp:650,cost:{wood:35,stone:40,gold:20},workers:0},
 tower:{hp:650,cost:{wood:30,stone:65,gold:45},workers:1},
 bridge:{hp:900,cost:{},workers:0},
 mill:{hp:200,cost:{wood:60,stone:25,gold:35},workers:2},
 bakery:{hp:180,cost:{wood:50,stone:25,gold:35},workers:2},
 warehouse:{hp:300,cost:{wood:65,stone:30,gold:25},workers:0},
 well:{hp:160,cost:{wood:30,stone:25},workers:0}
};
export function terrain(x,y){return landAt(x,y,'legacy');}
export const PRODUCTION={farm:{resource:'food',rate:2.4},lumber:{resource:'wood',rate:1.5},quarry:{resource:'stone',rate:1.1},mill:{resource:'flour',input:'grain',amount:6,output:5,rate:5/3},bakery:{resource:'food',input:'flour',amount:4,output:8,rate:8/3}};
export const FORTIFICATIONS=['wall','tower','gate'];
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export class Game {
 constructor(mode='campaign',options={}){
  this.journey=!!options.journey;this.mapKey=options.mapKey||(this.journey?'valley':'legacy');this.difficulty=options.difficulty||'normal';this.campaignProgress=JSON.parse(JSON.stringify(options.campaignProgress||{unlocked:0,stars:{}}));this.convoy=null;this.convoyDone=false;this.convoyRescued=false;this.missionStars=0;this.failReason=null;
  this.chain=options.chain??this.journey;this.nextChoice=150;this.choicesMade=0;this.pendingChoice=null;this.version=1;this.mode=mode;this.time=0;this.day=1;this.resources={wood:210,stone:170,food:150,gold:180};
  if(this.chain){this.resources.grain=55;this.resources.flour=16;}
  this.flowLog=[];this.villagers=[];this.navigationVersion=0;this.buildings=[];this.units=[];this.enemies=[];this.projectiles=[];this.effects=[];this.events=[];
  this.wave=0;this.nextWave=110;this.waveActive=false;this.spawnLeft=0;this.spawnTimer=0;this.kills=0;this.score=0;this.happiness=80;this.tax=1;this.rations=1;this.growth=0;this.economy=0;this.population=14;this.nextId=1;this.finished=null;this.tutorial=0;this.totalBuilt=0;this.lastSave=0;this.supplyWave=-1;
  this.guideStep=this.journey&&this.mapKey!=='valley'?5:0;this.layoutVersion=2;
  [[11,10,'keep'],[8,12,'house'],[12,14,'house'],[6,10,'lumber'],[7,15,'farm'],[15,12,'quarry'],[13,8,'barracks'],[8,6,'tower'],[13,5,'tower'],[9,6,'wall'],[10,6,'wall'],[11,6,'gate'],[12,6,'wall'],[8,7,'wall'],[8,8,'wall'],[8,9,'wall']].forEach(([x,y,type])=>this.add(type,x,y));
  if(this.chain){this.add('mill',6,7);this.add('bakery',14,10);}
  this.units=[this.soldier('archer',10,8.8),this.soldier('archer',12,10.7),this.soldier('guard',11,8)];this.syncWorkforce();if(this.mapKey==='bridge'){this.add('bridge',18,11);this.add('tower',16,10);this.add('tower',16,12);}if(this.mapKey==='village'){this.add('house',10,17);const mine=this.add('quarry',23,15);mine.hp=60;mine.landmark='mine';}
 }
 get weather(){return this.chain?['clear','rain','drought','clear'][Math.floor(this.time/120)%4]:'clear';}
 get night(){return this.chain&&this.time%180>=120;}
 get storageLimit(){return this.chain?1200+this.buildings.filter(b=>b.type==='warehouse').reduce((n,b)=>n+b.level*600,0):9999;}
 productionFor(b){return b.type==='farm'&&this.chain?{resource:'grain',rate:2.4}:PRODUCTION[b.type];}
 needs(){const homes=this.buildings.filter(b=>b.type==='house'),danger=this.enemies.some(e=>e.hp>0&&homes.some(b=>distance(e,b)<4));return{food:this.resources.food>=this.population*10,housing:this.population<this.capacity,safety:!danger};}
 choiceOptions(kind=this.pendingChoice?.kind){return kind==='migrants'?[{key:'welcomeMigrants',cost:{food:35,gold:20}},{key:'refuseMigrants',cost:{}}]:kind==='merchant'?[{key:'buyWagon',cost:{gold:40}},{key:'passMerchant',cost:{}}]:[{key:'aidHarvest',cost:{wood:30,gold:25}},{key:'waitHarvest',cost:{}}];}
 resolveChoice(index){if(!this.pendingChoice||!Number.isInteger(index)||index<0||index>1)return false;const choice=this.choiceOptions()[index],kind=this.pendingChoice.kind;if(!this.pay(choice.cost))return false;if(index===0){if(kind==='migrants')this.population=Math.min(this.capacity,this.population+4);if(kind==='merchant'){this.grant('stone',80);this.grant('grain',50);}if(kind==='harvest')this.grant('food',70);}else if(kind==='harvest')this.happiness=Math.max(0,this.happiness-8);this.pendingChoice=null;this.choicesMade++;this.nextChoice=this.time+180;return true;}
 grant(resource,amount){if(!Number.isFinite(this.resources[resource]))return;const added=Math.min(amount,Math.max(0,this.storageLimit-this.resources[resource]));this.resources[resource]+=added;this.recordFlow(resource,added);}
 depotFor(w){const depots=[this.keep,...this.buildings.filter(b=>b.type==='warehouse')].filter(Boolean).sort((a,b)=>distance(w,a)-distance(w,b));return depots.find(b=>distance(w,b)<.75||this.path(w.x,w.y,b.x,b.y,{friendly:true}).length)||this.keep;}
 get size(){return this.mapKey==='legacy'?SIZE:MISSIONS.find(m=>m.id===this.mapKey).size;}
 land(x,y){return landAt(x,y,this.mapKey);}
 get mission(){return MISSIONS.find(m=>m.id===this.mapKey);}
 get waveGoal(){return this.journey?this.mission.waves:10;}
 missionStatus(){return{population:this.population>=24,bridge:!!this.buildings.find(b=>b.type==='bridge'),houses:this.buildings.filter(b=>b.type==='house').length>=2,convoy:this.convoyRescued,mine:!!this.buildings.find(b=>b.landmark==='mine'&&b.hp>=b.maxHp)};}
 completeMission(){const status=this.missionStatus(),bonus=this.mapKey==='valley'?Number(status.population):this.mapKey==='bridge'?Number(this.buildings.find(b=>b.type==='bridge')?.hp>450):Number(status.convoy)+Number(status.mine);this.missionStars=Math.min(3,1+bonus+Number(this.keep.hp>this.keep.maxHp*.6));const index=MISSIONS.findIndex(m=>m.id===this.mapKey);this.campaignProgress.unlocked=Math.max(this.campaignProgress.unlocked,Math.min(2,index+1));this.campaignProgress.stars[this.mapKey]=Math.max(this.campaignProgress.stars[this.mapKey]||0,this.missionStars);}
 tickConvoy(dt){
  if(this.mapKey!=='village')return;
  if(this.wave>=2&&!this.convoy&&!this.convoyDone)this.convoy={id:this.nextId++,type:'caravan',x:11,y:29,hp:220,maxHp:220,path:[],cooldown:0};
  if(!this.convoy)return;
  if(this.convoy.hp<=0){this.convoy=null;this.convoyDone=true;this.emit('convoyLost');return;}
  if(this.travelFriendly(this.convoy,{x:this.keep.x,y:this.keep.y+1},dt,.75)){this.population=Math.min(this.capacity,this.population+4);this.grant('wood',70);this.grant('food',80);this.convoyDone=true;this.convoyRescued=true;this.convoy=null;this.emit('convoySaved');}
 }
 add(type,x,y){const b={id:this.nextId++,type,x,y,level:1,hp:DEFS[type].hp,maxHp:DEFS[type].hp,cooldown:0};if(type==='gate')b.open=false;if(PRODUCTION[type])b.stock=0;this.buildings.push(b);this.navigationVersion++;return b;}
 soldier(type,x,y){return{id:this.nextId++,type,x,y,hp:type==='guard'?170:85,maxHp:type==='guard'?170:85,cooldown:0,target:null};}
 emit(type,text){this.events.push({type,text});}
 get capacity(){return 14+this.buildings.filter(b=>b.type==='house').reduce((n,b)=>n+b.level*6,0);}
 get workers(){return this.buildings.reduce((n,b)=>n+DEFS[b.type].workers,0)+this.units.length;}
 get labor(){return Math.min(1,Math.max(.25,this.population/Math.max(1,this.workers)));}
 get keep(){return this.buildings.find(b=>b.type==='keep');}
 at(x,y){return this.buildings.find(b=>b.x===x&&b.y===y);}
 canPay(cost){return Object.entries(cost).every(([r,n])=>this.resources[r]>=n);}
 pay(cost){if(!this.canPay(cost))return false;for(const [r,n]of Object.entries(cost)){this.resources[r]-=n;this.recordFlow(r,-n);}return true;}
 buildReason(type,x,y){
  if(!DEFS[type]||['keep','bridge'].includes(type))return 'invalid';
  if(!this.chain&&['mill','bakery'].includes(type))return'locked';
  if(this.land(x,y)!=='grass')return 'terrain';
  if(this.journey&&this.mode==='campaign'&&this.mapKey==='valley'&&type==='market')return'locked';
  if(this.at(x,y))return 'occupied';
  const small=['wall','tower','well','gate'];
  if(!small.includes(type)&&this.buildings.some(b=>!small.includes(b.type)&&Math.max(Math.abs(b.x-x),Math.abs(b.y-y))<=1))return 'spacing';
  if(this.enemies.some(e=>Math.hypot(e.x-x,e.y-y)<1))return 'enemy';
  if(type==='lumber'&&!this.nearTerrain(x,y,'forest',4))return 'forest';
  if(type==='quarry'&&!this.nearTerrain(x,y,'rock',3))return 'rock';
  if(!this.canPay(DEFS[type].cost))return 'resources';
  return null;
 }
 nearTerrain(x,y,t,r){for(let dx=-r;dx<=r;dx++)for(let dy=-r;dy<=r;dy++)if(this.land(x+dx,y+dy)===t)return true;return false;}
 build(type,x,y){const reason=this.buildReason(type,x,y);if(reason)return reason;this.pay(DEFS[type].cost);this.add(type,x,y);this.totalBuilt++;this.score+=20;this.emit('build',type);return null;}
 wallLine(a,b){const points=[];let x=a.x,y=a.y;points.push({x,y});while(x!==b.x&&points.length<80){x+=Math.sign(b.x-x);points.push({x,y});}while(y!==b.y&&points.length<80){y+=Math.sign(b.y-y);points.push({x,y});}return points;}
 batchPlan(type,points){
  if(type!=='wall'||!points.length||points.length>80||new Set(points.map(p=>p.x+','+p.y)).size!==points.length)return{error:'invalid',cost:{}};
  const cost=Object.fromEntries(Object.entries(DEFS[type].cost).map(([r,n])=>[r,n*points.length]));
  for(const p of points){const reason=this.buildReason(type,p.x,p.y);if(reason&&reason!=='resources')return{error:reason,cost};}
  return{error:this.canPay(cost)?null:'resources',cost};
 }
 buildBatch(type,points){const plan=this.batchPlan(type,points);if(plan.error)return plan.error;this.pay(plan.cost);for(const p of points)this.add(type,p.x,p.y);this.totalBuilt+=points.length;this.score+=20*points.length;return null;}
 recordFlow(resource,amount){this.flowLog.push({time:this.time,resource,amount});if(this.flowLog.length>2000)this.flowLog.splice(0,500);}
 economyReport(){const seconds=Math.min(60,Math.max(1,this.time));return Object.keys(this.resources).map(resource=>{const flow=this.flowLog.filter(f=>f.resource===resource&&f.time>=this.time-60);return{resource,stock:this.resources[resource],income:flow.filter(f=>f.amount>0).reduce((n,f)=>n+f.amount,0)/seconds,outgoing:-flow.filter(f=>f.amount<0).reduce((n,f)=>n+f.amount,0)/seconds};});}

 upgradeCost(b){return{wood:Math.round((DEFS[b.type].cost.wood||20)*b.level*.7),stone:Math.round((DEFS[b.type].cost.stone||25)*b.level*.7),gold:35*b.level};}
 upgrade(id){const b=this.buildings.find(b=>b.id===id);if(!b||b.level>=3||['keep','bridge'].includes(b.type))return false;if(!this.pay(this.upgradeCost(b)))return false;b.level++;b.maxHp=Math.round(DEFS[b.type].hp*(1+(b.level-1)*.6));b.hp=b.maxHp;this.score+=35;return true;}
 repair(id){const b=this.buildings.find(b=>b.id===id);if(!b||b.hp>=b.maxHp)return false;const cost={wood:Math.ceil((b.maxHp-b.hp)/20),gold:Math.ceil((b.maxHp-b.hp)/30)};if(!this.pay(cost))return false;b.hp=b.maxHp;return true;}
 demolish(id){const b=this.buildings.find(b=>b.id===id);if(!b||['keep','bridge'].includes(b.type)||this.waveActive)return false;for(const[r,n]of Object.entries(DEFS[b.type].cost))this.grant(r,Math.floor(n*.4));this.buildings=this.buildings.filter(q=>q.id!==id);this.navigationVersion++;this.syncWorkforce();return true;}
 recruit(type){if(!['archer','guard'].includes(type))return 'invalid';if(this.journey&&this.mode==='campaign'&&this.mapKey==='valley'&&type==='guard')return'locked';if(!this.buildings.some(b=>b.type==='barracks'))return 'barracks';if(this.units.length>=Math.min(40,this.population-5))return 'population';const cost=type==='archer'?{wood:15,gold:30,food:10}:{stone:10,gold:40,food:10};if(!this.pay(cost))return 'resources';const b=this.buildings.find(b=>b.type==='barracks');this.units.push(this.soldier(type,b.x+.4,b.y+.7));return null;}
 trade(resource,buy){if(!this.buildings.some(b=>b.type==='market'))return false;if(!['wood','stone','food'].includes(resource))return false;const cost=buy?{gold:25}:{[resource]:50};if(!this.pay(cost))return false;this.grant(buy?resource:'gold',buy?50:15);return true;}
 syncWorkforce(){
  const workplaces=this.buildings.filter(b=>PRODUCTION[b.type]);
  const key=workplaces.map(b=>b.id).join(',');if(this.workforceKey===key)return;this.workforceKey=key;
  this.villagers=this.villagers.filter(w=>workplaces.some(b=>b.id===w.buildingId));
  for(const b of workplaces){
   b.stock??=0;
   for(const role of ['harvester','porter'])if(!this.villagers.some(w=>w.buildingId===b.id&&w.role===role)){
    this.villagers.push({id:this.nextId++,buildingId:b.id,role,type:'villager',x:b.x+.22,y:b.y+.22,stage:role==='porter'?'pickup':'toWork',progress:0,cargo:0,path:[],walking:false});
   }
  }
 }
 worksite(b){
  if(b.type==='farm')return{x:b.x-.25,y:b.y+.25};
  const candidates=[];
  for(let y=0;y<this.size;y++)for(let x=0;x<this.size;x++){
   if(b.type==='lumber'&&this.land(x,y)==='forest')candidates.push({x:x+.12,y:y+.12});
   if(b.type==='quarry'&&this.land(x,y)==='grass'&&this.nearTerrain(x,y,'rock',1)&&(!this.at(x,y)||this.at(x,y).id===b.id))candidates.push({x:x+.25,y:y+.25});
  }
  return candidates.sort((a,c)=>distance(a,b)-distance(c,b))[0]||{x:b.x,y:b.y};
 }
 travelFriendly(actor,target,dt,speed=1.15){
  if(distance(actor,target)<.06){actor.walking=false;actor.blocked=false;return true;}
  const navKey=[Math.round(target.x*10),Math.round(target.y*10),this.navigationVersion].join(':');
  if(actor.navKey!==navKey||(!actor.path?.length&&this.time>=(actor.retryAt||0))){
   actor.navKey=navKey;actor.path=this.path(actor.x,actor.y,Math.round(target.x),Math.round(target.y),{friendly:true});
   if(actor.path.length||Math.round(actor.x)===Math.round(target.x)&&Math.round(actor.y)===Math.round(target.y))actor.path.push({...target});
   actor.retryAt=this.time+2;
  }
  if(!actor.path?.length){actor.walking=false;actor.blocked=true;return false;}
  actor.blocked=false;const next=actor.path[0],gate=this.at(Math.round(next.x),Math.round(next.y));
  if(gate?.type==='gate'&&distance(actor,gate)<1.1)gate.passUntil=this.time+1.2;
  const d=this.move(actor,next,dt*speed);if(d<=dt*speed+.01)actor.path.shift();return distance(actor,target)<.06;
 }
 tickWorkers(dt){
  this.syncWorkforce();if(!this.keep)return;
  const travelSpeed=this.weather==='rain'?.98:1.15;
  for(const w of this.villagers){
   const b=this.buildings.find(b=>b.id===w.buildingId);if(!b)continue;w.walking=false;const product=this.productionFor(b);
   if(w.role==='harvester'){
    const site=w.site||(w.site=this.worksite(b));
    if(w.stage==='toWork'){if(this.travelFriendly(w,site,dt,travelSpeed))w.stage='working';}
    else if(w.stage==='working'){
     w.progress+=dt*this.labor;
     if(w.progress>=3){
      const inputCost=product.input?{[product.input]:product.amount*b.level}:{};w.waitingInput=!this.canPay(inputCost);
      if(w.waitingInput){w.progress=3;continue;}this.pay(inputCost);w.waitingInput=false;w.progress=0;
      const weather=b.type==='farm'&&this.chain?(this.weather==='drought'?.7:this.weather==='rain'?1.15:1):1;
      w.cargo=weather*(product.output?product.output*b.level:product.rate*b.level*(3+2*(Math.abs(b.x-site.x)+Math.abs(b.y-site.y))/1.15));w.resource=product.resource;w.stage='toWorkshop';
     }
    }else if(w.stage==='toWorkshop'&&this.travelFriendly(w,{x:b.x+.22,y:b.y+.22},dt,travelSpeed)){
     b.stock+=w.cargo;w.cargo=0;w.stage='toWork';
    }
   }else{
    if(w.stage==='pickup'){
     if(this.travelFriendly(w,{x:b.x+.22,y:b.y+.22},dt,travelSpeed)&&b.stock>.01){w.cargo=Math.min(b.stock,120*b.level);w.resource=product.resource;b.stock-=w.cargo;w.stage='toKeep';w.depotId=null;}
    }else if(w.stage==='toKeep'){
     if(!w.depotId||w.depotVersion!==this.navigationVersion||!this.buildings.some(b=>b.id===w.depotId)){w.depotId=this.depotFor(w).id;w.depotVersion=this.navigationVersion;}
     const depot=this.buildings.find(b=>b.id===w.depotId),destination={x:depot.x+.35,y:depot.y+.45};
     if(this.travelFriendly(w,destination,dt,travelSpeed)){
      const resource=w.resource||product.resource,amount=Math.min(w.cargo,Math.max(0,this.storageLimit-this.resources[resource]));w.storageFull=amount<.01;if(w.storageFull)continue;
      this.grant(resource,amount);b.lastDelivery=this.time;
      this.effects.push({type:'delivery',x:w.x,y:w.y,t:0,life:1.2,resource,amount});w.cargo-=amount;
      if(w.cargo<.01){w.cargo=0;w.stage='pickup';w.storageFull=false;}
     }
    }
   }
  }
 }
 toggleGate(id){const b=this.buildings.find(b=>b.id===id&&b.type==='gate');if(!b)return false;b.open=!b.open;this.navigationVersion++;for(const e of this.enemies)e.repath=0;return true;}
 fortificationLinks(b){return [[-1,0],[1,0],[0,-1],[0,1]].filter(([dx,dy])=>FORTIFICATIONS.includes(this.at(b.x+dx,b.y+dy)?.type));}

 wavePlan(index=this.wave+1){const side=index%3,pattern=this.mapKey==='bridge'?(index%3===0?'ram':'assault'):this.mapKey==='village'&&index%2===0?'assault':index%5===0?'ram':index%3===2?'pincer':index%3===0?'assault':'raid';return{index,pattern,side,count:6+index*3+(index>=5?3:0),ram:pattern==='ram'||this.mapKey==='bridge'&&index===3,direction:this.mapKey==='bridge'?'east':this.mapKey==='village'&&index%2===0?'south':pattern==='pincer'?'northWest':side===1?'north':'west'};}
 repairPlan(){const items=this.buildings.filter(b=>['keep','wall','gate','tower','bridge'].includes(b.type)&&b.hp<b.maxHp),cost={wood:0,gold:0};for(const b of items){cost.wood+=Math.ceil((b.maxHp-b.hp)/20);cost.gold+=Math.ceil((b.maxHp-b.hp)/30);}return{items,cost};}
 repairFortifications(){const plan=this.repairPlan();if(!plan.items.length||!this.pay(plan.cost))return false;for(const b of plan.items)b.hp=b.maxHp;return true;}
 command(ids,order,point){
  if(!['move','hold','defend','garrison'].includes(order))return false;const units=this.units.filter(u=>ids.includes(u.id));if(!units.length)return false;
  if(['move','defend'].includes(order)&&(!point||!['grass','bridge'].includes(this.land(point.x,point.y))))return false;
  const fort=order==='garrison'?this.at(point?.x,point?.y):null;
  if(order==='garrison'&&(!fort||!['wall','tower','gate'].includes(fort.type)||!units.some(u=>u.type==='archer')))return false;
  let assigned=0;
  for(const u of units){
   if(order==='garrison'){
    if(u.type!=='archer')continue;const occupied=this.units.filter(a=>a.garrisonId===fort.id&&a.id!==u.id).length,capacity=fort.type==='tower'?2+fort.level:1;if(occupied>=capacity)continue;
    const entrances=[[-1,0],[1,0],[0,-1],[0,1]].map(([dx,dy])=>({x:fort.x+dx,y:fort.y+dy})).filter(p=>(this.land(p.x,p.y))==='grass'&&!this.at(p.x,p.y)).sort((a,b)=>distance(u,a)-distance(u,b));
    const entrance=entrances.find(p=>this.path(u.x,u.y,p.x,p.y,{friendly:true}).length||distance(u,p)<.2);if(!entrance)continue;u.entrance=entrance;u.garrisonId=fort.id;u.target={...entrance};u.order='garrison';u.mounted=false;assigned++;continue;
   }
   if(order!=='hold'&&u.garrisonId){if(u.mounted&&u.entrance){u.x=u.entrance.x;u.y=u.entrance.y;}delete u.garrisonId;u.elevation=0;u.mounted=false;}
   u.order=order;u.anchor=point?{...point}:{x:u.x,y:u.y};u.target=order==='hold'?null:{...point};u.navKey=null;assigned++;
  }
  return assigned>0;
 }

 rally(x,y){return this.command(this.units.map(u=>u.id),'move',{x,y});}
 startWave(early=false){if(this.waveActive||this.finished)return false;this.guideStep=5;this.wave++;this.waveActive=true;this.spawnLeft=this.wavePlan(this.wave).count;this.spawnTimer=0;this.nextWave=0;if(early){this.grant('gold',20);this.score+=50;}this.emit('wave',this.wave);return true;}
 spawnEnemy(){const boss=this.wavePlan(this.wave).ram&&this.spawnLeft===1;const heavy=!boss&&this.wave>=3&&this.spawnLeft%4===0;const plan=this.wavePlan(this.wave),side=plan.pattern==='pincer'?this.spawnLeft%2:plan.side;let x=side===0?1.2:side===1?5+Math.random()*8:1.2;let y=side===0?11+Math.random()*5:side===1?1.2:4+Math.random()*6;if(this.mapKey==='bridge'){x=30;y=10.7+Math.random()*.6;}if(this.mapKey==='village'&&this.wave%2===0){x=11+Math.random()*3;y=30;}const factor=DIFFICULTIES[this.difficulty].combat;this.enemies.push({id:this.nextId++,type:boss?'ram':heavy?'brute':'raider',x,y,hp:boss?480+this.wave*22:heavy?155+this.wave*12:55+this.wave*7,maxHp:boss?480+this.wave*22:heavy?155+this.wave*12:55+this.wave*7,speed:boss?.32:heavy?.42:.62,damage:boss?52:heavy?24:12,cooldown:0,path:[],repath:0});const enemy=this.enemies.at(-1);enemy.hp*=factor;enemy.maxHp*=factor;enemy.damage*=factor;this.spawnLeft--;}
 path(sx,sy,tx,ty,options={}){
  if(this.land(tx,ty)==='void')return[];
  const key=(x,y)=>y*this.size+x,start=key(Math.max(0,Math.min(this.size-1,Math.round(sx))),Math.max(0,Math.min(this.size-1,Math.round(sy)))),end=key(tx,ty);
  const occupancy=new Map(this.buildings.map(b=>[b.x+','+b.y,b]));
  const frontier=[{id:start,priority:0}],costs=new Map([[start,0]]),prev=new Map();let count=0;
  while(frontier.length&&count++<2500){
   frontier.sort((a,b)=>a.priority-b.priority);const cur=frontier.shift();if(cur.id===end)break;
   const x=cur.id%this.size,y=Math.floor(cur.id/this.size);
   for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){
    const nx=x+dx,ny=y+dy,land=this.land(nx,ny);if(['void','water','rock'].includes(land))continue;
    const b=occupancy.get(nx+','+ny),id=key(nx,ny);let extra=land==='forest'?.35:0;
    if(options.friendly){if(b&&(['wall','tower'].includes(b.type)||(!['gate','well','bridge'].includes(b.type)&&id!==start&&id!==end)))continue;}
    else if(b){if(b.type==='gate')extra+=b.open?0:options.ram?1.6:3;else extra+=FORTIFICATIONS.includes(b.type)?6:2;}
    const cost=costs.get(cur.id)+1+extra;if(!costs.has(id)||cost<costs.get(id)){costs.set(id,cost);prev.set(id,cur.id);frontier.push({id,priority:cost+Math.abs(tx-nx)+Math.abs(ty-ny)});}
   }
  }
  if(end!==start&&!prev.has(end))return[];
  const result=[];let id=end;while(id!==start&&prev.has(id)&&result.length<500){result.unshift({x:id%this.size,y:Math.floor(id/this.size)});id=prev.get(id);}return result;
 }
 move(actor,target,amount){const d=distance(actor,target);if(d>0){actor.facing={x:target.x-actor.x,y:target.y-actor.y};actor.walking=true;actor.x+=(target.x-actor.x)/d*Math.min(d,amount);actor.y+=(target.y-actor.y)/d*Math.min(d,amount);}return d;}
 hit(target,damage,from,arrow=false){
  target.hp-=damage;target.hurtUntil=this.time+.2;from.attackUntil=this.time+.38;from.facing={x:target.x-from.x,y:target.y-from.y};
  if(arrow)this.projectiles.push({x:from.x,y:from.y,z:from.type==='keep'?90:from.type==='tower'?55:17+(from.elevation||0),tx:target.x,ty:target.y,t:0,life:.32});
  this.effects.push({x:target.x,y:target.y,t:0,life:.42,type:arrow?'arrowHit':'hit'});
 }
 tick(dt){
  if(this.finished||!Number.isFinite(dt)||dt<=0)return;
  dt=Math.min(dt,.25);this.time+=dt;this.tickWorkers(dt);this.tickConvoy(dt);for(const a of [...this.units,...this.enemies])a.walking=false;this.day=1+Math.floor(this.time/180);if(this.chain&&this.guideStep>=5&&!this.waveActive&&!this.pendingChoice&&this.time>=this.nextChoice)this.pendingChoice={id:this.choicesMade+1,kind:['migrants','merchant','harvest'][this.choicesMade%3]};this.economy+=dt;
  if(this.economy>=1){this.economy-=1;this.produce();}
  if(!this.waveActive&&this.guideStep>=5){this.nextWave-=dt;if(this.nextWave<=0)this.startWave();}
  else if(this.spawnLeft>0){this.spawnTimer-=dt;if(this.spawnTimer<=0){this.spawnEnemy();this.spawnTimer=.9;}}
  for(const b of this.buildings){b.cooldown-=dt;if(b.type!=='tower'&&b.type!=='keep')continue;const range=(b.type==='keep'?4:5+b.level*.5)-(this.night?.7:0);const target=this.enemies.filter(e=>e.hp>0&&distance(b,e)<range).sort((a,c)=>distance(b,a)-distance(b,c))[0];if(target&&b.cooldown<=0){this.hit(target,b.type==='keep'?16:25*b.level,b,true);b.cooldown=1;}}
  for(const u of this.units){
   u.cooldown-=dt;
   if(u.garrisonId){const fort=this.buildings.find(b=>b.id===u.garrisonId);if(!fort){delete u.garrisonId;u.elevation=0;u.mounted=false;u.order='hold';u.hp-=35;if(u.entrance){u.x=u.entrance.x;u.y=u.entrance.y;}}
    else if(!u.mounted){if(this.travelFriendly(u,u.target,dt,1.3)){u.x=fort.x+.12;u.y=fort.y+.12;u.elevation=fort.type==='tower'?53:28;u.mounted=true;u.mountTime=this.time;u.target=null;}continue;}
   }
   const range=u.type==='archer'?4.5+(u.mounted?1.5:0)-(this.night?.7:0):.8,chase=u.order==='hold'||u.mounted?range:u.type==='guard'?3.5:range;
   const target=this.enemies.filter(e=>e.hp>0&&distance(u,e)<chase&&(!(u.order==='defend'&&u.anchor)||distance(u.anchor,e)<4)).sort((a,b)=>distance(u,a)-distance(u,b))[0];
   if(target){if(distance(u,target)>range)this.travelFriendly(u,target,dt,1.3);else if(u.cooldown<=0){this.hit(target,u.type==='archer'?18:25,u,u.type==='archer');u.cooldown=u.type==='archer'?1.15:.8;}}
   else if(u.target&&distance(u,u.target)>.15){if(this.travelFriendly(u,u.target,dt,1.4)&&u.order==='move'){u.order='hold';u.target=null;}}
   else if(u.order==='defend'&&u.anchor&&distance(u,u.anchor)>.25)this.travelFriendly(u,u.anchor,dt,1.3);
  }
  for(const e of this.enemies){if(e.hp<=0)continue;e.cooldown-=dt;e.repath-=dt;const nearby=this.units.filter(u=>u.hp>0&&!u.mounted&&distance(e,u)<.8).sort((a,b)=>distance(e,a)-distance(e,b))[0];if(nearby){if(e.cooldown<=0){this.hit(nearby,e.damage,e);e.cooldown=1;}continue;}
   if(!this.keep)break;if(this.convoy&&distance(e,this.convoy)<1){if(e.cooldown<=0){this.hit(this.convoy,e.damage,e);e.cooldown=1;}continue;}if(e.repath<=0||!e.path.length){e.path=this.path(e.x,e.y,this.keep.x,this.keep.y,{ram:e.type==='ram'});e.repath=3;}
   const next=e.path[0]||this.keep;const b=this.at(Math.round(next.x),Math.round(next.y));if(b&&!(b.type==='gate'&&b.open)&&distance(e,b)<1.2){if(e.cooldown<=0){this.hit(b,e.damage*(e.type==='ram'&&b.type==='gate'?1.7:1),e);e.cooldown=e.type==='ram'?1.5:1.1;}}else {this.move(e,next,dt*e.speed);if(distance(e,next)<.08)e.path.shift();}
  }
  for(const e of this.enemies)if(e.hp<=0){this.effects.push({type:'fall',x:e.x,y:e.y,t:0,life:.8});this.kills++;this.score+=10;this.grant('gold',3);}
  this.enemies=this.enemies.filter(e=>e.hp>0);this.units=this.units.filter(u=>u.hp>0);
  const destroyed=this.buildings.filter(b=>b.hp<=0);for(const b of destroyed){this.emit('destroyed',b.type);this.effects.push({type:'collapse',x:b.x,y:b.y,t:0,life:2});}this.buildings=this.buildings.filter(b=>b.hp>0);if(destroyed.length){this.navigationVersion++;this.syncWorkforce();for(const e of this.enemies)e.repath=0;}
  if(!this.keep||this.journey&&this.mapKey==='bridge'&&!this.missionStatus().bridge||this.journey&&this.mapKey==='village'&&!this.missionStatus().houses){this.failReason=!this.keep?'keep':this.mapKey==='bridge'?'bridge':'houses';this.finished='defeat';this.emit('end','defeat');}
  else if(this.waveActive&&this.spawnLeft===0&&this.enemies.length===0){this.waveActive=false;this.grant('gold',60+this.wave*10);this.grant('stone',20);this.score+=this.wave*100;this.nextWave=Math.max(45,95-this.wave*3)*DIFFICULTIES[this.difficulty].delay;this.emit('victory',this.wave);if(this.mode==='campaign'&&this.wave>=this.waveGoal){if(this.journey)this.completeMission();this.finished=this.journey&&this.mapKey!=='village'?'mission':'victory';this.emit('end','victory');}}
  for(const list of [this.projectiles,this.effects]){for(const p of list)p.t+=dt;for(let i=list.length-1;i>=0;i--)if(list[i].t>list[i].life)list.splice(i,1);}
 }
 produce(){
  const r=this.resources,l=this.labor;
  for(const b of this.buildings){const n=b.level*l;if(b.type==='market'){this.grant('gold',.5*n);}}
  const foodUsed=Math.min(r.food,this.population*.065*this.rations),taxIncome=this.population*.025*this.tax;r.food-=foodUsed;this.grant('gold',taxIncome);this.recordFlow('food',-foodUsed);
  const needs=this.needs();const wells=this.buildings.filter(b=>b.type==='well').length;const target=Math.min(100,75+(this.rations-1)*16-(this.tax-1)*14+wells*7-(r.food<1?40:0)-(this.chain&&!needs.housing?10:0)-(this.chain&&!needs.safety?18:0));this.happiness+=(target-this.happiness)*.04;
  this.growth++;if(this.growth>=12){this.growth=0;if(this.happiness>=55&&this.population<this.capacity)this.population++;else if(this.happiness<35&&this.population>6)this.population--;}
 }
 snapshot(){const {events,effects,projectiles,flowLog,...rest}=this;return JSON.parse(JSON.stringify(rest));}
 static restore(data){
  if(!data||data.version!==1||!Array.isArray(data.buildings)||!Array.isArray(data.units)||!Array.isArray(data.enemies)||data.buildings.length>1024||data.units.length>40||data.enemies.length>500)return null;
  if(!['campaign','endless'].includes(data.mode)||!['time','nextId','population','nextWave','wave','spawnLeft','spawnTimer','kills','score','happiness','growth','economy','day','tutorial','totalBuilt','lastSave'].every(k=>Number.isFinite(data[k]))||!['wood','stone','food','gold'].every(k=>Number.isFinite(data.resources?.[k])&&data.resources[k]>=0))return null;
  if(![.5,1,1.5].includes(data.tax)||![.5,1,1.5].includes(data.rations)||![null,'victory','defeat','mission'].includes(data.finished)||typeof data.waveActive!=='boolean')return null;
  if(Object.hasOwn(data,'guideStep')&&(!Number.isInteger(data.guideStep)||data.guideStep<0||data.guideStep>5))return null;
  if(!data.buildings.every(b=>DEFS[b.type]&&Number.isInteger(b.x)&&Number.isInteger(b.y)&&(landAt(b.x,b.y,data.mapKey||'legacy')==='grass'||b.type==='bridge'&&landAt(b.x,b.y,data.mapKey)==='bridge')&&Number.isFinite(b.hp)&&Number.isFinite(b.maxHp)&&b.level>=1&&b.level<=3))return null;
  if(![...data.units,...data.enemies].every(a=>Number.isFinite(a.x)&&Number.isFinite(a.y)&&Number.isFinite(a.hp)&&Number.isFinite(a.maxHp)&&Number.isFinite(a.cooldown)))return null;
  if(!data.units.every(a=>['archer','guard'].includes(a.type))||!data.enemies.every(a=>['raider','brute','ram'].includes(a.type)&&Array.isArray(a.path)&&Number.isFinite(a.repath)&&Number.isFinite(a.speed)&&Number.isFinite(a.damage)))return null;
  if(data.villagers!==undefined&&(!Array.isArray(data.villagers)||data.villagers.length>968||!data.villagers.every(w=>Number.isFinite(w.id)&&Number.isFinite(w.buildingId)&&['harvester','porter'].includes(w.role)&&['toWork','working','toWorkshop','pickup','toKeep'].includes(w.stage)&&[w.x,w.y,w.progress,w.cargo].every(Number.isFinite)&&w.cargo>=0&&Array.isArray(w.path)&&w.path.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)))))return null;
  if(data.villagers&&new Set(data.villagers.map(w=>w.buildingId+':'+w.role)).size!==data.villagers.length)return null;
  if(!data.buildings.every(b=>(b.type!=='gate'||b.open===undefined||typeof b.open==='boolean')&&(b.stock===undefined||Number.isFinite(b.stock)&&b.stock>=0)))return null;
  if(data.mapKey!==undefined&&!['legacy','valley','bridge','village'].includes(data.mapKey)||data.difficulty!==undefined&&!DIFFICULTIES[data.difficulty])return null;
  if(data.journey&&!MISSIONS.some(m=>m.id===data.mapKey))return null;
  if(data.campaignProgress&&(!Number.isInteger(data.campaignProgress.unlocked)||data.campaignProgress.unlocked<0||data.campaignProgress.unlocked>2||!data.campaignProgress.stars||typeof data.campaignProgress.stars!=='object'))return null;
  if(Object.keys(data.resources).some(k=>!['wood','stone','food','gold','grain','flour'].includes(k)||!Number.isFinite(data.resources[k])||data.resources[k]<0))return null;
  if(data.chain!==undefined&&typeof data.chain!=='boolean'||data.journey!==undefined&&typeof data.journey!=='boolean')return null;
  if(data.missionStars!==undefined&&(!Number.isInteger(data.missionStars)||data.missionStars<0||data.missionStars>3))return null;
  if(data.nextChoice!==undefined&&!Number.isFinite(data.nextChoice)||data.choicesMade!==undefined&&(!Number.isSafeInteger(data.choicesMade)||data.choicesMade<0))return null;
  if(data.convoy&&![data.convoy.x,data.convoy.y,data.convoy.hp,data.convoy.maxHp].every(Number.isFinite))return null;
  if(data.chain&&!['grain','flour'].every(k=>Number.isFinite(data.resources?.[k])&&data.resources[k]>=0))return null;
  if(data.pendingChoice&&(!['migrants','merchant','harvest'].includes(data.pendingChoice.kind)||!Number.isInteger(data.pendingChoice.id)))return null;
  const game=new Game(data.mode,{journey:data.journey,mapKey:data.mapKey,difficulty:data.difficulty,campaignProgress:data.campaignProgress,chain:data.chain??false});for(const key of Object.keys(game))if(Object.hasOwn(data,key))game[key]=data[key];game.events=[];game.effects=[];game.projectiles=[];if(!data.villagers){game.villagers=[];game.workforceKey=null;}for(const b of game.buildings)if(b.type==='gate')b.open??=false;game.workforceKey=null;game.syncWorkforce();if(!Object.hasOwn(data,'guideStep'))game.guideStep=data.wave>0?5:0;
  if(!data.layoutVersion){const positions=[[11,10],[8,12],[12,14],[6,10],[7,15],[15,12],[13,8],[8,6],[13,5],[9,6],[10,6],[11,6],[12,6],[8,7],[8,8],[8,9],[8,10],[13,6]];const starters=game.buildings.filter(b=>b.id<=18);for(const b of starters){const point=positions[b.id-1];if(!point)continue;let[x,y]=point;if(game.buildings.some(other=>other.id>18&&other.x===x&&other.y===y)){let found=false;for(let r=1;r<=4&&!found;r++)for(let dx=-r;dx<=r&&!found;dx++)for(let dy=-r;dy<=r&&!found;dy++){const nx=x+dx,ny=y+dy;if(game.land(nx,ny)==='grass'&&!game.buildings.some(other=>other.x===nx&&other.y===ny)&&!positions.some(([px,py])=>px===nx&&py===ny)){x=nx;y=ny;found=true;}}if(!found)continue;}b.x=x;b.y=y;}game.layoutVersion=2;game.villagers=[];game.workforceKey=null;game.syncWorkforce();}return game;
 }
}
