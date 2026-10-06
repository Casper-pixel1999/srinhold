import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve(process.argv[2]||'.'),port=Number(process.argv[3]||3000);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.svg':'image/svg+xml'};
createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),path=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
    const relative=path.slice(root.length+1);
    if(!path.startsWith(root+sep)||relative.split(/[\\/]/).some(p=>p.startsWith('.')||['legacy','node_modules','tests','tools','evidence'].includes(p))){res.writeHead(403).end('Forbidden');return;}
    if(!(await stat(path)).isFile())throw new Error('not file');
    res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-store'});res.end(await readFile(path));
  }catch{res.writeHead(404).end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Amber Keep: http://127.0.0.1:${port}`));
