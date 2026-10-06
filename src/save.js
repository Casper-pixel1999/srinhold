import {BUILDINGS,SIZE,terrainAt,hasAdjacentForest,housingCapacity} from './state.js';
export const SAVE_KEY='amber-keep-rebuild-save-v1';
const exact=(value,keys)=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(k=>Object.hasOwn(value,k));
const integer=value=>Number.isSafeInteger(value)&&value>=0;
const finite=value=>Number.isFinite(value)&&value>=0&&value<=Number.MAX_SAFE_INTEGER;
export function validState(s){
  if(!exact(s,['schemaVersion','mapId','tick','nextId','resources','population','growthSeconds','simulationRemainder','buildings'])||s.schemaVersion!==1||s.mapId!=='valley'||!integer(s.tick)||!integer(s.nextId)||!integer(s.population)||!finite(s.growthSeconds)||s.growthSeconds>=30||!finite(s.simulationRemainder)||s.simulationRemainder>=.1)return false;
  if(!exact(s.resources,['wood','stone','food','gold'])||!Object.values(s.resources).every(finite)||!Array.isArray(s.buildings)||!s.buildings.length||s.buildings.length>SIZE*SIZE)return false;
  const ids=new Set(),tiles=new Set();let keeps=0,maxId=0;
  for(const b of s.buildings){
    if(!exact(b,['id','type','x','y'])||!integer(b.id)||b.id===0||ids.has(b.id)||!integer(b.x)||!integer(b.y)||terrainAt(b.x,b.y)!=='grass'||tiles.has(`${b.x},${b.y}`))return false;
    if(b.type==='keep'){if(b.x!==12||b.y!==12)return false;keeps++;}
    else if(typeof b.type!=='string'||!Object.hasOwn(BUILDINGS,b.type)||(b.type==='lumber'&&!hasAdjacentForest(b.x,b.y)))return false;
    ids.add(b.id);tiles.add(`${b.x},${b.y}`);maxId=Math.max(maxId,b.id);
  }
  return keeps===1&&s.nextId>maxId&&s.population<=housingCapacity(s);
}
export function serializeSave(state,paused){
  const {schemaVersion,mapId,tick,nextId,resources,population,growthSeconds,simulationRemainder,buildings}=state;
  const snapshot={schemaVersion,mapId,tick,nextId,resources:{...resources},population,growthSeconds,simulationRemainder,buildings:buildings.map(({id,type,x,y})=>({id,type,x,y}))};
  if(!validState(snapshot)||typeof paused!=='boolean')throw new Error('Invalid save');
  return JSON.stringify({schemaVersion:1,state:snapshot,paused});
}
export function restoreSave(raw){
  try{
    if(typeof raw!=='string'||raw.length>1000000)return null;
    const save=JSON.parse(raw);
    return exact(save,['schemaVersion','state','paused'])&&save.schemaVersion===1&&typeof save.paused==='boolean'&&validState(save.state)?save:null;
  }catch{return null;}
}
