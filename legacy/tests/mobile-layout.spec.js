import {test,expect} from '@playwright/test';

async function assertUncovered(page){
 await expect.poll(async()=>page.evaluate(()=>{
  const r=window.__amber.renderer,t=r.target;if(!t)return false;
  const p=r.project(t.x,t.y),rect=document.querySelector('#game-canvas').getBoundingClientRect();
  const points=[{x:p.x,y:p.y},{x:p.x-16,y:p.y},{x:p.x+16,y:p.y},{x:p.x,y:p.y+10},{x:p.x,y:p.y-88*r.scale-18}];
  return points.every(q=>document.elementFromPoint(q.x+rect.left,q.y+rect.top)?.id==='game-canvas');
 })).toBe(true);
}
async function place(page){await assertUncovered(page);const p=await page.evaluate(()=>{const r=window.__amber.renderer,p=r.project(r.target.x,r.target.y),rect=document.querySelector('#game-canvas').getBoundingClientRect();return{x:p.x+rect.left,y:p.y+rect.top};});await page.touchscreen.tap(p.x,p.y);}
for(const viewport of [{width:393,height:640},{width:393,height:600},{width:360,height:540},{width:320,height:568},{width:412,height:700},{width:844,height:390}]){
 test(`tutorial leaves the plot and its label uncovered at ${viewport.width}x${viewport.height}`,async({browser})=>{
  const context=await browser.newContext({viewport,isMobile:true,hasTouch:true});const page=await context.newPage();await page.goto('/?test=1');await page.getByRole('button',{name:'Начать кампанию',exact:true}).click();await page.locator('#guide-action').tap();await page.locator('#guide-action').tap();await place(page);
  await expect(page.getByRole('heading',{name:'2. Наймите двух лучников'})).toBeVisible();await page.locator('#guide-action').tap();await page.locator('#guide-action').tap();await page.locator('#guide-action').tap();await assertUncovered(page);
  if(viewport.width===393&&viewport.height===640)await page.screenshot({path:'publishing/mobile-tutorial-fixed.png'});
  await place(page);await expect(page.getByRole('heading',{name:'Поселение готово к обороне'})).toBeVisible();await context.close();
 });
}
test('camera keeps the highlighted plot clear when the browser viewport shrinks',async({browser})=>{
 const context=await browser.newContext({viewport:{width:393,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();await page.goto('/?test=1');await page.getByRole('button',{name:'Начать кампанию',exact:true}).click();await page.locator('#guide-action').tap();await page.locator('#guide-action').tap();await assertUncovered(page);await page.setViewportSize({width:393,height:600});await place(page);await expect(page.getByRole('heading',{name:'2. Наймите двух лучников'})).toBeVisible();await context.close();
});
