import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {ws as WebSocket} from '../node_modules/playwright-core/lib/utilsBundle.js';

// Playwright makes pages permanently visible via focus emulation. Use its bundled
// Chromium directly for one real native-tab visibility test, without emulation.
export async function nativeBrowser(){
  const profile=await mkdtemp(join(tmpdir(),'amber-keep-visibility-'));
  const process=spawn(chromium.executablePath(),['--remote-debugging-port=0',`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check','--disable-backgrounding-occluded-windows','--disable-renderer-backgrounding','--disable-background-timer-throttling','--window-position=-32000,-32000','about:blank'],{windowsHide:true});
  const exited=new Promise(resolve=>process.once('exit',resolve));
  const url=await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(new Error('Native browser startup timeout')),10000);process.stderr.on('data',data=>{output+=data;const match=output.match(/DevTools listening on (ws:\/\/\S+)/);if(match){clearTimeout(timer);resolve(match[1]);}});process.once('error',reject);});
  const socket=new WebSocket(url);await new Promise((resolve,reject)=>{socket.once('open',resolve);socket.once('error',reject);});
  let id=0;const pending=new Map();socket.on('message',message=>{const result=JSON.parse(message);if(result.id){const request=pending.get(result.id);pending.delete(result.id);if(result.error)request?.reject(new Error(result.error.message));else request?.resolve(result.result);}});
  const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});socket.send(JSON.stringify({id,method,params,sessionId}));});
  return {send,async close(){await send('Browser.close');socket.close();await exited;await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});}};
}
