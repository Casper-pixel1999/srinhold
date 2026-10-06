import {SIZE,terrainAt,buildReason,BUILDINGS} from './state.js';
import {HEALTH} from './combat.js';
export const TILE_WIDTH = 80, TILE_HEIGHT = 40;
export function project(x,y) { return {x:(x-y)*40,y:(x+y)*20}; }
export function unproject(x,y) { return {x:x/80+y/40,y:y/40-x/80}; }
export function toScreen(x,y,camera) { const p=project(x,y); return {x:camera.x+p.x*camera.zoom,y:camera.y+p.y*camera.zoom}; }
export function pickTile(x,y,camera) { const p=unproject((x-camera.x)/camera.zoom,(y-camera.y)/camera.zoom); return {x:Math.floor(p.x+0.5),y:Math.floor(p.y+0.5)}; }
export function zoomAt(camera,factor,x,y) {
  const zoom=Math.max(0.4,Math.min(2,camera.zoom*factor)), ratio=zoom/camera.zoom;
  camera.x=x-(x-camera.x)*ratio; camera.y=y-(y-camera.y)*ratio; camera.zoom=zoom;
}
function diamond(ctx,x,y) {ctx.beginPath();ctx.moveTo(x,y-20);ctx.lineTo(x+40,y);ctx.lineTo(x,y+20);ctx.lineTo(x-40,y);ctx.closePath();}

