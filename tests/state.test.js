import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,terrainAt,applyCommand,buildReason,createSimulation,BUILDINGS,housingCapacity,hasAdjacentForest} from '../src/state.js';

function run(state,seconds){const sim=createSimulation(state);for(let i=0;i<Math.round(seconds*10);i++)sim.advance(.1,true);}
function build(state,type,x,y){return applyCommand(state,{type:'buildBuilding',buildingType:type,x,y});}

test('deterministic serializable state and all four terrain types',()=>{assert.deepEqual(createState(),createState());assert.deepEqual(JSON.parse(JSON.stringify(createState())),createState());assert.equal(terrainAt(0,0),'forest');assert.equal(terrainAt(16,14),'rock');assert.equal(terrainAt(22,12),'water');assert.equal(terrainAt(13,12),'grass');});
test('house creates one stable ID and charges exactly once',()=>{const state=createState();assert.equal(applyCommand(state,{type:'buildHouse',x:13,y:12}).ok,true);assert.equal(state.buildings.length,4);assert.deepEqual(state.resources,{wood:115,stone:100,food:100,gold:85});assert.equal(state.buildings.at(-1).id,4);const snapshot=structuredClone(state);assert.equal(applyCommand(state,{type:'buildHouse',x:13,y:12}).reason,'occupied');assert.deepEqual(state,snapshot);});
test('terrain, occupancy, bounds and insufficient stock reject atomically',()=>{for(const [x,y,reason]of [[0,0,'terrain'],[16,14,'terrain'],[22,12,'terrain'],[12,12,'occupied'],[-1,2,'outside'],[1.5,2,'outside']]){const state=createState(),before=structuredClone(state);assert.equal(applyCommand(state,{type:'buildHouse',x,y}).reason,reason);assert.deepEqual(state,before);}for(const resource of ['wood','gold']){const state=createState();state.resources[resource]=0;const before=structuredClone(state);assert.equal(buildReason(state,13,12),'resources');assert.equal(applyCommand(state,{type:'buildHouse',x:13,y:12}).ok,false);assert.deepEqual(state,before);}});
test('cancel never mutates state',()=>{const state=createState(),before=structuredClone(state);applyCommand(state,{type:'cancel'});assert.deepEqual(state,before);});
test('fixed-step determinism, pause discards inactive time, long frames bounded',()=>{const a=createState(),b=createState(),simA=createSimulation(a),simB=createSimulation(b);for(let i=0;i<100;i++)simA.advance(.01,true);for(let i=0;i<10;i++)simB.advance(.1,true);assert.equal(a.tick,10);assert.equal(a.tick,b.tick);simA.advance(30,false);assert.equal(a.tick,10);simA.advance(.1,true);assert.equal(a.tick,11);simA.advance(100,true);assert.ok(a.tick<=14);});

test('each building cost, rejection and cancellation remain atomic',()=>{
  for(const [type,x,y]of [['house',13,12],['farm',14,12],['lumber',5,8]]){
    const state=createState();assert.equal(build(state,type,x,y).ok,true);assert.equal(state.resources.wood,150-BUILDINGS[type].cost.wood);assert.equal(state.resources.gold,100-BUILDINGS[type].cost.gold);
    const snapshot=structuredClone(state);assert.equal(build(state,type,x,y).reason,'occupied');applyCommand(state,{type:'cancel'});assert.deepEqual(state,snapshot);
    for(const [bx,by,reason]of [[0,0,'terrain'],[22,12,'terrain'],[24,12,'outside'],[12,12,'occupied']]){assert.equal(build(state,type,bx,by).reason,reason);assert.deepEqual(state,snapshot);}
    for(const resource of ['wood','gold']){const poor=createState();poor.resources[resource]=0;const before=structuredClone(poor);assert.equal(build(poor,type,x,y).reason,'resources');assert.deepEqual(poor,before);}
  }
});
test('lumber requires cardinal forest adjacency, not diagonals',()=>{
  assert.equal(hasAdjacentForest(5,8),true);assert.equal(hasAdjacentForest(5,12),false);
  const state=createState(),before=structuredClone(state);assert.equal(build(state,'lumber',13,12).reason,'forest');assert.equal(build(state,'lumber',5,12).reason,'forest');assert.deepEqual(state,before);assert.equal(build(state,'lumber',5,8).ok,true);
});
test('exact 10-second economy keeps fractions and reserves; pause freezes all economy',()=>{
  const state=createState();build(state,'farm',13,12);build(state,'lumber',5,8);assert.equal(state.resources.wood,80);assert.equal(state.resources.gold,55);run(state,10);
  assert.ok(Math.abs(state.resources.wood-95)<1e-8);assert.ok(Math.abs(state.resources.food-115.2)<1e-8);assert.equal(state.population,12);assert.equal(state.resources.stone,100);assert.equal(state.resources.gold,55);
  const before=structuredClone(state);createSimulation(state).advance(100,false);assert.deepEqual(state,before);
});
test('growth requires 30 continuous eligible seconds and housing',()=>{
  const state=createState();assert.equal(housingCapacity(state),20);run(state,29.9);assert.equal(state.population,12);run(state,.1);assert.equal(state.population,13);
  state.population=20;state.growthSeconds=29.9;run(state,.1);assert.equal(state.growthSeconds,0);assert.equal(state.population,20);build(state,'house',13,12);assert.equal(housingCapacity(state),26);run(state,29.9);assert.equal(state.population,20);run(state,.1);assert.equal(state.population,21);
});
test('food shortage resets growth; empty food stays finite and a farm restores growth',()=>{
  const state=createState();state.resources.food=9;state.growthSeconds=29.9;run(state,.1);assert.equal(state.growthSeconds,0);assert.equal(state.population,12);run(state,60);assert.equal(state.resources.food,0);assert.equal(state.population,12);
  build(state,'farm',13,12);run(state,6.5);assert.equal(state.population,12);assert.equal(state.growthSeconds,0);run(state,29.9);assert.equal(state.population,12);run(state,.2);assert.equal(state.population,13);assert.ok(Number.isFinite(state.resources.food));
});
test('300-second expansion is deterministic, bounded by housing and never double-charges',()=>{
  const play=()=>{const state=createState();build(state,'farm',13,12);build(state,'lumber',5,8);run(state,180);assert.equal(state.population,18);build(state,'house',14,12);const stock=structuredClone(state.resources);assert.equal(build(state,'house',14,12).reason,'occupied');assert.deepEqual(state.resources,stock);run(state,120);return state;};
  const a=play(),b=play();assert.deepEqual(a,b);assert.equal(a.tick,3000);assert.equal(a.population,22);assert.equal(housingCapacity(a),26);assert.equal(a.resources.gold,40);assert.equal(a.resources.stone,100);assert.equal(a.buildings.length,6);for(const value of Object.values(a.resources))assert.ok(Number.isFinite(value)&&value>=0);
});
