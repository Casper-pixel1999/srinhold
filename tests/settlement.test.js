import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/engine.js';
const advance=(g,seconds)=>{for(let i=0;i<seconds*10;i++)g.tick(.1);};
test('workers gather at a worksite and supplies change only when a porter reaches the keep',()=>{
 const g=new Game(),before=g.resources.wood;advance(g,3);assert.equal(g.resources.wood,before);
 let cargo=false,work=false,delivery=false;
 for(let i=0;i<600;i++){g.tick(.1);work||=g.villagers.some(w=>w.role==='harvester'&&w.stage==='working');cargo||=g.villagers.some(w=>w.role==='porter'&&w.cargo>0&&w.stage==='toKeep');delivery||=g.effects.some(e=>e.type==='delivery'&&e.resource==='wood');}
 assert.ok(work&&cargo&&delivery);assert.ok(g.resources.wood>before);assert.ok(g.resources.stone>170);assert.equal(g.villagers.length,6);
});
test('walls around a workshop stop deliveries until a friendly gate is provided',()=>{
 const g=new Game();g.buildings=g.buildings.filter(b=>['keep','farm'].includes(b.type));const farm=g.buildings.find(b=>b.type==='farm');
 for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]])g.add('wall',farm.x+dx,farm.y+dy);
 advance(g,50);assert.ok(farm.stock>0);assert.ok(g.villagers.some(w=>w.role==='porter'&&w.blocked));assert.equal(g.effects.some(e=>e.type==='delivery'),false);
 const entrance=g.at(farm.x+1,farm.y);entrance.type='gate';entrance.open=false;g.navigationVersion++;advance(g,25);assert.ok(g.villagers.some(w=>w.role==='porter'&&w.cargo>0)||farm.lastDelivery>0);assert.ok(farm.lastDelivery>0);
});
test('closing and opening a gate changes hostile routes while friendly traffic can pass',()=>{
 const g=new Game();g.buildings=[];const keep=g.add('keep',11,10),gate=g.add('gate',11,7);for(let x=0;x<=18;x++)if(x!==11)g.add('wall',x,7);
 const friendly=g.path(11,6,keep.x,keep.y,{friendly:true});assert.ok(friendly.some(p=>p.x===11&&p.y===7));
 g.units=[];g.enemies=[{id:999,type:'raider',x:11,y:6.15,hp:1000,maxHp:1000,speed:.62,damage:12,cooldown:0,path:[{x:11,y:7}],repath:99}];
 const hp=gate.hp;g.tick(.1);assert.ok(gate.hp<hp);assert.equal(g.enemies[0].y,6.15);
 assert.equal(g.toggleGate(gate.id),true);const after=gate.hp;g.tick(.1);assert.ok(g.enemies[0].y>6.15);assert.equal(gate.hp,after);assert.equal(g.enemies[0].repath,3);
});
test('rams prefer gates in a closed wall line and deal extra damage to them',()=>{
 const g=new Game();g.buildings=[];g.add('keep',11,10);const gate=g.add('gate',10,7);for(let x=0;x<=18;x++)if(x!==10)g.add('wall',x,7);
 const route=g.path(11,6,11,10,{ram:true});assert.ok(route.some(p=>p.x===10&&p.y===7));g.units=[];
 g.enemies=[{id:999,type:'ram',x:10,y:6.1,hp:1000,maxHp:1000,speed:.32,damage:52,cooldown:0,path:[{x:10,y:7}],repath:99}];const hp=gate.hp;g.tick(.1);assert.ok(hp-gate.hp>=52*1.7-.001);assert.ok(g.enemies[0].attackUntil>g.time);
});
test('fortification junctions update when an adjacent section is demolished',()=>{
 const g=new Game();g.buildings=[];const a=g.add('wall',10,12),b=g.add('wall',11,12);g.add('gate',10,13);assert.deepEqual(g.fortificationLinks(a),[[1,0],[0,1]]);assert.equal(g.demolish(b.id),true);assert.deepEqual(g.fortificationLinks(a),[[0,1]]);
});
test('saving a loaded porter preserves the cargo, destination and gate state without duplicate delivery',()=>{
 const g=new Game();for(let i=0;i<600&&!g.villagers.some(w=>w.role==='porter'&&w.cargo>0);i++)g.tick(.1);
 const porter=g.villagers.find(w=>w.role==='porter'&&w.cargo>0);assert.ok(porter);const gate=g.buildings.find(b=>b.type==='gate');g.toggleGate(gate.id);
 const saved=g.snapshot(),copy=Game.restore(JSON.parse(JSON.stringify(saved)));assert.ok(copy);assert.deepEqual(copy.snapshot(),saved);advance(g,30);advance(copy,30);assert.deepEqual(copy.resources,g.resources);assert.equal(copy.at(gate.x,gate.y).open,true);
 const legacy=JSON.parse(JSON.stringify(saved));delete legacy.villagers;delete legacy.workforceKey;assert.equal(Game.restore(legacy).villagers.length,6);
 saved.villagers[0].cargo=-1;assert.equal(Game.restore(saved),null);
});
test('removing a workshop removes its workers and stored goods, and collapse effects expire',()=>{
 const g=new Game(),lumber=g.buildings.find(b=>b.type==='lumber');lumber.hp=0;g.tick(.1);assert.ok(!g.villagers.some(w=>w.buildingId===lumber.id));assert.ok(g.effects.some(e=>e.type==='collapse'));advance(g,3);assert.ok(!g.effects.some(e=>e.type==='collapse'));
});
