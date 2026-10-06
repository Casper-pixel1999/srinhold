import {test,expect} from '@playwright/test';
import {project} from '../src/render.js';
const key='amber-keep-rebuild-save-v1';
test.describe.configure({mode:'parallel'});
async function tile(page,x,y,touch=false){
  await page.locator('#reset').click();const r=await page.locator('#map').boundingBox(),zoom=r.width<600?.82:1.05,p=project(x,y);
  let sx=r.x+r.width/2+p.x*zoom,sy=r.y+r.height*.55+(p.y-480)*zoom;
  if(sx<r.x+40||sx>r.x+r.width-40||sy<r.y+45||sy>r.y+r.height-35){
    const destination={x:r.x+r.width*.5,y:r.y+r.height*.6},start={x:r.x+r.width*.5,y:r.y+r.height*.5},dx=destination.x-sx,dy=destination.y-sy;
    if(touch){const session=await page.context().newCDPSession(page);await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:start.x,y:start.y,id:1}]});for(let i=1;i<=12;i++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x+dx*i/12,y:start.y+dy*i/12,id:1}]});await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await session.detach();}
    else{await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(start.x+dx,start.y+dy,{steps:12});await page.mouse.up();}
    sx+=dx;sy+=dy;
  }
  if(touch)await page.touchscreen.tap(sx,sy);else await page.mouse.click(sx,sy);
}
async function construct(page,type,x,y,touch=false){
  if(touch)await page.locator(`#build-${type}`).tap();else await page.locator(`#build-${type}`).click();
  await tile(page,x,y,touch);await expect(page.locator('#confirm')).toBeEnabled();
  if(touch)await page.locator('#confirm').tap();else await page.locator('#confirm').click();
}

for(const [name,width,height]of [['desktop',1440,900],['mobile',390,844],['landscape',844,390]]){
 test(`${name} built settlement saves, reloads and resumes exactly`,async({browser,baseURL})=>{
  test.setTimeout(60000);const touch=name!=='desktop',context=await browser.newContext({baseURL,viewport:{width,height},hasTouch:touch,isMobile:touch}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto('/');await expect(page.locator('#loading')).toBeHidden();await page.locator('#pause').click();
   await page.evaluate(()=>localStorage.setItem('amber-keep-save-v8','legacy-sentinel'));
   await construct(page,'farm',13,12,touch);await construct(page,'lumber',5,8,touch);await construct(page,'house',14,12,touch);
   await page.locator('#pause').click();await expect(page.locator('#residents')).toHaveText('13',{timeout:40000});await page.locator('#pause').click();await page.locator('#save').click();await expect(page.locator('#toast')).toHaveText('Поселение сохранено');
   const saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);expect(saved.state.buildings).toHaveLength(6);expect(saved.state.tick).toBeGreaterThanOrEqual(300);expect(saved.state.population).toBe(13);
   await page.reload();await expect(page.locator('#loading')).toBeHidden();await expect(page.locator('#pause')).toHaveText('Продолжить');
   for(const [resource,value]of Object.entries(saved.state.resources))await expect(page.locator(`#${resource}`)).toHaveText(String(Math.round(value)));
   await expect(page.locator('#residents')).toHaveText('13');await expect(page.locator('#capacity')).toHaveText('26');expect(await page.locator('#clock').textContent()).toBe(`Время: 00:${String(Math.floor(saved.state.tick/10)%60).padStart(2,'0')}`);
   for(const [x,y,title]of [[13,12,'Ферма'],[5,8,'Лесоруб'],[14,12,'Дом']]){await tile(page,x,y,touch);await expect(page.locator('#selection')).toHaveText(title);}
   await page.locator('#save').click();expect(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key)).toEqual(saved);
   await page.locator('#pause').click();await page.waitForTimeout(1200);await page.locator('#pause').click();await page.locator('#save').click();const resumed=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);expect(resumed.state.tick).toBeGreaterThan(saved.state.tick);expect(resumed.state.resources.wood).toBeGreaterThan(saved.state.resources.wood);expect(resumed.state.resources.food).toBeGreaterThan(saved.state.resources.food);
   await page.locator('#load').click();await expect(page.locator('#toast')).toHaveText('Поселение восстановлено');expect(await page.evaluate(()=>localStorage.getItem('amber-keep-save-v8'))).toBe('legacy-sentinel');
   await page.locator('#reset').click();if(name==='landscape')for(let i=0;i<5;i++)await page.locator('#zoom-out').click();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:`evidence/AK-003-${name}.png`});expect(errors).toEqual([]);
  }finally{await context.close();}
 });
}
test('corrupt saves and unavailable storage leave gameplay usable',async({page})=>{
 await page.addInitScript(k=>{localStorage.setItem(k,'corrupt');localStorage.setItem('amber-keep-save-v8','legacy');},key);
 await page.goto('/');await expect(page.locator('#loading')).toBeHidden();await expect(page.locator('#toast')).toContainText('Не удалось восстановить');await page.locator('#pause').click();await construct(page,'farm',13,12);await page.locator('#load').click();await expect(page.locator('#wood')).toHaveText('105');await expect(page.locator('#capacity')).toHaveText('20');await page.waitForTimeout(15100);expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe('corrupt');
 await page.locator('#save').click();await expect(page.locator('#toast')).toHaveText('Поселение сохранено');
 await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('Quota','QuotaExceededError');};});await page.locator('#save').click();await expect(page.locator('#toast')).toContainText('Можно продолжать');await construct(page,'house',14,12);await expect(page.locator('#capacity')).toHaveText('26');
});
test('storage access blocked at startup still permits building',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError');}}));await page.goto('/');await expect(page.locator('#loading')).toBeHidden();await expect(page.locator('#toast')).toContainText('Можно продолжать');await page.locator('#pause').click();await construct(page,'house',14,12);await expect(page.locator('#capacity')).toHaveText('26');await page.locator('#load').click();await expect(page.locator('#toast')).toContainText('Можно продолжать');await expect(page.locator('#wood')).toHaveText('115');
});
test('active lifecycle reload and periodic autosave continue without offline catch-up',async({page})=>{
 await page.goto('/');await expect(page.locator('#loading')).toBeHidden();await page.locator('#pause').click();await construct(page,'farm',13,12);await page.locator('#pause').click();await page.waitForTimeout(1100);
 await page.reload();await expect(page.locator('#loading')).toBeHidden();await expect(page.locator('#pause')).toHaveText('Пауза');await expect(page.locator('#gold')).toHaveText('80');
 const before=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).state.tick,key);await expect.poll(async()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)).state.tick,key),{timeout:18000}).toBeGreaterThan(before);await page.locator('#pause').click();await page.locator('#save').click();const saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
 await page.evaluate(k=>{const v=JSON.parse(localStorage.getItem(k));v.state.nextId=1;localStorage.setItem(k,JSON.stringify(v));},key);await page.locator('#load').click();await expect(page.locator('#toast')).toContainText('Не удалось восстановить');await page.locator('#save').click();expect(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key)).toEqual(saved);
});
