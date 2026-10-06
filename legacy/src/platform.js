const KEY='amber-keep-save-v1';
export class Platform{
 constructor(){this.sdk=null;this.player=null;this.active=false;this.pending=null;this.cloudTimer=null;this.language='ru';}
 async init(){
  const local=['localhost','127.0.0.1',''].includes(location.hostname);
  try{if(!window.YaGames&&!local){await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='/sdk.js';s.onload=resolve;s.onerror=reject;document.head.append(s);setTimeout(()=>reject(new Error('SDK timeout')),8000);});}
   if(window.YaGames){this.sdk=await Promise.race([window.YaGames.init(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('SDK init timeout')),8000))]);this.language=this.sdk.environment?.i18n?.lang==='en'?'en':'ru';try{this.player=await Promise.race([this.sdk.getPlayer({scopes:false}),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Player timeout')),5000))]);}catch{}}
  }catch{console.info('Amber Keep: standalone mode');}
 }
 ready(){this.sdk?.features?.LoadingAPI?.ready();}
 gameplay(active){if(active===this.active)return;this.active=active;try{this.sdk?.features?.GameplayAPI?.[active?'start':'stop']();}catch{}}
 async load(){let local=null;try{local=JSON.parse(localStorage.getItem(KEY));}catch{}let cloud=null;try{if(this.player)cloud=(await Promise.race([this.player.getData(['amberSave']),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Cloud timeout')),5000))]))?.amberSave;}catch{}return cloud&&(!local||cloud.savedAt>local.savedAt)?cloud:local;}
 async rewarded(){if(!this.sdk?.adv?.showRewardedVideo)return false;return new Promise(resolve=>{let rewarded=false;try{this.sdk.adv.showRewardedVideo({callbacks:{onRewarded:()=>{rewarded=true;},onClose:()=>resolve(rewarded),onError:()=>resolve(false)}});}catch{resolve(false);}});}
 save(game,immediate=false){const data={savedAt:Date.now(),game:game.snapshot()};try{localStorage.setItem(KEY,JSON.stringify(data));}catch{}this.pending=data;if(this.player){clearTimeout(this.cloudTimer);if(immediate)this.flush();else this.cloudTimer=setTimeout(()=>this.flush(),5000);}return data;}
 async flush(){if(!this.player||!this.pending)return;const data=this.pending;this.pending=null;try{await this.player.setData({amberSave:data},true);}catch{this.pending=data;}}
 onPause(fn){this.sdk?.on?.('game_api_pause',()=>fn(true));this.sdk?.on?.('game_api_resume',()=>fn(false));}
}
