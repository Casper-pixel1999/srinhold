export const HEALTH=Object.freeze({keep:150,house:60,farm:60,lumber:60,wall:100,gate:140,tower:100,guard:60,raider:45});
export const WARNING_TICKS=200,WAVE_SIZE=3;
export function createSiege(){return {phase:'preparing',warningTicks:0,spawned:0,spawnTicks:0,killed:0};}
const neighbors=(x,y)=>[[x-1,y],[x,y-1],[x,y+1],[x+1,y]];
// Search free routes first; a completely enclosed keep requires breaching a structure.
export function nextEnemyTile(state,enemy,terrainAt){
 const keep=state.buildings.find(b=>b.type==='keep');if(!keep)return null;
 const occupied=new Map(state.buildings.map(b=>[`${b.x},${b.y}`,b]));
 for(const breach of [false,true]){
  const queue=[{x:enemy.x,y:enemy.y,first:null}],seen=new Set([`${enemy.x},${enemy.y}`]);
  for(let i=0;i<queue.length;i++){
   const p=queue[i];if(p.x===keep.x&&p.y===keep.y)return p.first;
   for(const [x,y]of neighbors(p.x,p.y)){
    const key=`${x},${y}`,terrain=terrainAt(x,y),b=occupied.get(key);
    if(seen.has(key)||!['grass','forest'].includes(terrain)||(!breach&&b&&b.type!=='keep'&&!(b.type==='gate'&&b.open)))continue;
    seen.add(key);queue.push({x,y,first:p.first||{x,y}});
   }
  }
 }
 return null;
}
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
function fire(source,enemies,range,damage){if(source.cooldown>0)return;const target=enemies.filter(e=>e.hp>0&&distance(source,e)<=range).sort((a,b)=>distance(source,a)-distance(source,b)||a.id-b.id)[0];if(target){target.hp=Math.max(0,target.hp-damage);source.cooldown=10;}}
export function stepCombat(state,terrainAt){
 const siege=state.siege;
 if(siege.phase==='warning'){if(--siege.warningTicks<=0)siege.phase='active';else return;}
 if(siege.phase!=='active')return;
 if(siege.spawned<WAVE_SIZE&&siege.spawnTicks===0){state.enemies.push({id:state.nextId++,type:'raider',x:20,y:12,hp:HEALTH.raider,cooldown:0,moveTicks:0});siege.spawned++;siege.spawnTicks=20;}
 if(siege.spawnTicks>0)siege.spawnTicks--;
 for(const source of [...state.buildings.filter(b=>b.type==='tower'),...state.units]){if(source.cooldown>0)source.cooldown--;fire(source,state.enemies,source.type==='tower'?4:2,source.type==='tower'?14:12);}
 for(const enemy of state.enemies){
  if(enemy.hp<=0)continue;if(enemy.cooldown>0)enemy.cooldown--;if(enemy.moveTicks>0)enemy.moveTicks--;
  const guard=state.units.find(u=>u.hp>0&&distance(u,enemy)<=1);
  const next=nextEnemyTile(state,enemy,terrainAt),building=next&&state.buildings.find(b=>b.x===next.x&&b.y===next.y&&!(b.type==='gate'&&b.open));
  const target=guard||building;
  if(target){if(enemy.cooldown===0){target.hp=Math.max(0,target.hp-12);enemy.cooldown=10;}}
  else if(next&&enemy.moveTicks===0){enemy.x=next.x;enemy.y=next.y;enemy.moveTicks=8;}
 }
 siege.killed+=state.enemies.filter(e=>e.hp<=0).length;
 state.enemies=state.enemies.filter(e=>e.hp>0);state.units=state.units.filter(u=>u.hp>0);
 const keep=state.buildings.find(b=>b.type==='keep');
 if(!keep||keep.hp===0)siege.phase='defeat';
 state.buildings=state.buildings.filter(b=>b.hp>0||b.type==='keep');
 if(siege.phase==='active'&&siege.spawned===WAVE_SIZE&&state.enemies.length===0)siege.phase='victory';
}
