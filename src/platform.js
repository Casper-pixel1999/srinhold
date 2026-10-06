import {SAVE_KEY,serializeSave,restoreSave} from './save.js';
export function createLocalPlatform(storageProvider=()=>globalThis.localStorage) {
  return {async init(){},ready(){},setGameplayActive(){},
    load(){try{const raw=storageProvider().getItem(SAVE_KEY);if(raw===null)return {status:'empty'};const save=restoreSave(raw);return save?{status:'loaded',...save}:{status:'invalid'};}catch{return {status:'unavailable'};}},
    save(state,paused){try{storageProvider().setItem(SAVE_KEY,serializeSave(state,paused));return {status:'saved'};}catch{return {status:'unavailable'};}},
    async showRewarded(){return false;},onPause(){}};
}
