import {chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
await mkdir('publishing',{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
await page.goto('http://127.0.0.1:3000/?test=1');
await page.getByRole('button',{name:'Начать кампанию',exact:true}).click();
await page.evaluate(()=>{
 const g=window.__amber.game;g.guideStep=5;g.build('farm',9,14);g.recruit('archer');g.recruit('archer');
 const plans=[['tower',10,4],['tower',6,8],['tower',5,12],['farm',9,17],['house',11,16],['tower',6,12],['house',14,10],['tower',15,6],['farm',12,17],['tower',5,14]];let p=0;
 for(let i=0;i<3000;i++){g.tick(.1);if(i%100===0){if(p<plans.length&&!g.buildReason(...plans[p])){g.build(...plans[p]);p++;}for(const b of g.buildings){if(b.hp<b.maxHp)g.repair(b.id);if(['tower','farm','quarry'].includes(b.type)&&b.level<2)g.upgrade(b.id);}if(g.units.length<12)g.recruit('archer');}if(g.wave>=2&&g.waveActive&&g.enemies.length>=5)break;}
 g.events=[];
});
await page.locator('[data-tab="defense"]').click();await page.locator('#pause').click();await page.evaluate(()=>{document.getElementById('modal').hidden=true;document.getElementById('toasts').replaceChildren();});await page.waitForTimeout(250);
await page.screenshot({path:'publishing/screenshot-desktop.png'});
await page.setViewportSize({width:800,height:470});
await page.evaluate(()=>{
 const style=document.createElement('style');style.textContent='.topbar{display:none}#world{inset:0}#world>*:not(canvas){display:none!important}';document.head.append(style);
 const r=window.__amber.renderer;r.resize();r.zoom=1.05;r.pan.x=140;r.pan.y=30;
 const cover=document.createElement('div');cover.style.cssText='position:fixed;inset:0;background:linear-gradient(90deg,rgba(27,48,38,.97),rgba(27,48,38,.88) 28%,rgba(27,48,38,0) 70%);pointer-events:none;display:flex;flex-direction:column;justify-content:center;padding:42px;color:#f3ead2;z-index:90';cover.innerHTML='<div style="font:10px Arial;letter-spacing:3px;color:#d1b269;margin-bottom:21px">ХРОНИКИ ПОГРАНИЧЬЯ</div><div style="font:52px Georgia;line-height:1.1">Янтарная<br>крепость</div><div style="width:60px;height:2px;background:#c4a35c;margin:24px 0"></div><div style="font:15px Arial;line-height:1.8;color:#cbd1b9">Постройте свой дом.<br>Защитите своё пограничье.</div>';document.body.append(cover);
});await page.waitForTimeout(250);await page.screenshot({path:'publishing/cover-800x470.png'});
await page.setViewportSize({width:512,height:512});await page.goto('http://127.0.0.1:3000/assets/icon.svg');await page.screenshot({path:'publishing/icon-512.png'});
await browser.close();
