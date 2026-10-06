import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/engine.js';
test('ten-siege campaign is winnable using earned resources and legal builds',()=>{
 const g=new Game();g.guideStep=5;g.build('farm',9,14);g.recruit('archer');g.recruit('archer');
 const plans=[['tower',10,4],['tower',6,8],['tower',5,12],['farm',9,17],['house',11,16],['tower',6,12],['house',14,10],['tower',15,6],['farm',12,17],['tower',5,14]];let p=0;
 for(let i=0;i<20000&&!g.finished;i++){g.tick(.1);if(i%100===0){if(p<plans.length&&!g.buildReason(...plans[p])){g.build(...plans[p]);p++;}for(const b of g.buildings){if(b.hp<b.maxHp)g.repair(b.id);if(['tower','farm','quarry'].includes(b.type)&&b.level<3)g.upgrade(b.id);}if(g.units.length<15)g.recruit('archer');}}
 assert.equal(g.finished,'victory');assert.equal(g.wave,10);assert.ok(g.keep.hp>0);assert.ok(g.kills>200);assert.ok(g.time<1500);
});
