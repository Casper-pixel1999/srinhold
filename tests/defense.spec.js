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
 test(`${name} real defense, gate tactics, combat restore and victory/restart`,async({browser,baseURL})=>{
  test.setTimeout(80000);const touch=name!=='desktop',context=await browser.newContext({baseURL,viewport:{width,height},isMobile:touch,hasTouch:touch}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400||r.url().includes('/legacy/'))errors.push(r.url());});
  try{
   await page.goto('/');await expect(page.locator('#loading')).toBeHidden();await page.locator('#pause').click();
   for(const [type,x,y]of [['wall',11,12],['wall',12,11],['wall',12,13],['gate',13,12],['tower',14,11],['guard',14,12]])await construct(page,type,x,y,touch);
   await expect(page.locator('#stone')).toHaveText('44');await expect(page.locator('#gold')).toHaveText('70');await tile(page,13,12,touch);await expect(page.locator('#gate-toggle')).toHaveText('Открыть ворота');await page.locator('#gate-toggle').click();await expect(page.locator('#hint')).toContainText('враги проходят');await page.locator('#gate-toggle').click();await expect(page.locator('#hint')).toContainText('закрыты');
   await page.locator('#siege').click();await expect(page.locator('#siege-status')).toContainText('через 20 с');await page.waitForTimeout(300);await expect(page.locator('#siege-status')).toContainText('через 20 с');
   await page.locator('#save').click();const warned=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);await page.reload();await expect(page.locator('#loading')).toBeHidden();await expect(page.locator('#siege-status')).toContainText('через 20 с');await page.locator('#save').click();expect(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key)).toEqual(warned);
   await page.locator('#pause').click();await expect(page.locator('#siege-status')).toContainText('Осада',{timeout:27000});await page.locator('#pause').click();await page.locator('#save').click();const fighting=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);expect(fighting.state.enemies.length).toBeGreaterThan(0);expect(fighting.state.siege.phase).toBe('active');
   await page.locator('#reset').click();if(touch)for(let i=0;i<2;i++)await page.locator('#zoom-out').click();await page.screenshot({path:`evidence/AK-004-${name}.png`});
   await page.reload();await expect(page.locator('#loading')).toBeHidden();await page.locator('#save').click();expect(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key)).toEqual(fighting);await page.locator('#pause').click();
   await expect(page.locator('#battle-result')).toContainText('Победа',{timeout:25000});await expect(page.locator('#restart')).toBeVisible();await page.locator('#save').click();const finished=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);expect(finished.state.siege.killed).toBe(3);expect(finished.state.enemies).toHaveLength(0);expect(finished.state.buildings.find(b=>b.type==='keep').hp).toBeGreaterThan(0);
   await page.waitForTimeout(500);await page.locator('#save').click();expect(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key)).toEqual(finished);
   await page.screenshot({path:`evidence/AK-004-${name}-victory.png`});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   await page.locator('#restart').click();await expect(page.locator('#battle-result')).toBeHidden();await expect(page.locator('#siege')).toBeEnabled();await expect(page.locator('#stone')).toHaveText('100');await page.locator('#save').click();const reset=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);expect(reset.state.siege.phase).toBe('preparing');expect(reset.state.buildings).toHaveLength(3);expect(reset.state.units).toHaveLength(0);expect(errors).toEqual([]);
  }finally{await context.close();}
 });
}
for(const mobile of [false,true])test(`undefended siege defeat and saved restart ${mobile?'mobile':'desktop'}`,async({browser,baseURL})=>{
 test.setTimeout(70000);const context=await browser.newContext({baseURL,viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile}),page=await context.newPage();try{
  await page.goto('/');await expect(page.locator('#loading')).toBeHidden();await page.locator('#siege').click();await expect(page.locator('#battle-result')).toContainText('Поражение',{timeout:55000});await page.locator('#save').click();const lost=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);expect(lost.state.buildings.find(b=>b.type==='keep').hp).toBe(0);await page.reload();await expect(page.locator('#loading')).toBeHidden();await expect(page.locator('#battle-result')).toContainText('Поражение');await expect(page.locator('#build-wall')).toBeDisabled();await page.locator('#restart').click();await expect(page.locator('#battle-result')).toBeHidden();await expect(page.locator('#build-wall')).toBeEnabled();await page.reload();await expect(page.locator('#loading')).toBeHidden();await expect(page.locator('#siege')).toBeEnabled();
 }finally{await context.close();}
});
