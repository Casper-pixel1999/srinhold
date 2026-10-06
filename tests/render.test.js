import test from 'node:test';
import assert from 'node:assert/strict';
import {project,unproject,toScreen,pickTile,zoomAt} from '../src/render.js';
test('projection/picking remains inverse after pan and anchored zoom',()=>{const camera={x:333,y:-271,zoom:.82};for(const [x,y]of [[0,0],[12,12],[23,23],[13,11]]){assert.deepEqual(unproject(...Object.values(project(x,y))),{x,y});const p=toScreen(x,y,camera);assert.deepEqual(pickTile(p.x,p.y,camera),{x,y});zoomAt(camera,1.3,p.x,p.y);const after=toScreen(x,y,camera);assert.ok(Math.abs(after.x-p.x)<1e-8);assert.ok(Math.abs(after.y-p.y)<1e-8);assert.deepEqual(pickTile(after.x,after.y,camera),{x,y});}});
