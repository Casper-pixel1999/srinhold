import {createState,applyCommand,buildingAt,buildReason,BUILD_ERRORS,createSimulation} from './state.js';
import {loadAssets} from './assets.js';
import {Renderer,zoomAt} from './render.js';
import {connectInput} from './input.js';
import {createLocalPlatform} from './platform.js';

const $=id=>document.getElementById(id),state=createState(),simulation=createSimulation(state),platform=createLocalPlatform();
for(const button of document.querySelectorAll('button'))button.disabled=true;
let renderer,building=false,preview=null,paused=false,lastTime=performance.now(),toastTimer;
function toast(message){$('toast').textContent=message;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').textContent='',3500);}
function update(){
  for(const [key,value]of Object.entries(state.resources))$(key).textContent=value;
  $('build').setAttribute('aria-pressed',String(building));document.body.classList.toggle('building',building);
  $('confirmation').hidden=!building;
  $('pause').textContent=paused?'Продолжить':'Пауза';$('pause').setAttribute('aria-pressed',String(paused));$('paused').hidden=!paused;
  if(building){const reason=preview?buildReason(state,preview.x,preview.y):null;$('confirm').disabled=!preview||!!reason;$('placement').textContent=!preview?'Выберите свободную клетку':reason?BUILD_ERRORS[reason]:'Дом · 35 дерева · 15 золота';}
  $('clock').textContent=`Время: ${String(Math.floor(state.tick/600)).padStart(2,'0')}:${String(Math.floor(state.tick/10)%60).padStart(2,'0')}`;
}
function cancel(){applyCommand(state,{type:'cancel'});building=false;preview=null;if(renderer)renderer.preview=null;update();}
function tap(tile,point){
  if(building){preview=tile;renderer.preview=tile;update();return;}
  const b=buildingAt(state,tile.x,tile.y)||renderer.pickBuilding(point.x,point.y);renderer.selected=b?.id||null;
  $('selection').textContent=b?(b.type==='keep'?'Янтарная крепость':'Дом'):'Ваше поселение';
  $('hint').textContent=b?'Выбрано здание поселения':'Выберите дом или место для постройки';
}
$('build').onclick=()=>{if(building){cancel();return;}building=true;preview=null;renderer.preview=null;update();};
$('cancel').onclick=cancel;
$('confirm').onclick=()=>{if(!preview)return;const result=applyCommand(state,{type:'buildHouse',...preview});if(!result.ok){toast(BUILD_ERRORS[result.reason]);update();return;}renderer.selected=result.building.id;cancel();$('selection').textContent='Дом';$('hint').textContent='Новый дом построен';toast('Дом построен');update();};
$('pause').onclick=()=>{paused=!paused;lastTime=performance.now();simulation.advance(0,false);platform.setGameplayActive(!paused&&!document.hidden);update();};
window.addEventListener('keydown',e=>{if(e.key==='Escape')cancel();});
document.addEventListener('visibilitychange',()=>{lastTime=performance.now();simulation.advance(0,false);platform.setGameplayActive(!paused&&!document.hidden);});

async function start(){
  try{
    await platform.init();renderer=new Renderer($('map'),await loadAssets(),state);connectInput($('map'),renderer,tap);
    $('zoom-in').onclick=()=>zoomAt(renderer.camera,1.2,renderer.width/2,renderer.height/2);
    $('zoom-out').onclick=()=>zoomAt(renderer.camera,1/1.2,renderer.width/2,renderer.height/2);
    $('reset').onclick=()=>renderer.reset();
    new ResizeObserver(()=>renderer.resize()).observe($('world'));
    for(const button of document.querySelectorAll('button'))button.disabled=false;
    $('loading').hidden=true;platform.ready();platform.setGameplayActive(true);lastTime=performance.now();update();
    function frame(now){simulation.advance((now-lastTime)/1000,!paused&&!document.hidden);lastTime=now;renderer.draw();update();requestAnimationFrame(frame);}
    requestAnimationFrame(frame);
  }catch(error){console.error(error);$('loading').textContent='Не удалось загрузить долину. Обновите страницу, чтобы повторить.';}
}
start();
