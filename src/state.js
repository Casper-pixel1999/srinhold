import {HEALTH,createSiege,stepCombat} from './combat.js';
export const SIZE = 24;

export const BUILDINGS = Object.freeze({
  wall: Object.freeze({name:'Стена',cost:Object.freeze({wood:0,stone:8,gold:0}),capacity:0,width:76}),
  gate: Object.freeze({name:'Ворота',cost:Object.freeze({wood:15,stone:12,gold:0}),capacity:0,width:80}),
  tower: Object.freeze({name:'Башня',cost:Object.freeze({wood:25,stone:20,gold:15}),capacity:0,width:76}),
  guard: Object.freeze({name:'Страж',cost:Object.freeze({wood:0,gold:15,food:10}),capacity:0,width:28}),
  house: Object.freeze({name:'Дом', cost:Object.freeze({wood:35,gold:15}), capacity:6, width:88}),
  farm: Object.freeze({name:'Ферма', cost:Object.freeze({wood:45,gold:20}), capacity:0, width:96, produces:'food', rate:2}),
  lumber: Object.freeze({name:'Лесоруб', cost:Object.freeze({wood:25,gold:25}), capacity:0, width:100, produces:'wood', rate:1.5})
});
export const BUILD_ERRORS = Object.freeze({
  finished:'Осада завершена. Начните заново', spawn:'Оставьте свободным восточный вход (20, 12)', outside:'Выберите клетку на карте', terrain:'Стройте только на свободном лугу',
  occupied:'Эта клетка уже занята', resources:'Не хватает ресурсов',
  forest:'Лесорубу нужна соседняя клетка леса'
});

export function terrainAt(x, y) {
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= SIZE || y >= SIZE) return 'outside';
  if(x===20&&y===12)return 'grass'; // Siege landing; AK-003 could not build on this former water cell.
  if (x >= 20 || (x >= 18 && y > 16)) return 'water';
  if ((x < 5 && y < 12) || (y < 4 && x < 17) || (x < 7 && y > 18)) return 'forest';
  if (x >= 15 && x <= 17 && y >= 13 && y <= 16) return 'rock';
  return 'grass';
}

export function createState() {
  return {schemaVersion:2, mapId:'valley', tick:0, nextId:4, simulationRemainder:0,
    resources:{wood:150,stone:100,food:100,gold:100}, population:12, growthSeconds:0,
    siege:createSiege(),units:[],enemies:[],
    buildings:[{id:1,type:'keep',x:12,y:12,hp:HEALTH.keep},{id:2,type:'house',x:10,y:12,hp:HEALTH.house},{id:3,type:'house',x:12,y:15,hp:HEALTH.house}]};
}

export function buildingAt(state, x, y) { return state.buildings.find(b => b.x === x && b.y === y) || null; }
export function housingCapacity(state) { return state.buildings.reduce((capacity,b)=>capacity+(b.type==='keep'?8:BUILDINGS[b.type]?.capacity||0),0); }
export function hasAdjacentForest(x,y) {
  return [[x-1,y],[x+1,y],[x,y-1],[x,y+1]].some(([nx,ny])=>terrainAt(nx,ny)==='forest');
}

export function buildReason(state, x, y, type='house') {
  if (['victory','defeat'].includes(state.siege.phase))return 'finished';
  if(x===20&&y===12)return 'spawn';
  if (!Object.hasOwn(BUILDINGS,type)) return 'outside';
  const terrain=terrainAt(x,y);
  if (terrain==='outside') return 'outside';
  if (terrain!=='grass') return 'terrain';
  if (buildingAt(state,x,y)||state.units.some(u=>u.x===x&&u.y===y)||state.enemies.some(u=>u.x===x&&u.y===y)) return 'occupied';
  if (Object.entries(BUILDINGS[type].cost).some(([key,cost])=>state.resources[key]<cost)) return 'resources';
  if (type==='lumber'&&!hasAdjacentForest(x,y)) return 'forest';
  return null;
}

export function applyCommand(state, command) {
  if (command.type==='cancel') return {ok:true};
  if(command.type==='startSiege'){if(state.siege.phase!=='preparing')return {ok:false};state.siege.phase='warning';state.siege.warningTicks=200;return {ok:true};}
  if(command.type==='toggleGate'){const gate=state.buildings.find(b=>b.id===command.id&&b.type==='gate');if(!gate||['victory','defeat'].includes(state.siege.phase))return {ok:false};gate.open=!gate.open;return {ok:true};}
  if(command.type==='restart'){Object.assign(state,createState());return {ok:true};}
  const type=command.type==='buildHouse'?'house':command.type==='buildBuilding'?command.buildingType:null;
  if (!type) return {ok:false,reason:'outside'};
  const reason=buildReason(state,command.x,command.y,type);
  if (reason) return {ok:false,reason};
  for(const [key,cost]of Object.entries(BUILDINGS[type].cost))state.resources[key]-=cost;
  const building={id:state.nextId++,type,x:command.x,y:command.y,hp:HEALTH[type]};
  if(type==='gate')building.open=false;
  if(type==='tower'||type==='guard')building.cooldown=0;
  if(type==='guard')state.units.push(building);else state.buildings.push(building);
  return {ok:true,building};
}

function step(state) {
  const rates={wood:0,food:0};
  for (const building of state.buildings) {
    const data=BUILDINGS[building.type];
    if (data?.produces) rates[data.produces]+=data.rate;
  }
  state.resources.wood=Math.max(0,(Number.isFinite(state.resources.wood)?state.resources.wood:0)+rates.wood*.1);
  state.resources.food=Math.max(0,(Number.isFinite(state.resources.food)?state.resources.food:0)+rates.food*.1-state.population*.04*.1);
  state.resources.stone=Number.isFinite(state.resources.stone)?Math.max(0,state.resources.stone):0;
  state.resources.gold=Number.isFinite(state.resources.gold)?Math.max(0,state.resources.gold):0;
  const capacity=housingCapacity(state);
  if (state.resources.food<10||state.population>=capacity) state.growthSeconds=0;
  else {
    state.growthSeconds+=.1;
    if (state.growthSeconds>=30-1e-9) {
      state.population=Math.min(capacity,state.population+1);
      state.growthSeconds=0;
    }
  }
  stepCombat(state,terrainAt);state.population=Math.min(state.population,housingCapacity(state));
  state.tick++;
}

// Fixed-step economy and clock; inactive time is discarded, never caught up.
export function createSimulation(state) {

  return {advance(seconds,active) {
    if (['victory','defeat'].includes(state.siege.phase))return;
    if (!active) { state.simulationRemainder=0; return; }
    state.simulationRemainder+=Number.isFinite(seconds)?Math.max(0,Math.min(seconds,.25)):0;
    while (state.simulationRemainder>=.1-1e-9) { step(state);state.simulationRemainder=Math.max(0,state.simulationRemainder-.1);if(['victory','defeat'].includes(state.siege.phase)){state.simulationRemainder=0;break;} }
  }};
}
