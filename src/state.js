export const SIZE = 24;

export const BUILDINGS = Object.freeze({
  house: Object.freeze({name:'Дом', cost:Object.freeze({wood:35,gold:15}), capacity:6, width:88}),
  farm: Object.freeze({name:'Ферма', cost:Object.freeze({wood:45,gold:20}), capacity:0, width:96, produces:'food', rate:2}),
  lumber: Object.freeze({name:'Лесоруб', cost:Object.freeze({wood:25,gold:25}), capacity:0, width:100, produces:'wood', rate:1.5})
});
export const BUILD_ERRORS = Object.freeze({
  outside:'Выберите клетку на карте', terrain:'Стройте только на свободном лугу',
  occupied:'Эта клетка уже занята', resources:'Не хватает дерева или золота',
  forest:'Лесорубу нужна соседняя клетка леса'
});

export function terrainAt(x, y) {
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= SIZE || y >= SIZE) return 'outside';
  if (x >= 20 || (x >= 18 && y > 16)) return 'water';
  if ((x < 5 && y < 12) || (y < 4 && x < 17) || (x < 7 && y > 18)) return 'forest';
  if (x >= 15 && x <= 17 && y >= 13 && y <= 16) return 'rock';
  return 'grass';
}

export function createState() {
  return {schemaVersion:1, mapId:'valley', tick:0, nextId:4, simulationRemainder:0,
    resources:{wood:150,stone:100,food:100,gold:100}, population:12, growthSeconds:0,
    buildings:[{id:1,type:'keep',x:12,y:12},{id:2,type:'house',x:10,y:12},{id:3,type:'house',x:12,y:15}]};
}

export function buildingAt(state, x, y) { return state.buildings.find(b => b.x === x && b.y === y) || null; }
export function housingCapacity(state) { return state.buildings.reduce((capacity,b)=>capacity+(b.type==='keep'?8:BUILDINGS[b.type]?.capacity||0),0); }
export function hasAdjacentForest(x,y) {
  return [[x-1,y],[x+1,y],[x,y-1],[x,y+1]].some(([nx,ny])=>terrainAt(nx,ny)==='forest');
}

export function buildReason(state, x, y, type='house') {
  if (!BUILDINGS[type]) return 'outside';
  const terrain=terrainAt(x,y);
  if (terrain==='outside') return 'outside';
  if (terrain!=='grass') return 'terrain';
  if (buildingAt(state,x,y)) return 'occupied';
  const {wood,gold}=BUILDINGS[type].cost;
  if (state.resources.wood<wood||state.resources.gold<gold) return 'resources';
  if (type==='lumber'&&!hasAdjacentForest(x,y)) return 'forest';
  return null;
}

export function applyCommand(state, command) {
  if (command.type==='cancel') return {ok:true};
  const type=command.type==='buildHouse'?'house':command.type==='buildBuilding'?command.buildingType:null;
  if (!type) return {ok:false,reason:'outside'};
  const reason=buildReason(state,command.x,command.y,type);
  if (reason) return {ok:false,reason};
  const {wood,gold}=BUILDINGS[type].cost;
  state.resources.wood-=wood;state.resources.gold-=gold;
  const building={id:state.nextId++,type,x:command.x,y:command.y};
  state.buildings.push(building);
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
  state.tick++;
}

// Fixed-step economy and clock; inactive time is discarded, never caught up.
export function createSimulation(state) {

  return {advance(seconds,active) {
    if (!active) { state.simulationRemainder=0; return; }
    state.simulationRemainder+=Number.isFinite(seconds)?Math.max(0,Math.min(seconds,.25)):0;
    while (state.simulationRemainder>=.1-1e-9) { step(state);state.simulationRemainder=Math.max(0,state.simulationRemainder-.1); }
  }};
}
