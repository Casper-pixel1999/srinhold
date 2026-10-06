import {mkdir,cp,copyFile,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve('.'),output=resolve(root,'dist');
if(output!==resolve(root,'dist'))throw new Error('Invalid output path');
await rm(output,{recursive:true,force:true});await mkdir(output,{recursive:true});
for(const file of ['index.html','style.css'])await copyFile(file,resolve(output,file));
await cp('src',resolve(output,'src'),{recursive:true});await mkdir(resolve(output,'assets/runtime'),{recursive:true});
for(const file of ['keep.webp','house.webp','farm.webp','lumber.webp','tree.webp','rock.webp','terrain.webp','icon.svg'])await copyFile(`assets/runtime/${file}`,resolve(output,'assets/runtime',file));
console.log('Built dist/ (runtime only, no legacy or debug interface).');
