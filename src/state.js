export const SIZE = 24;
export const HOUSE_COST = Object.freeze({wood: 35, gold: 15});
export const BUILD_ERRORS = Object.freeze({outside:'Выберите клетку на карте',terrain:'Стройте только на свободном лугу',occupied:'Эта клетка уже занята',resources:'Не хватает дерева или золота'});

export function terrainAt(x, y) {
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= SIZE || y >= SIZE) return 'outside';
  if (x >= 20 || (x >= 18 && y > 16)) return 'water';
  if ((x < 5 && y < 12) || (y < 4 && x < 17) || (x < 7 && y > 18)) return 'forest';
  if (x >= 15 && x <= 17 && y >= 13 && y <= 16) return 'rock';
  return 'grass';
}

export function createState() {
  return {schemaVersion:1, mapId:'valley', tick:0, nextId:4,
    resources:{wood:150,stone:100,food:100,gold:100},
    buildings:[{id:1,type:'keep',x:12,y:12},{id:2,type:'house',x:10,y:12},{id:3,type:'house',x:12,y:15}]};
}

export function buildingAt(state, x, y) { return state.buildings.find(b => b.x === x && b.y === y) || null; }
export function buildReason(state, x, y) {
  const terrain = terrainAt(x, y);
  if (terrain === 'outside') return 'outside';
  if (terrain !== 'grass') return 'terrain';
  if (buildingAt(state,x,y)) return 'occupied';
  if (state.resources.wood < HOUSE_COST.wood || state.resources.gold < HOUSE_COST.gold) return 'resources';
  return null;
}

export function applyCommand(state, command) {
  if (command.type === 'cancel') return {ok:true};
  if (command.type !== 'buildHouse') return {ok:false,reason:'outside'};
  const reason = buildReason(state,command.x,command.y);
  if (reason) return {ok:false,reason};
  state.resources.wood -= HOUSE_COST.wood;
  state.resources.gold -= HOUSE_COST.gold;
  const building = {id:state.nextId++,type:'house',x:command.x,y:command.y};
  state.buildings.push(building);
  return {ok:true,building};
}

// Time is stepped independently of drawing; inactive time is discarded, never caught up.
export function createSimulation(state) {
  let accumulator = 0;
  return {advance(seconds, active) {
    if (!active) { accumulator = 0; return; }
    accumulator += Math.max(0,Math.min(seconds,0.25));
    while (accumulator >= 0.1 - 1e-9) { state.tick++; accumulator -= 0.1; }
  }};
}
