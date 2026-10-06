import {BUILDINGS,SIZE,terrainAt,hasAdjacentForest,housingCapacity} from './state.js';
import {HEALTH,createSiege,WAVE_SIZE,WARNING_TICKS} from './combat.js';
export const SAVE_KEY='amber-keep-rebuild-save-v1';
const exact=(v,keys)=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const integer=v=>Number.isSafeInteger(v)&&v>=0;
const finite=v=>Number.isFinite(v)&&v>=0&&v<=Number.MAX_SAFE_INTEGER;
const cooldown=v=>integer(v)&&v<=10;
export function validState(s,old=false){
 const keys=['schemaVersion','mapId','tick','nextId','resources','population','growthSeconds','simulationRemainder','buildings'];
 if(!old)keys.push('siege','units','enemies');
 if(!exact(s,keys)||s.schemaVersion!==(old?1:2)||s.mapId!=='valley'||!integer(s.tick)||!integer(s.nextId)||!integer(s.population)||!finite(s.growthSeconds)||s.growthSeconds>=30||!finite(s.simulationRemainder)||s.simulationRemainder>=.1)return false;
 if(!exact(s.resources,['wood','stone','food','gold'])||!Object.values(s.resources).every(finite)||!Array.isArray(s.buildings)||!s.buildings.length||s.buildings.length>SIZE*SIZE)return false;
 const ids=new Set(),tiles=new Set();let keeps=0,maxId=0,keepHp=0;
 function identity(b){if(!integer(b.id)||b.id===0||ids.has(b.id)||!integer(b.x)||!integer(b.y))return false;ids.add(b.id);maxId=Math.max(maxId,b.id);return true;}
 for(const b of s.buildings){
  const fields=['id','type','x','y'];if(!old){fields.push('hp');if(b.type==='gate')fields.push('open');if(b.type==='tower')fields.push('cooldown');}
  if(!exact(b,fields)||!identity(b)||terrainAt(b.x,b.y)!=='grass'||(b.x===20&&b.y===12)||tiles.has(`${b.x},${b.y}`))return false;
  if(b.type==='keep'){if(b.x!==12||b.y!==12)return false;keeps++;keepHp=old?HEALTH.keep:b.hp;}
  else if(typeof b.type!=='string'||!Object.hasOwn(BUILDINGS,b.type)||b.type==='guard'||(old&&!['house','farm','lumber'].includes(b.type))||(b.type==='lumber'&&!hasAdjacentForest(b.x,b.y)))return false;
  if(!old&&(!finite(b.hp)||b.hp>HEALTH[b.type]||(b.type!=='keep'&&b.hp===0)||(b.type==='gate'&&typeof b.open!=='boolean')||(b.type==='tower'&&!cooldown(b.cooldown))))return false;
  tiles.add(`${b.x},${b.y}`);
 }
 if(!old){
  const w=s.siege;
  if(!exact(w,['phase','warningTicks','spawned','spawnTicks','killed'])||!['preparing','warning','active','victory','defeat'].includes(w.phase)||!integer(w.warningTicks)||w.warningTicks>WARNING_TICKS||!integer(w.spawned)||w.spawned>WAVE_SIZE||!integer(w.spawnTicks)||w.spawnTicks>20||!integer(w.killed)||w.killed>w.spawned||!Array.isArray(s.units)||s.units.length>SIZE*SIZE||!Array.isArray(s.enemies)||s.enemies.length>WAVE_SIZE)return false;
  for(const u of s.units){if(!exact(u,['id','type','x','y','hp','cooldown'])||!identity(u)||u.type!=='guard'||terrainAt(u.x,u.y)!=='grass'||(u.x===20&&u.y===12)||tiles.has(`${u.x},${u.y}`)||!finite(u.hp)||u.hp<=0||u.hp>HEALTH.guard||!cooldown(u.cooldown))return false;tiles.add(`${u.x},${u.y}`);}
  for(const e of s.enemies){if(!exact(e,['id','type','x','y','hp','cooldown','moveTicks'])||!identity(e)||e.type!=='raider'||!['grass','forest'].includes(terrainAt(e.x,e.y))||!finite(e.hp)||e.hp<=0||e.hp>HEALTH.raider||!cooldown(e.cooldown)||!integer(e.moveTicks)||e.moveTicks>8)return false;const b=s.buildings.find(b=>b.x===e.x&&b.y===e.y);if(b&&b.type!=='gate')return false;}
  if(w.spawned-w.killed!==s.enemies.length||((w.phase==='preparing'||w.phase==='warning')&&(w.spawned!==0||w.killed!==0||w.spawnTicks!==0))||(w.phase==='warning'&&w.warningTicks===0)||(w.phase!=='warning'&&w.warningTicks!==0)||(w.phase==='victory'&&(w.killed!==WAVE_SIZE||keepHp===0))||(w.phase==='defeat'&&keepHp!==0)||(w.phase!=='defeat'&&keepHp===0))return false;
 }
 return keeps===1&&s.nextId>maxId&&s.population<=housingCapacity(s);
}
export function serializeSave(state,paused){
 const {schemaVersion,mapId,tick,nextId,resources,population,growthSeconds,simulationRemainder,buildings,siege,units,enemies}=state;
 const snapshot=structuredClone({schemaVersion,mapId,tick,nextId,resources,population,growthSeconds,simulationRemainder,buildings,siege,units,enemies});
 if(!validState(snapshot)||typeof paused!=='boolean')throw new Error('Invalid save');
 return JSON.stringify({schemaVersion:2,state:snapshot,paused});
}
export function restoreSave(raw){
 try{
  if(typeof raw!=='string'||raw.length>1000000)return null;const save=JSON.parse(raw);
  if(!exact(save,['schemaVersion','state','paused'])||typeof save.paused!=='boolean')return null;
  if(save.schemaVersion===1&&validState(save.state,true)){
   save.schemaVersion=2;save.state.schemaVersion=2;save.state.siege=createSiege();save.state.units=[];save.state.enemies=[];for(const b of save.state.buildings)b.hp=HEALTH[b.type];return save;
  }
  return save.schemaVersion===2&&validState(save.state)?save:null;
 }catch{return null;}
}
