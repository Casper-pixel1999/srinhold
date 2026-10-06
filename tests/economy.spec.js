import {test,expect} from '@playwright/test';
import {project} from '../src/render.js';
test.describe.configure({mode:'parallel'});

async function ready(page){await page.goto('/');await expect(page.locator('#loading')).toBeHidden();await page.locator('#pause').click();}
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
function track(page){const failures=[];page.on('pageerror',e=>failures.push(e.message));page.on('console',m=>{if(m.type()==='error')failures.push(m.text());});page.on('response',r=>{if(r.status()>=400||r.url().includes('/legacy/'))failures.push(r.url());});return failures;}

for(const [name,width,height]of [['desktop',1440,900],['mobile',390,844],['landscape',844,390]]){
  test(`${name} production buildings, atomic validation and 30s real economy`,async({browser,baseURL})=>{
    test.setTimeout(60000);
    const touch=name!=='desktop',context=await browser.newContext({baseURL,viewport:{width,height},hasTouch:touch,isMobile:touch}),page=await context.newPage(),failures=track(page);
    try{
      await ready(page);await expect(page.locator('#residents')).toHaveText('12');await expect(page.locator('#capacity')).toHaveText('20');
      await page.locator('#build-lumber').click();await tile(page,13,12,touch);await expect(page.locator('#placement')).toContainText('соседняя клетка леса');await expect(page.locator('#confirm')).toBeDisabled();await expect(page.locator('#wood')).toHaveText('150');await expect(page.locator('#gold')).toHaveText('100');await page.locator('#cancel').click();
      for(const type of ['farm','lumber']){
        await page.locator(`#build-${type}`).click();await tile(page,12,12,touch);await expect(page.locator('#placement')).toContainText('уже занята');await expect(page.locator('#confirm')).toBeDisabled();await page.locator('#cancel').click();
        await page.locator(`#build-${type}`).click();await tile(page,16,14,touch);await expect(page.locator('#placement')).toContainText('лугу');await expect(page.locator('#confirm')).toBeDisabled();await page.locator('#cancel').click();
        await page.locator(`#build-${type}`).click();await tile(page,type==='farm'?13:5,type==='farm'?12:8,touch);await expect(page.locator('#confirm')).toBeEnabled();await page.locator('#cancel').click();await expect(page.locator('#wood')).toHaveText('150');await expect(page.locator('#gold')).toHaveText('100');
      }
      await construct(page,'farm',13,12,touch);await expect(page.locator('#selection')).toHaveText('Ферма');await expect(page.locator('#hint')).toContainText('2 еды/с');await expect(page.locator('#wood')).toHaveText('105');await expect(page.locator('#gold')).toHaveText('80');
      await construct(page,'lumber',5,8,touch);await expect(page.locator('#selection')).toHaveText('Лесоруб');await expect(page.locator('#hint')).toContainText('1,5 дерева/с');await expect(page.locator('#wood')).toHaveText('80');await expect(page.locator('#gold')).toHaveText('55');
      const frozen=await page.locator('#food').textContent();await page.waitForTimeout(500);await expect(page.locator('#food')).toHaveText(frozen);await expect(page.locator('#wood')).toHaveText('80');
      await page.locator('#pause').click();await expect(page.locator('#paused')).toBeHidden();
      await expect.poll(async()=>Number(await page.locator('#residents').textContent()),{timeout:40000,intervals:[500]}).toBe(13);
      await page.locator('#pause').click();expect(Number(await page.locator('#wood').textContent())).toBeGreaterThanOrEqual(125);expect(Number(await page.locator('#food').textContent())).toBeGreaterThan(140);await expect(page.locator('#gold')).toHaveText('55');await expect(page.locator('#stone')).toHaveText('100');
      await construct(page,'house',14,12,touch);await expect(page.locator('#capacity')).toHaveText('26');await expect(page.locator('#gold')).toHaveText('40');
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      for(const button of await page.locator('button:visible').all()){const r=await button.boundingBox();expect(r.width).toBeGreaterThanOrEqual(44);expect(r.height).toBeGreaterThanOrEqual(44);}
      await page.locator('#reset').click();if(name==='landscape')for(let i=0;i<5;i++)await page.locator('#zoom-out').click();await page.locator('#pause').click();await page.screenshot({path:`evidence/AK-002-${name}.png`});expect(failures).toEqual([]);
    }finally{await context.close();}
  });
}
