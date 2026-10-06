import {test,expect} from '@playwright/test';
async function start(page){await page.goto('/?test=1');await page.getByRole('button',{name:'Начать кампанию',exact:true}).click();await expect(page.locator('#modal')).toBeHidden();await page.locator('#skip-guide').click();}
async function clickTile(page,x,y,z=0){const p=await page.evaluate(({x,y,z})=>{const a=window.__amber.renderer.project(x,y,z),rect=document.querySelector('canvas').getBoundingClientRect();return{x:a.x+rect.left,y:a.y+rect.top};},{x,y,z});await page.mouse.click(p.x,p.y);}
test('desktop: construct, recruit, upgrade, pause, save, reload, language and siege',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await start(page);
 await page.locator('[data-type="farm"]').click();await clickTile(page,9,14);
 expect(await page.evaluate(()=>window.__amber.game.at(9,14)?.type)).toBe('farm');
 await page.keyboard.press('Escape');await clickTile(page,9,14,10);await expect(page.locator('#upgrade')).toBeVisible();await page.locator('#upgrade').click();expect(await page.evaluate(()=>window.__amber.game.at(9,14).level)).toBe(2);
 await page.locator('#detail-close').click();await page.locator('[data-tab="army"]').click();await page.locator('[data-type="archer"]').click();expect(await page.evaluate(()=>window.__amber.game.units.length)).toBe(4);
 await page.locator('[data-type="rally"]').click();await clickTile(page,10,6);expect(await page.evaluate(()=>window.__amber.game.units.every(u=>u.target?.y===6))).toBe(true);
 await page.locator('#pause').click();const time=await page.evaluate(()=>window.__amber.game.time);await page.waitForTimeout(300);expect(await page.evaluate(()=>window.__amber.game.time)).toBe(time);await page.getByRole('button',{name:'Продолжить',exact:true}).click();
 await page.locator('#settings').click();await page.locator('#language').selectOption('en');await expect(page.getByRole('heading',{name:'Settings'})).toBeVisible();await page.getByRole('button',{name:'Continue',exact:true}).click();await page.locator('#call-wave').click();expect(await page.evaluate(()=>window.__amber.game.waveActive)).toBe(true);await page.locator('#pause').click();
 await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).click();expect(await page.evaluate(()=>window.__amber.game.wave)).toBe(1);expect(await page.evaluate(()=>window.__amber.game.at(9,14).level)).toBe(2);
 expect(errors).toEqual([]);
});
test('mobile: touch builds, panning and zoom controls remain accessible',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();await start(page);
 await page.mouse.move(100,470);await page.mouse.down();await page.mouse.move(330,470,{steps:8});await page.mouse.up();await page.locator('[data-type="farm"]').tap();await page.locator('#zoom-in').tap();const p=await page.evaluate(()=>{const p=window.__amber.renderer.project(9,14),r=document.querySelector('canvas').getBoundingClientRect();return{x:p.x+r.left,y:p.y+r.top};});await page.touchscreen.tap(p.x,p.y);await page.locator('#confirm-build').click();
 expect(await page.evaluate(()=>window.__amber.game.at(9,14)?.type)).toBe('farm');
 await page.locator('#detail-close').tap();await page.locator('[data-tab="defense"]').tap();await expect(page.locator('[data-type="tower"]')).toBeVisible();
 const before=await page.evaluate(()=>window.__amber.renderer.pan.x);await page.mouse.move(290,520);await page.mouse.down();await page.mouse.move(330,540,{steps:5});await page.mouse.up();expect(await page.evaluate(()=>window.__amber.renderer.pan.x)).toBeGreaterThan(before);
 await page.screenshot({path:'assets/mobile.png'});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await context.close();
});
test('Yandex SDK: readiness, gameplay lifecycle, cloud saving, rewarded callback and ad pause',async({page})=>{
 await page.addInitScript(()=>{window.sdkCalls=[];window.YaGames={init:async()=>({environment:{i18n:{lang:'ru'}},features:{LoadingAPI:{ready:()=>window.sdkCalls.push('ready')},GameplayAPI:{start:()=>window.sdkCalls.push('start'),stop:()=>window.sdkCalls.push('stop')}},getPlayer:async()=>({getData:async()=>({}),setData:async(data)=>{window.sdkCalls.push('save');window.cloudSave=data;}}),on:()=>{},adv:{showRewardedVideo:({callbacks})=>{window.adCallbacks=callbacks;}}})};});
 await start(page);expect(await page.evaluate(()=>window.sdkCalls.includes('ready'))).toBe(true);expect(await page.evaluate(()=>window.sdkCalls.includes('start'))).toBe(true);
 await page.locator('#caravan').click();const before=await page.evaluate(()=>({...window.__amber.game.resources})),time=await page.evaluate(()=>window.__amber.game.time);await page.waitForTimeout(300);expect(await page.evaluate(()=>window.__amber.game.time)).toBe(time);
 await page.evaluate(()=>{window.adCallbacks.onRewarded();window.adCallbacks.onClose();});await expect(page.locator('#caravan')).toBeDisabled();const after=await page.evaluate(()=>window.__amber.game.resources);expect(after.wood).toBeGreaterThanOrEqual(before.wood+50);expect(after.food).toBeGreaterThanOrEqual(before.food+99);expect(await page.evaluate(()=>window.sdkCalls.includes('save'))).toBe(true);
 await page.locator('#pause').click();expect(await page.evaluate(()=>window.sdkCalls.at(-1))).toBe('stop');
});
test('Yandex rewarded ads grant nothing when skipped',async({page})=>{
 await page.addInitScript(()=>{window.YaGames={init:async()=>({environment:{i18n:{lang:'ru'}},adv:{showRewardedVideo:({callbacks})=>{window.adCallbacks=callbacks;}}})};});await start(page);await page.locator('#caravan').click();const before=await page.evaluate(()=>window.__amber.game.resources.gold);await page.evaluate(()=>window.adCallbacks.onClose());expect(await page.evaluate(()=>window.__amber.game.resources.gold)).toBeLessThan(before+1);expect(await page.evaluate(()=>window.__amber.game.supplyWave)).toBe(-1);
});
test('game over and victory screens offer working restarts and endless continuation',async({page})=>{
 await start(page);await page.evaluate(()=>{const g=window.__amber.game;g.journey=false;g.wave=9;g.startWave();g.spawnLeft=0;g.enemies=[];});await expect(page.getByRole('heading',{name:'Долина под защитой'})).toBeVisible();await page.getByRole('button',{name:'Продолжить без лимита осад'}).click();expect(await page.evaluate(()=>window.__amber.game.mode)).toBe('endless');
 await page.evaluate(()=>{window.__amber.game.keep.hp=0;});await expect(page.getByRole('heading',{name:'Цитадель пала'})).toBeVisible();await page.getByRole('button',{name:'Начать заново',exact:true}).click();expect(await page.evaluate(()=>window.__amber.game.wave)).toBe(0);expect(await page.evaluate(()=>window.__amber.game.keep.hp)).toBe(1500);
});
