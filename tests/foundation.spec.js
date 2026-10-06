import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import {project,zoomAt} from '../src/render.js';
import {nativeBrowser} from './native-browser.js';

const errors=new WeakMap();
test.beforeEach(async({page})=>{
  const problems=[];errors.set(page,problems);
  page.on('pageerror',e=>problems.push(e.message));
  page.on('console',m=>{if(m.type()==='error')problems.push(m.text());});
  page.on('response',r=>{if(r.status()>=400)problems.push(`${r.status()} ${r.url()}`);if(r.url().includes('/legacy/'))problems.push('legacy runtime request');});
  await page.goto('/');await expect(page.locator('#loading')).toBeHidden();
});
test.afterEach(async({page})=>{expect(errors.get(page)).toEqual([]);});

async function initialCamera(page){const r=await page.locator('#map').boundingBox(),zoom=r.width<600?.82:1.05;return {x:r.width/2,y:r.height*.55-480*zoom,zoom,rect:r};}
function screen(camera,x,y){const p=project(x,y);return {x:camera.rect.x+camera.x+p.x*camera.zoom,y:camera.rect.y+camera.y+p.y*camera.zoom};}
async function tap(page,camera,x,y,touch=false){const p=screen(camera,x,y);if(touch)await page.touchscreen.tap(p.x,p.y);else await page.mouse.click(p.x,p.y);}
async function stock(page,wood,gold){await expect(page.locator('#wood')).toHaveText(String(wood));await expect(page.locator('#gold')).toHaveText(String(gold));}

test('desktop build validation/cancel/exhaustion, selection and screenshot',async({page})=>{
  const c=await initialCamera(page);await tap(page,c,10,12);await expect(page.locator('#selection')).toHaveText('Дом');
  await page.locator('#build').click();await tap(page,c,12,12);await expect(page.locator('#placement')).toContainText('уже занята');await expect(page.locator('#confirm')).toBeDisabled();await stock(page,150,100);
  await tap(page,c,16,14);await expect(page.locator('#placement')).toContainText('лугу');await stock(page,150,100);
  await tap(page,c,13,12);await expect(page.locator('#confirm')).toBeEnabled();await page.locator('#cancel').click();await stock(page,150,100);
  await page.locator('#build').click();await tap(page,c,13,12);await page.keyboard.press('Escape');await expect(page.locator('#confirmation')).toBeHidden();await stock(page,150,100);
  for(const [index,[x,y]]of [[13,12],[14,12],[13,13],[14,13]].entries()){
    await page.locator('#build').click();await tap(page,c,x,y);await page.locator('#confirm').click();await stock(page,150-(index+1)*35,100-(index+1)*15);
    if(index===0){await mkdir('evidence',{recursive:true});await page.screenshot({path:'evidence/AK-001-desktop.png'});}
  }
  await page.locator('#build').click();await tap(page,c,11,13);await expect(page.locator('#placement')).toContainText('Не хватает');await expect(page.locator('#confirm')).toBeDisabled();await stock(page,10,40);
  await page.locator('#cancel').click();const house=screen(c,13,12);await page.mouse.click(house.x,house.y-25);await expect(page.locator('#selection')).toHaveText('Дом');
});

test('drag/wheel/zoom buttons/reset preserve picking and cannot place accidentally',async({page})=>{
  const c=await initialCamera(page),a=screen(c,11,11);
  await page.locator('#build').click();await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(a.x+75,a.y+32,{steps:8});await page.mouse.up();await expect(page.locator('#confirm')).toBeDisabled();await stock(page,150,100);c.x+=75;c.y+=32;
  const anchor=screen(c,13,12);await page.mouse.move(anchor.x,anchor.y);await page.mouse.wheel(0,-140);zoomAt(c,Math.exp(.21),anchor.x-c.rect.x,anchor.y-c.rect.y);await page.waitForTimeout(80);await tap(page,c,13,12);await page.locator('#confirm').click();await stock(page,115,85);
  await page.locator('#zoom-in').click();zoomAt(c,1.2,c.rect.width/2,c.rect.height/2);await page.locator('#zoom-out').click();zoomAt(c,1/1.2,c.rect.width/2,c.rect.height/2);
  await tap(page,c,10,12);await expect(page.locator('#selection')).toHaveText('Дом');
  await page.locator('#reset').click();const reset=await initialCamera(page);await tap(page,reset,12,12);await expect(page.locator('#selection')).toHaveText('Янтарная крепость');
});

