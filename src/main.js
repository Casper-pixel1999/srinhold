import {createState,applyCommand,buildingAt,buildReason,BUILD_ERRORS,BUILDINGS,housingCapacity,createSimulation} from './state.js';
import {loadAssets} from './assets.js';
import {Renderer,zoomAt} from './render.js';
import {connectInput} from './input.js';
import {createLocalPlatform} from './platform.js';

const $=id=>document.getElementById(id),state=createState(),simulation=createSimulation(state),platform=createLocalPlatform();
for(const button of document.querySelectorAll('button'))button.disabled=true;
let renderer,buildingMode=false,selectedBuilding='house',preview=null,paused=false,lastTime=performance.now(),toastTimer;
function toast(message){$('toast').textContent=message;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').textContent='',3500);}
function showSelection(building){
  renderer.selected=building?.id||null;
  $('selection').textContent=building?(building.type==='keep'?'Янтарная крепость':BUILDINGS[building.type]?.name||'Постройка'):'Ваше поселение';
  if(building?.type==='farm')$('hint').textContent='Производство: 2 еды/с';
  else if(building?.type==='lumber')$('hint').textContent='Добыча: 1,5 дерева/с';
  else if(building?.type==='keep')$('hint').textContent='Вместимость крепости: 8 жителей';
  else if(building?.type==='house')$('hint').textContent='Вместимость дома: 6 жителей';
  else $('hint').textContent='Выберите постройку и место';
}
function update(){
  for(const [key,value]of Object.entries(state.resources))$(key).textContent=String(Math.round(Math.max(0,value)));
  const capacity=housingCapacity(state);$('residents').textContent=String(state.population);$('capacity').textContent=String(capacity);
  $('settlement-status').textContent=state.population>=capacity?'Жильё заполнено':state.resources.food<10?'Нехватка еды':'Поселение растёт';
  for(const button of document.querySelectorAll('.build-card'))button.setAttribute('aria-pressed',String(buildingMode&&button.dataset.building===selectedBuilding));
  document.body.classList.toggle('building',buildingMode);$('confirmation').hidden=!buildingMode;
  $('pause').textContent=paused?'Продолжить':'Пауза';$('pause').setAttribute('aria-pressed',String(paused));$('paused').hidden=!paused;
  if(buildingMode){const reason=preview?buildReason(state,preview.x,preview.y,selectedBuilding):null;$('confirm').disabled=!preview||!!reason;$('placement').textContent=!preview?'Выберите свободную клетку':reason?BUILD_ERRORS[reason]:`${BUILDINGS[selectedBuilding].name} · ${BUILDINGS[selectedBuilding].cost.wood} дерева · ${BUILDINGS[selectedBuilding].cost.gold} золота`;}
  $('clock').textContent=`Время: ${String(Math.floor(state.tick/600)).padStart(2,'0')}:${String(Math.floor(state.tick/10)%60).padStart(2,'0')}`;
}
function cancel(){applyCommand(state,{type:'cancel'});buildingMode=false;preview=null;if(renderer)renderer.preview=null;update();}
function tap(tile,point){
  if(buildingMode){preview={...tile,type:selectedBuilding};renderer.preview=preview;update();return;}
  showSelection(buildingAt(state,tile.x,tile.y)||renderer.pickBuilding(point.x,point.y));update();
}
for(const button of document.querySelectorAll('.build-card'))button.onclick=()=>{selectedBuilding=button.dataset.building;buildingMode=true;preview=null;if(renderer)renderer.preview=null;update();};
$('cancel').onclick=cancel;
$('confirm').onclick=()=>{
  if(!preview)return;
  const type=selectedBuilding,result=applyCommand(state,{type:'buildBuilding',buildingType:type,x:preview.x,y:preview.y});
  if(!result.ok){toast(BUILD_ERRORS[result.reason]);update();return;}
  const name=BUILDINGS[type].name;renderer.selected=result.building.id;cancel();showSelection(result.building);toast(`${name} ${type==='farm'?'построена':'построен'}`);update();
};
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
