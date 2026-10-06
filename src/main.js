import {createState,applyCommand,buildingAt,buildReason,BUILD_ERRORS,BUILDINGS,housingCapacity,createSimulation} from './state.js';
import {loadAssets} from './assets.js';
import {Renderer,zoomAt} from './render.js';
import {connectInput} from './input.js';
import {createLocalPlatform} from './platform.js';
import {HEALTH,WAVE_SIZE} from './combat.js';

const $=id=>document.getElementById(id),state=createState(),simulation=createSimulation(state),platform=createLocalPlatform();
for(const button of document.querySelectorAll('button'))button.disabled=true;
let renderer,buildingMode=false,selectedBuilding='house',preview=null,paused=false,lastTime=performance.now(),toastTimer,automaticSaving=true,lastSave=performance.now();
function save(manual=false){
  if(!manual&&!automaticSaving)return;
  const result=platform.save(state,paused);lastSave=performance.now();
  automaticSaving=result.status==='saved';
  if(manual||!automaticSaving)toast(automaticSaving?'Поселение сохранено':'Сохранение недоступно. Можно продолжать игру.');
}
function load(initial=false){
  const result=platform.load();
  if(result.status==='loaded'){
    Object.assign(state,result.state);paused=result.paused;lastTime=performance.now();lastSave=lastTime;automaticSaving=true;
    if(renderer){cancel();showSelection(null);renderer.reset();update();platform.setGameplayActive(!paused&&!document.hidden);}
    if(!initial)toast('Поселение восстановлено');
  }else if(result.status!=='empty'||!initial){
    if(result.status!=='empty')automaticSaving=false;
    toast(result.status==='empty'?'Сохранение не найдено':result.status==='invalid'?'Не удалось восстановить сохранение. Поселение не изменено.':'Сохранение недоступно. Можно продолжать игру.');
  }
}
$('save').onclick=()=>save(true);
$('load').onclick=()=>load();
function toast(message){$('toast').textContent=message;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').textContent='',3500);}
function showSelection(building){
  renderer.selected=building?.id||null;
  $('selection').textContent=building?(building.type==='keep'?'Янтарная крепость':BUILDINGS[building.type]?.name||'Постройка'):'Ваше поселение';
  if(building?.type==='farm')$('hint').textContent='Производство: 2 еды/с';
  else if(building?.type==='lumber')$('hint').textContent='Добыча: 1,5 дерева/с';
  else if(building?.type==='keep')$('hint').textContent='Вместимость крепости: 8 жителей';
  else if(building?.type==='house')$('hint').textContent='Вместимость дома: 6 жителей';
  else if(building)$('hint').textContent=building.type==='guard'?'Страж держит позицию · дальность 2 клетки':building.type==='tower'?'Дальность 4 клетки · прикрывайте проход':building.type==='gate'?(building.open?'Ворота открыты: враги проходят':'Ворота закрыты: враги ищут обход или ломают'):'Стена перекрывает клетку: закрывайте обходы';
  else $('hint').textContent='Выберите постройку и место';
  if(building)$('hint').textContent+=` · Прочность ${building.hp}/${HEALTH[building.type]}`;
}
function update(){
  for(const [key,value]of Object.entries(state.resources))$(key).textContent=String(Math.round(Math.max(0,value)));
  const capacity=housingCapacity(state);$('residents').textContent=String(state.population);$('capacity').textContent=String(capacity);
  $('settlement-status').textContent=state.population>=capacity?'Жильё заполнено':state.resources.food<10?'Нехватка еды':'Поселение растёт';
  const finished=['victory','defeat'].includes(state.siege.phase);
  for(const button of document.querySelectorAll('[data-building]')){button.setAttribute('aria-pressed',String(buildingMode&&button.dataset.building===selectedBuilding));button.disabled=finished;}
  const gate=state.buildings.find(b=>b.id===renderer?.selected&&b.type==='gate');$('gate-toggle').hidden=!gate||finished;if(gate)$('gate-toggle').textContent=gate.open?'Закрыть ворота':'Открыть ворота';
  $('siege').disabled=state.siege.phase!=='preparing';$('restart').hidden=!finished;
  const messages={preparing:'Подготовка: укрепите восточный подход',warning:`Налёт с востока через ${Math.ceil(state.siege.warningTicks/10)} с · 3 врага`,active:`Осада · врагов ${state.enemies.length} · побеждено ${state.siege.killed}/${WAVE_SIZE}`,victory:'Победа! Налёт отражён',defeat:'Поражение. Янтарная крепость разрушена'};
  $('siege-status').textContent=messages[state.siege.phase];$('battle-result').hidden=!finished;$('battle-result').textContent=finished?`${messages[state.siege.phase]}. Нажмите «Заново».`:'';
  document.body.classList.toggle('building',buildingMode);$('confirmation').hidden=!buildingMode;
  $('pause').textContent=paused?'Продолжить':'Пауза';$('pause').setAttribute('aria-pressed',String(paused));$('paused').hidden=!paused;
  if(buildingMode){const reason=preview?buildReason(state,preview.x,preview.y,selectedBuilding):null;$('confirm').disabled=!preview||!!reason;const labels={wood:'дерева',stone:'камня',gold:'золота',food:'еды'},cost=Object.entries(BUILDINGS[selectedBuilding].cost).filter(([,value])=>value>0).map(([key,value])=>`${value} ${labels[key]}`).join(' · ');$('placement').textContent=reason?BUILD_ERRORS[reason]:`${preview?'': 'Выберите клетку · '}${BUILDINGS[selectedBuilding].name} · ${cost}`;}
  $('clock').textContent=`Время: ${String(Math.floor(state.tick/600)).padStart(2,'0')}:${String(Math.floor(state.tick/10)%60).padStart(2,'0')}`;
}
function cancel(){applyCommand(state,{type:'cancel'});buildingMode=false;preview=null;if(renderer)renderer.preview=null;update();}
function tap(tile,point){
  if(buildingMode){preview={...tile,type:selectedBuilding};renderer.preview=preview;update();return;}
  showSelection(buildingAt(state,tile.x,tile.y)||state.units.find(u=>u.x===tile.x&&u.y===tile.y)||renderer.pickBuilding(point.x,point.y));update();
}
for(const button of document.querySelectorAll('[data-building]'))button.onclick=()=>{selectedBuilding=button.dataset.building;buildingMode=true;preview=null;if(renderer)renderer.preview=null;update();};
$('gate-toggle').onclick=()=>{applyCommand(state,{type:'toggleGate',id:renderer.selected});showSelection(state.buildings.find(b=>b.id===renderer.selected));update();};
$('siege').onclick=()=>{cancel();applyCommand(state,{type:'startSiege'});toast('Налёт с востока через 20 секунд. Защитите крепость!');update();};
$('restart').onclick=()=>{applyCommand(state,{type:'restart'});paused=false;lastTime=performance.now();cancel();showSelection(null);renderer.reset();save(true);platform.setGameplayActive(!document.hidden);update();};
$('cancel').onclick=cancel;
$('confirm').onclick=()=>{
  if(!preview)return;
  const type=selectedBuilding,result=applyCommand(state,{type:'buildBuilding',buildingType:type,x:preview.x,y:preview.y});
  if(!result.ok){toast(BUILD_ERRORS[result.reason]);update();return;}
  const name=BUILDINGS[type].name;renderer.selected=result.building.id;cancel();showSelection(result.building);toast(`${name} ${type==='farm'?'построена':'построен'}`);update();
};
$('pause').onclick=()=>{paused=!paused;lastTime=performance.now();simulation.advance(0,false);platform.setGameplayActive(!paused&&!document.hidden);update();};
window.addEventListener('keydown',e=>{if(e.key==='Escape')cancel();});
document.addEventListener('visibilitychange',()=>{lastTime=performance.now();simulation.advance(0,false);platform.setGameplayActive(!paused&&!document.hidden);if(document.hidden&&renderer)save();});
window.addEventListener('pagehide',()=>{if(renderer)save();});

async function start(){
  try{
    await platform.init();load(true);renderer=new Renderer($('map'),await loadAssets(),state);connectInput($('map'),renderer,tap);
    $('zoom-in').onclick=()=>zoomAt(renderer.camera,1.2,renderer.width/2,renderer.height/2);
    $('zoom-out').onclick=()=>zoomAt(renderer.camera,1/1.2,renderer.width/2,renderer.height/2);
    $('reset').onclick=()=>renderer.reset();
    new ResizeObserver(()=>renderer.resize()).observe($('world'));
    for(const button of document.querySelectorAll('button'))button.disabled=false;
    $('loading').hidden=true;platform.ready();platform.setGameplayActive(!paused&&!document.hidden);lastTime=performance.now();update();
    function frame(now){simulation.advance((now-lastTime)/1000,!paused&&!document.hidden);lastTime=now;if(automaticSaving&&now-lastSave>=15000)save();renderer.draw();update();requestAnimationFrame(frame);}
    requestAnimationFrame(frame);
  }catch(error){console.error(error);$('loading').textContent='Не удалось загрузить долину. Обновите страницу, чтобы повторить.';}
}
start();