export class Renderer {
  constructor(canvas,art,state) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.art=art;this.state=state;
    this.camera={x:0,y:0,zoom:1};this.selected=null;this.preview=null;
    this.ground=document.createElement('canvas');this.ground.width=SIZE*80;this.ground.height=SIZE*40+40;
    this.paintGround();this.resize(true);
  }
  resize(reset=false) {
    const rect=this.canvas.getBoundingClientRect(), oldWidth=this.width||rect.width,oldHeight=this.height||rect.height;
    this.width=rect.width;this.height=rect.height;const dpr=Math.min(2,window.devicePixelRatio||1);
    this.canvas.width=Math.round(this.width*dpr);this.canvas.height=Math.round(this.height*dpr);this.dpr=dpr;
    if(reset) this.reset(); else {this.camera.x+=(this.width-oldWidth)/2;this.camera.y+=(this.height-oldHeight)/2;}
  }
  reset(){const p=project(12,12);this.camera.zoom=this.width<600?0.82:1.05;this.camera.x=this.width/2-p.x*this.camera.zoom;this.camera.y=this.height*0.55-p.y*this.camera.zoom;}
  paintGround() {
    const ctx=this.ground.getContext('2d');ctx.translate(SIZE*40,20);
    const pattern=ctx.createPattern(this.art.terrain,'repeat');
    for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
      const p=project(x,y),terrain=terrainAt(x,y);diamond(ctx,p.x,p.y);
      ctx.fillStyle=terrain==='water'?'#578d91':pattern;ctx.fill();
      if(terrain==='forest'||terrain==='rock'){ctx.fillStyle=terrain==='forest'?'#324f2844':'#9a968a44';ctx.fill();}
      ctx.strokeStyle=terrain==='water'?'#aac7b944':'#42582730';ctx.lineWidth=.6;ctx.stroke();
      if(terrain==='water'){ctx.strokeStyle='#a2c4bf66';ctx.beginPath();ctx.moveTo(p.x-14,p.y+3);ctx.lineTo(p.x+8,p.y+3);ctx.stroke();}
    }
    // A simple earth path joins the initial settlement, kept in the terrain layer.
    ctx.strokeStyle='#d3c593aa';ctx.lineWidth=12;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
    for(const [i,[x,y]] of [[10,12],[12,12],[12,15]].entries()){const p=project(x,y);if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);}ctx.stroke();
  }
  sprite(ctx,type,x,y,alpha=1) {
    const img=this.art[type],p=project(x,y),width=type==='keep'?106:BUILDINGS[type]?.width||(type==='tree'?78:73);
    if(!img){this.defenseSprite(ctx,type,p,alpha);return;}
    const height=width*img.height/img.width;ctx.globalAlpha=alpha;
    ctx.drawImage(img,p.x-width/2,p.y+width*.16-height,width,height);ctx.globalAlpha=1;
  }
  defenseSprite(ctx,type,p,alpha){
    ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=alpha;ctx.lineWidth=2;ctx.strokeStyle='#343c36';
    if(type==='guard'||type==='raider'){
      ctx.fillStyle='#18292166';ctx.beginPath();ctx.ellipse(0,4,13,6,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=type==='guard'?'#417ca0':'#b24736';ctx.fillRect(-8,-25,16,23);ctx.strokeRect(-8,-25,16,23);
      ctx.fillStyle='#d6ba8a';ctx.beginPath();ctx.arc(0,-31,7,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.strokeStyle='#e4d49a';ctx.beginPath();ctx.moveTo(13,0);ctx.lineTo(13,-33);ctx.stroke();
      ctx.fillStyle=type==='guard'?'#9fb7c2':'#984933';ctx.beginPath();ctx.ellipse(-10,-13,7,11,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    }else{
      const height=type==='tower'?78:type==='gate'?43:29;
      ctx.fillStyle='#606c62';ctx.beginPath();ctx.moveTo(-34,-height);ctx.lineTo(0,-height+15);ctx.lineTo(34,-height);ctx.lineTo(34,0);ctx.lineTo(0,15);ctx.lineTo(-34,0);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.fillStyle='#a5ad91';ctx.beginPath();ctx.moveTo(-34,-height);ctx.lineTo(0,-height-15);ctx.lineTo(34,-height);ctx.lineTo(0,-height+15);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.strokeStyle='#434d43';for(let y=-height+15;y<3;y+=12){ctx.beginPath();ctx.moveTo(-32,y);ctx.lineTo(0,y+14);ctx.lineTo(32,y);ctx.stroke();}
      if(type==='gate'){ctx.fillStyle='#443b29';ctx.fillRect(-17,-31,34,33);ctx.strokeStyle='#c4a56a';for(let x=-13;x<=13;x+=7){ctx.beginPath();ctx.moveTo(x,-28);ctx.lineTo(x,0);ctx.stroke();}}
      if(type==='tower'){ctx.fillStyle='#417ca0';ctx.fillRect(-5,-height-33,5,28);ctx.fillStyle='#d9b55e';ctx.fillRect(0,-height-33,22,12);}
    }
    ctx.restore();
  }
  mark(ctx,x,y,color){const p=project(x,y);diamond(ctx,p.x,p.y);ctx.fillStyle=color+'38';ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();}
  draw() {
    const ctx=this.ctx,c=this.camera;ctx.setTransform(this.dpr,0,0,this.dpr,0,0);ctx.clearRect(0,0,this.width,this.height);
    ctx.fillStyle='#526d46';ctx.fillRect(0,0,this.width,this.height);ctx.translate(c.x,c.y);ctx.scale(c.zoom,c.zoom);
    ctx.drawImage(this.ground,-SIZE*40,-20);
    if(this.selected){const b=[...this.state.buildings,...this.state.units].find(b=>b.id===this.selected);if(b)this.mark(ctx,b.x,b.y,'#f6d785');}
    if(this.preview)this.mark(ctx,this.preview.x,this.preview.y,buildReason(this.state,this.preview.x,this.preview.y,this.preview.type)?'#e39475':'#ffdf84');
    this.mark(ctx,20,12,'#e39475');const entry=project(20,12);ctx.fillStyle='#ffe1b4';ctx.font='14px Arial';ctx.fillText('Восточный вход',entry.x-50,entry.y+35);
    const objects=[...this.state.buildings,...this.state.units,...this.state.enemies];
    for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){const t=terrainAt(x,y);if(t==='forest'&&(x+y)%2===0)objects.push({x,y,type:'tree'});if(t==='rock')objects.push({x,y,type:'rock'});}
    if(this.preview && !buildReason(this.state,this.preview.x,this.preview.y,this.preview.type))objects.push({...this.preview,preview:true});
    objects.sort((a,b)=>(a.x+a.y)-(b.x+b.y)||a.x-b.x);
    for(const obj of objects){const p=toScreen(obj.x,obj.y,c);if(p.x < -160 || p.x > this.width+160 || p.y < -30 || p.y > this.height+180)continue;this.sprite(ctx,obj.type,obj.x,obj.y,obj.preview?.55:1);
      const world=project(obj.x,obj.y);if(obj.type==='gate'&&obj.open){ctx.fillStyle='#f1dc94';ctx.font='12px Arial';ctx.fillText('Открыты',world.x-24,world.y-48);}
      if(obj.hp!==undefined&&(this.state.siege.phase==='active'||obj.hp<HEALTH[obj.type]||['guard','tower','wall','gate'].includes(obj.type))){const y=world.y-(obj.type==='tower'?102:obj.type==='keep'?105:50);ctx.fillStyle='#192c25';ctx.fillRect(world.x-20,y,40,5);ctx.fillStyle=obj.type==='raider'?'#e2755c':'#aaca83';ctx.fillRect(world.x-20,y,40*obj.hp/HEALTH[obj.type],5);}
    }
  }
  pick(x,y){return pickTile(x,y,this.camera);}
  pickBuilding(x,y){
    const ordered=[...this.state.buildings,...this.state.units].sort((a,b)=>(b.x+b.y)-(a.x+a.y)||b.x-a.x);
    return ordered.find(b=>{const p=toScreen(b.x,b.y,this.camera),image=this.art[b.type],w=(b.type==='keep'?106:BUILDINGS[b.type]?.width||88)*this.camera.zoom,h=image?w*image.height/image.width:(b.type==='tower'?106:b.type==='guard'?44:65)*this.camera.zoom;return x>=p.x-w/2&&x<=p.x+w/2&&y>=p.y+w*.16-h&&y<=p.y+w*.16;})||null;
  }
}