test('pause and real native tab hide/resume discard inactive time',async({page})=>{
  await expect.poll(async()=>page.locator('#clock').textContent()).not.toBe('Время: 00:00');
  await page.locator('#pause').click();const paused=await page.locator('#clock').textContent();await page.waitForTimeout(1100);await expect(page.locator('#clock')).toHaveText(paused);
  const native=await nativeBrowser();
  try{
    const target=await native.send('Target.createTarget',{url:'about:blank'});
    const {sessionId}=await native.send('Target.attachToTarget',{targetId:target.targetId,flatten:true});
    const evaluate=async expression=>(await native.send('Runtime.evaluate',{expression,returnByValue:true},sessionId)).result.value;
    await native.send('Page.enable',{},sessionId);await native.send('Page.navigate',{url:page.url()},sessionId);
    await native.send('Target.activateTarget',{targetId:target.targetId});
    await expect.poll(()=>evaluate('document.getElementById("loading")?.hidden')).toBe(true);
    await native.send('Target.activateTarget',{targetId:target.targetId});await expect.poll(()=>evaluate('document.visibilityState')).toBe('visible');
    const other=await native.send('Target.createTarget',{url:'about:blank'});await native.send('Target.activateTarget',{targetId:other.targetId});
    await expect.poll(()=>evaluate('document.visibilityState')).toBe('hidden');
    const hidden=await evaluate('document.getElementById("clock").textContent');await page.waitForTimeout(1500);expect(await evaluate('document.getElementById("clock").textContent')).toBe(hidden);
    await native.send('Target.activateTarget',{targetId:target.targetId});await expect.poll(()=>evaluate('document.visibilityState')).toBe('visible');expect(await evaluate('document.getElementById("clock").textContent')).toBe(hidden);
    await expect.poll(()=>evaluate('document.getElementById("clock").textContent')).not.toBe(hidden);
  }finally{await native.close();}
});

for(const [name,width,height]of [['mobile',390,844],['landscape',844,390]]){
  test(`${name} real touch build/drag/pinch and responsive evidence`,async({browser})=>{
    const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true});const page=await context.newPage(),problems=[];
    page.on('pageerror',e=>problems.push(e.message));page.on('response',r=>{if(r.status()>=400||r.url().includes('/legacy/'))problems.push(r.url());});
    await page.goto('/');await expect(page.locator('#loading')).toBeHidden();
    await expect(page.locator('html')).toHaveAttribute('lang','ru');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    for(const button of await page.locator('button:visible').all()){const box=await button.boundingBox();expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);}
    await page.locator('#build').tap();let c=await initialCamera(page);
    const session=await context.newCDPSession(page),start=screen(c,12,12),touch=(x,y,id=1)=>({x,y,id});
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch(start.x,start.y)]});
    for(let i=1;i<=6;i++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[touch(start.x+i*8,start.y+i*3)]});
    await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect(page.locator('#confirm')).toBeDisabled();await stock(page,150,100);c.x+=48;c.y+=18;
    const center={x:width/2,y:c.rect.y+c.rect.height*.5},spacing=40;
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch(center.x-spacing,center.y,1),touch(center.x+spacing,center.y,2)]});
    for(let i=1;i<=5;i++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[touch(center.x-spacing-i*4,center.y,1),touch(center.x+spacing+i*4,center.y,2)]});
    await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect(page.locator('#confirm')).toBeDisabled();await stock(page,150,100);
    zoomAt(c,1.5,center.x-c.rect.x,center.y-c.rect.y);await tap(page,c,13,12,true);await expect(page.locator('#confirm')).toBeEnabled();await page.locator('#confirm').tap();await stock(page,115,85);await expect(page.locator('#selection')).toHaveText('Дом');await page.locator('#reset').tap();
    await page.locator('#build').tap();c=await initialCamera(page);await tap(page,c,14,12,true);await page.locator('#cancel').tap();await stock(page,115,85);
    await page.locator('#pause').tap();await expect(page.locator('#paused')).toBeVisible();await page.locator('#pause').tap();await expect(page.locator('#paused')).toBeHidden();await mkdir('evidence',{recursive:true});await page.screenshot({path:`evidence/AK-001-${name}.png`});expect(problems).toEqual([]);await context.close();
  });
}
