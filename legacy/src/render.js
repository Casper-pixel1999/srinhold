import {SIZE,terrain,PRODUCTION} from './engine.js';
import {t} from './i18n.js';
const TW=96,TH=48;
export const iso=(x,y,z=0)=>({x:(x-y)*TW/2,y:(x+y)*TH/2-z});
const art={};
const buildingFrames={keep:0,house:1,farm:2,lumber:3,quarry:4,barracks:5,tower:6,market:7};
const advancedFrames={mill:0,bakery:1,warehouse:2,bridge:3,manor:4,mine:5,caravan:6,merchant:7};
const detailFrames={wall:0,well:1,tree:2,rock:3,archer:4,guard:5,raider:6,brute:6,ram:7};
export async function loadArt(){
 const ground=new Image();ground.src='assets/terrain.webp';try{await ground.decode();art.terrain=ground;}catch{}
 await Promise.all([['buildings','assets/buildings.png'],['details','assets/details.png'],['workers','assets/workers.webp'],['soldiers','assets/soldiers.webp'],['advanced','assets/advanced.webp']].map(async([name,url])=>{
  try{const image=new Image();image.src=url;await image.decode();const sheet=document.createElement('canvas');sheet.width=image.width;sheet.height=image.height;const ctx=sheet.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,image.width,image.height).data;const cw=image.width/4,ch=image.height/2,boxes=[];
   for(let cell=0;cell<8;cell++){
    const left=Math.floor(cell%4*cw),top=Math.floor(Math.floor(cell/4)*ch),width=Math.floor(cw),height=Math.floor(ch),visited=new Uint8Array(width*height),queue=new Int32Array(width*height);let best=null;
    // Ignore fragments of neighbouring frames when determining this object's bounds.
    for(let start=0;start<visited.length;start++){
     if(visited[start])continue;visited[start]=1;const px=start%width,py=Math.floor(start/width);if(data[((top+py)*image.width+left+px)*4+3]<=35)continue;
     let head=0,tail=1,minX=px,maxX=px,minY=py,maxY=py;queue[0]=start;
     while(head<tail){const id=queue[head++],x=id%width,y=Math.floor(id/width);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
      for(const [nx,ny]of[[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){if(nx<0||ny<0||nx>=width||ny>=height)continue;const nid=ny*width+nx;if(visited[nid])continue;visited[nid]=1;if(data[((top+ny)*image.width+left+nx)*4+3]>35)queue[tail++]=nid;}
     }
     if(!best||tail>best.count)best={x:left+minX,y:top+minY,w:maxX-minX+1,h:maxY-minY+1,count:tail};
    }
    boxes.push(best||{x:left,y:top,w:width,h:height});
   }
   art[name]={image,boxes,data};
  }catch(error){console.warn('Art could not load:',name,error.message);}
 }));
}
function sprite(ctx,type,x,y,width){const group=Object.hasOwn(advancedFrames,type)?'advanced':Object.hasOwn(buildingFrames,type)?'buildings':'details',sheet=art[group];if(!sheet)return false;const box=sheet.boxes[(group==='advanced'?advancedFrames:group==='buildings'?buildingFrames:detailFrames)[type]];if(!box)return false;const p=iso(x,y);const height=width*box.h/box.w;ctx.drawImage(sheet.image,box.x,box.y,box.w,box.h,p.x-width/2,p.y+width*.18-height,width,height);return true;}
export function drawUnitPortrait(ctx,type){const a={x:0,y:0,id:0};if(!animatedSprite(ctx,'soldiers',type==='archer'?0:1,a,45,0))sprite(ctx,type,0,0,45);}
const seed=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
function poly(ctx,pts,color,stroke){ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=color;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.6;ctx.stroke();}}
function line(ctx,a,b,color,width=1){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function prism(ctx,x,y,w,d,h,z=0,colors=['#d2c6a6','#9b9278','#b7ab8b']){
 const p=(a,b,c)=>iso(a,b,c);const a=p(x-w/2,y-d/2,z+h),b=p(x+w/2,y-d/2,z+h),c=p(x+w/2,y+d/2,z+h),e=p(x-w/2,y+d/2,z+h),bc=p(x+w/2,y-d/2,z),cc=p(x+w/2,y+d/2,z),ec=p(x-w/2,y+d/2,z);
 poly(ctx,[e,c,cc,ec],colors[1],'#26382f35');poly(ctx,[b,c,cc,bc],colors[2],'#26382f35');poly(ctx,[a,b,c,e],colors[0],'#26382f35');
}
function roof(ctx,x,y,w,d,z,color='#a35f3e'){
 const p=(a,b,c)=>iso(a,b,c);const h=16;const a=p(x-w/2,y-d/2,z),b=p(x+w/2,y-d/2,z),c=p(x+w/2,y+d/2,z),e=p(x-w/2,y+d/2,z),r=p(x,y-d/2,z+h),s=p(x,y+d/2,z+h);
 poly(ctx,[a,r,s,e],color,'#503b2d');poly(ctx,[r,b,c,s],'#c47d4d','#503b2d');poly(ctx,[e,s,c],'#8a5034','#503b2d');
 for(let i=1;i<5;i++){const v=i/5;line(ctx,{x:r.x+(b.x-r.x)*v,y:r.y+(b.y-r.y)*v},{x:s.x+(c.x-s.x)*v,y:s.y+(c.y-s.y)*v},'#6c4a3550');}
}
function flag(ctx,x,y,z,time,color='#b99746'){const p=iso(x,y,z);line(ctx,p,{x:p.x,y:p.y-21},'#493c2d',1.5);poly(ctx,[{x:p.x,y:p.y-21},{x:p.x+14,y:p.y-19+Math.sin(time*3+x)*2},{x:p.x+12,y:p.y-10},{x:p.x,y:p.y-12}],color);}
function windowAt(ctx,x,y,z){const p=iso(x,y,z);ctx.fillStyle='#3d4540';ctx.fillRect(p.x-2,p.y-7,4,8);ctx.fillStyle='#e5c46b';ctx.fillRect(p.x-1,p.y-5,1,3);}
function battlement(ctx,x,y,w,d,h){prism(ctx,x,y,w,d,h);prism(ctx,x,y,w+.03,d+.03,4,h,['#ddd1b5','#aaa18c','#c3b79b']);for(const a of[-.28,0,.28]){prism(ctx,x+a,y+d/2-.08,.13,.14,5,h+4);prism(ctx,x+w/2-.08,y+a,.14,.13,5,h+4);}}
function stoneSection(ctx,x,y,w,d,h){
 prism(ctx,x,y,w,d,h,0,['#c9c1a1','#8a8872','#afa98e']);

 // Staggered stones, bevels, staining and moss match the painted buildings.
 for(let row=0,z=0;z<h;z+=6.5,row++)for(const face of['front','side']){
  const extent=face==='front'?w:d,start=face==='front'?x-w/2:y-d/2,step=.17;
  for(let i=-1;i<=Math.ceil(extent/step);i++){
   const left=Math.max(start,start+(i+(row%2)*.5)*step),right=Math.min(start+extent,start+(i+1+(row%2)*.5)*step);if(right<=left)continue;
   const high=Math.min(h,z+6.5),n=seed((left+x)*47+row,(y+z)*31+i),light=(face==='front'?57:66)+n*9;
   const pts=face==='front'?[iso(left,y+d/2,high),iso(right,y+d/2,high),iso(right,y+d/2,z),iso(left,y+d/2,z)]:[iso(x+w/2,left,high),iso(x+w/2,right,high),iso(x+w/2,right,z),iso(x+w/2,left,z)];
   poly(ctx,pts,`hsl(43 ${14+n*5}% ${light}%)`,'#555a4338');line(ctx,pts[0],pts[1],'#eee2bd35',.6);
   const mid={x:(pts[0].x+pts[2].x)/2,y:(pts[0].y+pts[2].y)/2};ctx.fillStyle='#55574420';ctx.fillRect(mid.x+n*4-2,mid.y,1+n,1);
  }
 }
 for(let i=0;i<6;i++){const n=seed(x*37+i,y*19),p=iso(x+(n-.5)*w,y+d/2,1+n*4);ctx.fillStyle=n>.4?'#72814c80':'#434d3740';ctx.beginPath();ctx.ellipse(p.x,p.y,2+n*2,1+n,0,0,7);ctx.fill();}
 prism(ctx,x,y,w+.035,d+.035,3,h,['#e1d8b6','#a49b7e','#c7bc9b']);
 for(let z=7;z<h;z+=7){line(ctx,iso(x-w/2,y+d/2,z),iso(x+w/2,y+d/2,z),'#565f5059',.85);line(ctx,iso(x+w/2,y-d/2,z),iso(x+w/2,y+d/2,z),'#69715c66',.85);}
 for(let i=0;i<Math.max(1,Math.round(w/.22));i++)prism(ctx,x-w/2+.1+i*.22,y+d/2-.04,.12,.14,5,h+3,['#e4daba','#96927c','#c8bda0']);
 for(let i=0;i<Math.max(1,Math.round(d/.22));i++)prism(ctx,x+w/2-.04,y-d/2+.1+i*.22,.14,.12,5,h+3,['#e4daba','#96927c','#c8bda0']);
}
function drawFortification(ctx,b,time){
 const{x,y}=b,h=23+(b.level||1)*3,links=b.links?.length?b.links:[[1,0],[-1,0]];
 if(b.type==='wall'){
  // Rear-facing arms go first so junctions form a continuous wall silhouette.
  if(links.length===2&&links[0][0]===-links[1][0]&&links[0][1]===-links[1][1]){const alongX=links[0][0]!==0;stoneSection(ctx,x,y,alongX?1.02:.25,alongX?.25:1.02,h);}
  else{for(const[dx,dy]of[...links].sort((a,c)=>a[0]+a[1]-c[0]-c[1]))stoneSection(ctx,x+dx*.3,y+dy*.3,dx?.6:.24,dy?.6:.24,h);stoneSection(ctx,x,y,.31,.31,h+1);}
 }else{
  const alongY=links.some(([dx,dy])=>dy)&&!links.some(([dx,dy])=>dx),axis=alongY?{x:0,y:1}:{x:1,y:0};
  // Two piers, an elevated lintel, and a gate that opens for friendly traffic.
  for(const n of[-.38,.38])stoneSection(ctx,x+axis.x*n,y+axis.y*n,alongY?.32:.23,alongY?.23:.32,h+5);
  const open=b.open||(b.passUntil||0)>time;
  prism(ctx,x,y,alongY?.26:.62,alongY?.62:.26,9,h-3,['#d7ceaf','#929078','#bab295']);
  for(const n of[-.2,0,.2])prism(ctx,x+axis.x*n,y+axis.y*n,.12,.12,5,h+6,['#e4daba','#9b967b','#c6bb9a']);
  if(!open){
   prism(ctx,x,y,alongY?.09:.55,alongY?.55:.09,h-5,0,['#8c6941','#503f2c','#6d5637']);
   for(const z of[6,17]){const a=iso(x-axis.x*.25,y-axis.y*.25,z),c=iso(x+axis.x*.25,y+axis.y*.25,z);line(ctx,a,c,'#303c37',3);}
   for(const n of[-.16,0,.16])line(ctx,iso(x+axis.x*n,y+axis.y*n,2),iso(x+axis.x*n,y+axis.y*n,h-5),'#baa37277',1);
  }else{
   const p=iso(x,y);line(ctx,{x:p.x-13,y:p.y+3},{x:p.x+13,y:p.y-3},'#c9b983',6);
  }
  flag(ctx,x-axis.x*.38,y-axis.y*.38,h+14,time,'#ba4b36');
 }
}
function animatedSprite(ctx,group,index,a,width,time,attack=false){
 const sheet=art[group];if(!sheet)return false;const box=sheet.boxes[index],p=iso(a.x,a.y),height=width*box.h/box.w;
 const step=a.walking?Math.sin(time*11+a.id):0,flip=a.facing&&(a.facing.x-a.facing.y)<0?-1:1;
 ctx.save();ctx.translate(p.x,p.y+Math.abs(step)*1.5);ctx.scale(flip,1);ctx.rotate(attack?Math.sin((a.attackUntil-time)*9)*.055:step*.018);
 ctx.drawImage(sheet.image,box.x,box.y,box.w,box.h,-width/2,width*.15-height,width,height);ctx.restore();return true;
}
function workerPerson(ctx,w,b,time){
 const p=iso(w.x,w.y),frame=w.walking&&Math.sin(time*11+w.id)>0?4:0;
 const job=w.role==='porter'?3:({farm:0,lumber:1,quarry:2,mill:0,bakery:0})[b.type];
 ctx.fillStyle='#172d2940';ctx.beginPath();ctx.ellipse(p.x,p.y+2,7,3,0,0,7);ctx.fill();
 animatedSprite(ctx,'workers',job+frame,w,19,time);
 if(w.stage==='working'&&w.role==='harvester'){
  const swing=Math.sin(time*6+w.id),hand=iso(w.x,w.y,17),dx=swing*8;
  line(ctx,{x:hand.x+3,y:hand.y},{x:hand.x+dx+8,y:hand.y-8-Math.max(0,swing)*7},'#bda27d',2);
  ctx.fillStyle=b.type==='quarry'?'#d1d2c0':'#9aaf98';ctx.fillRect(hand.x+dx+5,hand.y-10-Math.max(0,swing)*7,7,3);
  if(swing<-.85){ctx.fillStyle=b.type==='farm'?'#e2cc6b':'#b3afa0';for(let i=0;i<3;i++)ctx.fillRect(hand.x+9+i*3,hand.y+12-i*2,1.6,1.6);}
 }
 if(w.cargo>.01){const r=PRODUCTION[b.type].resource,q=iso(w.x,w.y,13);ctx.fillStyle=r==='wood'?'#b6925c':r==='stone'?'#c2c8b5':'#e5c868';ctx.strokeStyle='#54432c';ctx.lineWidth=.7;ctx.beginPath();ctx.roundRect(q.x-7,q.y-3,10,6,2);ctx.fill();ctx.stroke();}
 if(w.blocked){ctx.fillStyle='#ffd093';ctx.font='bold 12px Arial';ctx.textAlign='center';ctx.fillText('!',p.x,p.y-38);}
}
function buildingDamage(ctx,b,time){
 if(b.hp/b.maxHp>.65)return;const p=iso(b.x,b.y,b.type==='keep'?48:27),intensity=1-b.hp/b.maxHp;
 for(let i=0;i<3;i++){const dx=(i-1)*8;line(ctx,{x:p.x+dx,y:p.y-9},{x:p.x+dx+3,y:p.y-3},'#383b2aad',1.5);line(ctx,{x:p.x+dx+3,y:p.y-3},{x:p.x+dx-1,y:p.y+4},'#383b2aad',1.5);}
 if(intensity>.65){
  for(let i=0;i<3;i++){const q={x:p.x+i*5-5,y:p.y+12};ctx.fillStyle=i%2?'#f4c45bdd':'#d97432dd';ctx.beginPath();ctx.moveTo(q.x-4,q.y);ctx.quadraticCurveTo(q.x-6,q.y-6,q.x+Math.sin(time*8+i)*3,q.y-14-Math.sin(time*10+i)*4);ctx.quadraticCurveTo(q.x+7,q.y-4,q.x+4,q.y);ctx.fill();}
  for(let i=0;i<3;i++){const age=(time*.4+i*.33)%1;ctx.fillStyle=`rgba(47,53,40,${(1-age)*.23})`;ctx.beginPath();ctx.ellipse(p.x+age*12,p.y-10-age*34,5+age*8,6+age*9,0,0,7);ctx.fill();}
 }
}

export function drawBuilding(ctx,b,time=0){
 const {x,y,type}=b;const level=b.level||1;
 if(type==='bridge'){if(sprite(ctx,'bridge',x,y,170))return;for(let i=-2;i<=2;i++){prism(ctx,x+i*.25,y, .23,.8,5,0,['#b7a582','#78715d','#9c8d70']);}for(const dy of[-.4,.4])for(let i=-2;i<=2;i++)prism(ctx,x+i*.25,y+dy,.08,.08,15,0,['#ccc1a0','#908770','#b5a789']);return;}
 if(type==='wall'||type==='gate'){drawFortification(ctx,b,time);return;}
 const ground=iso(x,y);const shadow=ctx.createRadialGradient(ground.x+13,ground.y+6,2,ground.x+13,ground.y+6,45);shadow.addColorStop(0,'#28341c59');shadow.addColorStop(1,'#28341c00');ctx.fillStyle=shadow;ctx.beginPath();ctx.ellipse(ground.x+13,ground.y+6,49,20,-.15,0,Math.PI*2);ctx.fill();
 const width=type==='keep'?142:type==='tower'?76:type==='wall'?85:type==='well'?66:112;
 if(sprite(ctx,b.landmark==='mine'?'mine':type,x,y,width)){chimney(ctx,b,time);if(level>1){const p=iso(x,y,-27);ctx.fillStyle='#f9de85';ctx.font='bold 13px Arial';ctx.textAlign='center';ctx.fillText('★'.repeat(level-1),p.x,p.y);}return;}
 if(type==='keep'){
  prism(ctx,x,y,1.25,1.25,6,0,['#9c9880','#746e5a','#8c856c']);prism(ctx,x,y,.9,.9,56,6);roof(ctx,x,y,1.05,1.05,62,'#547276');
  for(const[dx,dy]of[[-.56,-.56],[.56,-.56],[-.56,.56],[.56,.56]]){battlement(ctx,x+dx,y+dy,.4,.4,dx===dy?64:54);windowAt(ctx,x+dx+.2,y+dy,31);}
  const door=iso(x+.14,y+.46,6);ctx.fillStyle='#3f4235';ctx.fillRect(door.x-5,door.y-15,10,16);flag(ctx,x+.56,y+.56,74,time,'#d7ae55');flag(ctx,x-.56,y-.56,74,time,'#d7ae55');
 }else if(type==='tower'){
  prism(ctx,x,y,.72,.72,7);battlement(ctx,x,y,.58,.58,43+level*4);windowAt(ctx,x+.3,y,22);flag(ctx,x,y,57+level*4,time);
 }else if(type==='wall'){
  battlement(ctx,x,y,.83,.55,21+level*3);line(ctx,iso(x-.4,y+.28,12),iso(x+.4,y+.28,12),'#716f6160');line(ctx,iso(x+.4,y-.28,12),iso(x+.4,y+.28,12),'#716f6160');
 }else if(type==='farm'){
  prism(ctx,x,y,.88,.86,2,0,['#766b3f','#625638','#7d7044']);
  for(let i=-3;i<=3;i++)for(let j=-2;j<=2;j++){const p=iso(x+i*.11,y+j*.14,3);line(ctx,p,{x:p.x-1,y:p.y-10-(i+j)%3},'#dbbd62',1.9);line(ctx,{x:p.x-1,y:p.y-7},{x:p.x+3,y:p.y-10},'#edd48a',1.2);}
  prism(ctx,x-.3,y-.3,.3,.3,13);roof(ctx,x-.3,y-.3,.4,.4,13,'#9c7350');
 }else if(type==='well'){
  prism(ctx,x,y,.45,.45,9,0,['#c5bd9e','#8b8a74','#a9a48b']);prism(ctx,x,y,.25,.25,1,9,['#405e60','#405e60','#405e60']);for(const a of[-.22,.22])prism(ctx,x+a,y,.06,.06,22);roof(ctx,x,y,.65,.4,22);const p=iso(x,y,21);line(ctx,p,{x:p.x,y:p.y+13},'#6b5a42');
 }else{
  const wood=type==='lumber'||type==='market';const height=type==='barracks'?29:type==='house'?24:18;
  prism(ctx,x,y,.72,.7,height,0,wood?['#b2986c','#8b7450','#a08a63']:['#d9caaa','#b5a185','#c9b697']);
  for(let i=0;i<3;i++)line(ctx,iso(x-.36,y+.36,4+i*7),iso(x+.36,y+.36,4+i*7),wood?'#665b4360':'#93856b40');
  roof(ctx,x,y,.9,.88,height,type==='barracks'?'#58747a':type==='market'?'#d0ac59':'#a46342');windowAt(ctx,x+.37,y+.1,height*.6);windowAt(ctx,x-.12,y+.36,height*.6);
  if(type==='house'){prism(ctx,x-.16,y-.14,.14,.14,15,height+6,['#b5a892','#91836d','#a59780']);const p=iso(x-.16,y-.14,height+28);for(let i=0;i<3;i++){ctx.fillStyle=`rgba(220,218,192,${.12-i*.025})`;ctx.beginPath();ctx.ellipse(p.x+Math.sin(time+i)*3,p.y-((time*8+i*11)%32),3+i*2,4+i*3,0,0,7);ctx.fill();}}
  if(type==='barracks'){flag(ctx,x+.3,y+.3,height+16,time,'#4c7b87');const p=iso(x-.4,y+.4,0);ctx.fillStyle='#c8b382';ctx.fillRect(p.x-6,p.y-8,12,9);line(ctx,{x:p.x-4,y:p.y-8},{x:p.x+4,y:p.y+1},'#6c5a42');}
  if(type==='lumber')for(let i=0;i<3;i++)prism(ctx,x+.36,y+.25+i*.14,.38,.1,6,0,['#d8b57b','#7d6040','#ac8555']);
  if(type==='quarry')for(let i=0;i<3;i++)prism(ctx,x+.3+i*.13,y+.36,.2,.2,6+i*2,0,['#c6c7b2','#828e80','#a4af9d']);
  if(type==='market'){prism(ctx,x-.45,y+.15,.38,.5,12,0,['#d3b275','#927956','#bea16b']);roof(ctx,x-.45,y+.15,.45,.6,12,'#b89b48');}
 }
 if(level>1){const p=iso(x,y,-9);ctx.fillStyle='#e4c47a';ctx.font='bold 9px sans-serif';ctx.textAlign='center';ctx.fillText('★'.repeat(level-1),p.x,p.y);}
}
function tree(ctx,x,y,n){if(art.details){const p=iso(x,y);ctx.save();ctx.translate(p.x,p.y);ctx.scale(n>.5?-1:1,1);sprite(ctx,'tree',0,0,65+n*31);ctx.restore();return;}const p=iso(x,y);line(ctx,p,{x:p.x,y:p.y-40},'#665036',5);for(let i=0;i<5;i++){const cx=p.x+Math.sin(i*2)*20,cy=p.y-45+Math.cos(i*2)*14;const gradient=ctx.createRadialGradient(cx-9,cy-13,1,cx,cy,27);gradient.addColorStop(0,'#88ac4f');gradient.addColorStop(.6,'#60883c');gradient.addColorStop(1,'#3d602e');ctx.fillStyle=gradient;ctx.beginPath();ctx.ellipse(cx,cy,25,20,0,0,7);ctx.fill();}}
function person(ctx,a,time){const p=iso(a.x,a.y),attack=(a.attackUntil||0)>time;
 const index=({archer:0,guard:1,raider:2,brute:3})[a.type];
 if(index!==undefined){
  ctx.fillStyle='#15332c45';ctx.beginPath();ctx.ellipse(p.x,p.y+1,7,3,0,0,7);ctx.fill();
  if(animatedSprite(ctx,'soldiers',index+(attack||a.walking&&Math.sin(time*10+a.id)>0?4:0),a,a.type==='brute'?26:22,time,attack)){
   if(attack&&a.type!=='archer'){ctx.beginPath();ctx.ellipse(p.x+5,p.y-14,13,8,-.4,-1.4,.8);ctx.strokeStyle='#f4e4ba8c';ctx.lineWidth=1.5;ctx.stroke();}return;
  }
 }
 if(a.type==='ram'&&art.details){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(attack?Math.sin(time*20)*.028:0);sprite(ctx,'ram',0,0,76);ctx.restore();return;}
 const enemy=['raider','brute','ram'].includes(a.type);if(a.type==='ram'){prism(ctx,a.x,a.y,.55,.9,17,0,['#8b6950','#544a3a','#715c43']);roof(ctx,a.x,a.y,.7,1,17,'#5a4b3d');for(const y of[-.3,.3]){const q=iso(a.x+.3,a.y+y);ctx.fillStyle='#322e29';ctx.beginPath();ctx.arc(q.x,q.y,4,0,7);ctx.fill();}return;}
 ctx.fillStyle='#193b3340';ctx.beginPath();ctx.ellipse(p.x,p.y+1,5,2,0,0,7);ctx.fill();const walk=Math.sin(time*9+a.id)*1.4;line(ctx,{x:p.x-1,y:p.y-4},{x:p.x-2+walk,y:p.y},'#393b33',2);line(ctx,{x:p.x+1,y:p.y-4},{x:p.x+2-walk,y:p.y},'#393b33',2);ctx.fillStyle=enemy?'#ac5546':a.type==='guard'?'#6b8187':'#466d7b';ctx.fillRect(p.x-3,p.y-11,a.type==='brute'?8:6,8);ctx.fillStyle='#d5b18b';ctx.beginPath();ctx.arc(p.x,p.y-13,3,0,7);ctx.fill();ctx.fillStyle=enemy?'#5a4a3a':'#b9c8bc';ctx.fillRect(p.x-3,p.y-16,6,3);if(a.type==='archer'){ctx.beginPath();ctx.arc(p.x+5,p.y-8,5,-1.2,1.2);ctx.strokeStyle='#b99a60';ctx.lineWidth=1.5;ctx.stroke();}else{line(ctx,{x:p.x+5,y:p.y-6},{x:p.x+6,y:p.y-16},'#d3d8b9',1.5);}
}
// The static ground is painted once; the live scene only draws one cached image.
function paintGround(game){
 const size=game.size;
 const surface=document.createElement('canvas');surface.width=size*TW+192;surface.height=size*TH+144;
 const c=surface.getContext('2d'),offset={x:surface.width/2,y:48};c.translate(offset.x,offset.y);
 const diamond=(x,y)=>[iso(x-.5,y-.5),iso(x+.5,y-.5),iso(x+.5,y+.5),iso(x-.5,y+.5)];
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const kind=game.land(x,y),n=seed(x,y),p=iso(x,y);
  const color=kind==='water'?'#477c79':kind==='forest'?'#657850':kind==='rock'?'#899175':'#85945e';
  poly(c,diamond(x,y),color,color);
  if(kind!=='water'){
   const light=c.createRadialGradient(p.x-12,p.y-6,1,p.x,p.y,65);light.addColorStop(0,`rgba(203,200,122,${.07+n*.09})`);light.addColorStop(1,'rgba(203,200,122,0)');poly(c,diamond(x,y),light);
  }
 }
 if(art.terrain){
  c.save();c.beginPath();for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(game.land(x,y)!=='water'){const pts=diamond(x,y);c.moveTo(pts[0].x,pts[0].y);for(const p of pts.slice(1))c.lineTo(p.x,p.y);c.closePath();}c.clip();
  const tile=document.createElement('canvas');tile.width=384;tile.height=384;tile.getContext('2d').drawImage(art.terrain,0,0,384,384);
  c.globalCompositeOperation='soft-light';c.globalAlpha=.85;c.fillStyle=c.createPattern(tile,'repeat');c.fillRect(-surface.width/2,-48,surface.width,surface.height);c.restore();
 }
 // Soft canopy shadows extend beyond the forest edge onto the meadow.
 for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(game.land(x,y)==='forest'&&seed(x,y)>.19){const p=iso(x,y),shade=c.createRadialGradient(p.x+14,p.y+5,3,p.x+14,p.y+5,50);shade.addColorStop(0,'#203a2559');shade.addColorStop(1,'#203a2500');c.fillStyle=shade;c.beginPath();c.ellipse(p.x+14,p.y+5,53,25,-.15,0,7);c.fill();}
 // Irregular sandy river bank, stones, reeds, and shallow water.
 for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(game.land(x,y)==='water'){
  for(const [dx,dy] of [[-1,0],[0,-1],[0,1]])if(!['water','void'].includes(game.land(x+dx,y+dy))){
   const a=dx?iso(x-.5,y-.5):iso(x-.5,y+dy*.5),b=dx?iso(x-.5,y+.5):iso(x+.5,y+dy*.5);
   line(c,a,b,'#adc39838',18);line(c,a,b,'#beb28a',7);line(c,a,b,'#e3d4a773',2);
   for(let i=0;i<5;i++){const f=(i+.3)/5,p={x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f};c.fillStyle=i%2?'#737e62':'#c3bc94';c.beginPath();c.ellipse(p.x-3,p.y-1,2.7,1.5,0,0,7);c.fill();if(i%2===0){line(c,p,{x:p.x-2,y:p.y-7},'#647745',1.3);line(c,p,{x:p.x+2,y:p.y-5},'#83925a',1);}}
  }
 }
 const routes=[[[11,5.8],[11,16.5]],[[5.7,12],[16.2,12]]];
 for(const b of game.buildings)if(!['wall','tower','gate'].includes(b.type)){
  const nearX=Math.abs(b.x-11)<Math.abs(b.y-12);
  routes.push([[b.x,b.y],nearX?[11,b.y]:[b.x,12]]);
 }
 if(game.mapKey==='bridge')routes.push([[11,11],[26,11]]);
 c.lineCap='round';c.lineJoin='round';
 for(const width of [29,23,18])for(const route of routes){const a=iso(...route[0]),b=iso(...route[1]);line(c,a,b,width===29?'#66634624':width===23?'#a59b72':'#b6aa82',width);}
 for(const route of routes){const a=iso(...route[0]),b=iso(...route[1]),length=Math.hypot(a.x-b.x,a.y-b.y);for(let i=0;i<length/4;i++){const n=seed(i+a.x,b.y),f=i/Math.max(1,length/4),px=a.x+(b.x-a.x)*f+(n-.5)*15,py=a.y+(b.y-a.y)*f+(seed(i,b.x)-.5)*9;c.fillStyle=n>.5?'#dfcca16b':'#80795b45';c.beginPath();c.ellipse(px,py,1+n*1.8,.6+n*.7,-.3,0,7);c.fill();}}
 for(const b of game.buildings){const p=iso(b.x,b.y),g=c.createRadialGradient(p.x,p.y,4,p.x,p.y,52);g.addColorStop(0,'#9a916d80');g.addColorStop(1,'#9a916d00');c.fillStyle=g;c.beginPath();c.ellipse(p.x,p.y,60,27,0,0,7);c.fill();}
 // Small scattered meadow details break up repeated tiles without competing with buildings.
 for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(['grass','forest'].includes(game.land(x,y))){
  const p=iso(x,y);for(let i=0;i<9;i++){const n=seed(x*9+i,y*7),q=iso(x+(n-.5)*.8,y+(seed(y*3+i,x)-.5)*.8);if(Math.abs(x-11)<.5||Math.abs(y-12)<.5)continue;c.strokeStyle=n>.5?'#d4d1a54d':'#465d374d';c.lineWidth=.8;c.beginPath();c.moveTo(q.x-2,q.y);c.lineTo(q.x-3,q.y-3);c.moveTo(q.x,q.y);c.lineTo(q.x+1,q.y-4);c.stroke();if(n>.93){c.fillStyle='#e7dba6b3';c.fillRect(q.x-1,q.y-3,1.6,1.6);}}
 }
 return{surface,offset};
}
function chimney(ctx,b,time){
 if(!['house','keep','barracks','bakery'].includes(b.type))return;
 const p=iso(b.x,b.y,b.type==='keep'?112:65);
 for(let i=0;i<4;i++){const age=(time*.23+i*.25+seed(b.x,b.y))%1;ctx.fillStyle=`rgba(236,226,198,${(1-age)*.16})`;ctx.beginPath();ctx.ellipse(p.x+14+Math.sin(age*3+b.id)*5+age*10,p.y-age*34,2+age*7,3+age*5,-.3,0,7);ctx.fill();}
}

export class Renderer{
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.zoom=1;this.pan={x:0,y:0};this.hover=null;this.grid=false;this.selected=null;this.build=null;this.labels=true;this.target=null;this.center={x:10,y:11};this.frameTime=0;this.resize();}
 resize(){const rect=this.canvas.getBoundingClientRect();this.w=rect.width;this.h=rect.height;const dpr=Math.min(2,devicePixelRatio||1);this.canvas.width=this.w*dpr;this.canvas.height=this.h*dpr;this.dpr=dpr;this.baseZoom=this.w<760?.8:Math.max(.9,Math.min(1.3,this.w/1280));}
 get scale(){return this.baseZoom*this.zoom;}
 origin(){const center=iso(this.center.x,this.center.y),anchor=this.anchor||{x:this.w*(this.w<760?.5:.59),y:this.h*.46};return{x:anchor.x-center.x*this.scale+this.pan.x,y:anchor.y-center.y*this.scale+this.pan.y};}
 project(x,y,z=0){const p=iso(x,y,z),o=this.origin();return{x:p.x*this.scale+o.x,y:p.y*this.scale+o.y};}
 tile(px,py){const o=this.origin(),x=(px-o.x)/this.scale,y=(py-o.y)/this.scale;return{x:Math.round(x/TW+y/TH),y:Math.round(y/TH-x/TW)};}
 focus(x,y){this.center={x,y};this.pan={x:0,y:0};}
 reset(){this.pan={x:0,y:0};this.zoom=1;this.center={x:10,y:11};}
 hitUnit(game,point){return [...game.units].reverse().find(u=>{const p=this.project(u.x,u.y,u.elevation||0);return Math.abs(point.x-p.x)<15*this.scale&&point.y>p.y-43*this.scale&&point.y<p.y+6*this.scale;});}
 hitBuilding(game,point,labelsOnly=false){
  const ctx=this.ctx;ctx.font='600 12px Arial';
  for(const b of [...game.buildings].sort((a,b)=>(b.x+b.y)-(a.x+a.y))){const p=this.project(b.x,b.y),labelWidth=ctx.measureText(t(b.type)).width+20;
   if(this.labels&&Math.abs(point.x-p.x)<=labelWidth/2&&point.y>=p.y+23*this.scale&&point.y<=p.y+23*this.scale+23&&!['wall','tower','well','gate'].includes(b.type))return b;
   if(labelsOnly)continue;
   if(['wall','gate','bridge'].includes(b.type)&&Math.abs(point.x-p.x)<46*this.scale&&point.y>p.y-47*this.scale&&point.y<p.y+15*this.scale)return b;
   const frameType=b.landmark==='mine'?'mine':b.type,group=Object.hasOwn(advancedFrames,frameType)?'advanced':Object.hasOwn(buildingFrames,frameType)?'buildings':'details',sheet=art[group];if(!sheet)continue;const box=sheet.boxes[(group==='advanced'?advancedFrames:group==='buildings'?buildingFrames:detailFrames)[frameType]];if(!box)continue;const w=(b.type==='keep'?142:b.type==='tower'?76:b.type==='wall'?85:b.type==='well'?66:112)*this.scale,h=w*box.h/box.w,left=p.x-w/2,top=p.y+w*.18-h;
   if(point.x<left||point.x>left+w||point.y<top||point.y>top+h)continue;const sx=Math.floor(box.x+(point.x-left)/w*box.w),sy=Math.floor(box.y+(point.y-top)/h*box.h);if(sheet.data[(sy*sheet.image.width+sx)*4+3]>35)return b;
  }
 }
 render(game,time){const ctx=this.ctx;ctx.setTransform(this.dpr,0,0,this.dpr,0,0);ctx.clearRect(0,0,this.w,this.h);const bg=ctx.createLinearGradient(0,0,0,this.h);bg.addColorStop(0,'#6f914c');bg.addColorStop(.5,'#83a357');bg.addColorStop(1,'#678747');ctx.fillStyle=bg;ctx.fillRect(0,0,this.w,this.h);
  // Mist and wooded hills beyond the playable plateau.
  for(let layer=0;layer<3;layer++){ctx.beginPath();ctx.moveTo(0,this.h);for(let x=0;x<=this.w+60;x+=35)ctx.lineTo(x,this.h*.2+layer*50+Math.sin(x/180+layer*2)*28+Math.sin(x/47)*9);ctx.lineTo(this.w,this.h);ctx.fillStyle=['#718e7b32','#71866e25','#5d806534'][layer];ctx.fill();}
  const o=this.origin();ctx.save();ctx.translate(o.x,o.y);ctx.scale(this.scale,this.scale);
  const corners=[iso(-.5,-.5),iso(game.size-.5,-.5),iso(game.size-.5,game.size-.5),iso(-.5,game.size-.5)];poly(ctx,[corners[3],corners[2],{x:corners[2].x,y:corners[2].y+25},{x:corners[3].x,y:corners[3].y+25}],'#666f4e');poly(ctx,[corners[1],corners[2],{x:corners[2].x,y:corners[2].y+25},{x:corners[1].x,y:corners[1].y+25}],'#56694e');
  const objects=[];
  if(this.cachedGame!==game||this.groundVersion!==game.navigationVersion){this.cachedGame=game;this.groundVersion=game.navigationVersion;this.ground=paintGround(game);}
  const source=this.ground.surface,sx=Math.max(0,this.ground.offset.x-o.x/this.scale),sy=Math.max(0,this.ground.offset.y-o.y/this.scale),sw=Math.min(source.width-sx,this.w/this.scale),sh=Math.min(source.height-sy,this.h/this.scale);if(sw>0&&sh>0)ctx.drawImage(source,sx,sy,sw,sh,sx-this.ground.offset.x,sy-this.ground.offset.y,sw,sh);
  const visible=(x,y,margin=180)=>{const p=iso(x,y),px=p.x*this.scale+o.x,py=p.y*this.scale+o.y;return px>-margin*this.scale&&px<this.w+margin*this.scale&&py>-25*this.scale&&py<this.h+margin*this.scale;};
  for(let y=0;y<game.size;y++)for(let x=0;x<game.size;x++){
   if(!visible(x,y,145))continue;const kind=game.land(x,y),n=seed(x,y),p=iso(x,y);
   if(this.grid||this.build){if(kind==='grass')poly(ctx,[iso(x-.5,y-.5),iso(x+.5,y-.5),iso(x+.5,y+.5),iso(x-.5,y+.5)],'#ffffff00','#e4e6bc26');}
   if(kind==='water'){
    const phase=time*.5+x*2+y;ctx.globalAlpha=.15+Math.sin(phase)*.08;line(ctx,{x:p.x-15,y:p.y+Math.sin(phase)*3},{x:p.x+16,y:p.y+Math.sin(phase)*3},'#d4e6ce',1);line(ctx,{x:p.x+5,y:p.y+7},{x:p.x+20,y:p.y+7},'#97c3b9',.8);ctx.globalAlpha=1;
   }else if(kind==='forest'&&n>.19){const tx=x+(seed(y,x)-.5)*.28,ty=y+(n-.5)*.3;objects.push({depth:tx+ty,draw:()=>tree(ctx,tx,ty,n)});}
   else if(kind==='rock')objects.push({depth:x+y,draw:()=>{if(!sprite(ctx,'rock',x,y,52+n*24))prism(ctx,x,y,.7,.65,11+n*16,0,['#c1c0a5','#7f8976','#a5ad92']);}});
  }
  if(this.hover&&(this.build||this.selected==='rally')){const {x,y}=this.hover;if(x>=0&&y>=0&&x<game.size&&y<game.size){const ok=this.build?!game.buildReason(this.build,x,y):game.land(x,y)==='grass';poly(ctx,[iso(x-.5,y-.5),iso(x+.5,y-.5),iso(x+.5,y+.5),iso(x-.5,y+.5)],ok?'#efce6a70':'#dc725870',ok?'#fff0af':'#ea8275');if(this.build){ctx.globalAlpha=.58;drawBuilding(ctx,{x,y,type:this.build,level:1,links:game.fortificationLinks({x,y})},time);ctx.globalAlpha=1;}}}
  if(this.preview)for(const point of this.preview){poly(ctx,[iso(point.x-.5,point.y-.5),iso(point.x+.5,point.y-.5),iso(point.x+.5,point.y+.5),iso(point.x-.5,point.y+.5)],this.previewValid===false?'#d57f6e88':'#dfc87e88','#fff2bc');ctx.globalAlpha=.65;drawBuilding(ctx,{...point,type:this.build||'wall',level:1,links:game.fortificationLinks(point)},time);ctx.globalAlpha=1;}
  if(this.target){const{x,y}=this.target;const pulse=.55+Math.sin(performance.now()/300)*.2;poly(ctx,[iso(x-.5,y-.5),iso(x+.5,y-.5),iso(x+.5,y+.5),iso(x-.5,y+.5)],`rgba(255,217,107,${pulse})`,'#fff5c8');if(this.build){ctx.globalAlpha=.7;drawBuilding(ctx,{x,y,type:this.build,level:1,links:game.fortificationLinks({x,y})},time);ctx.globalAlpha=1;}}
  for(const b of game.buildings)if(visible(b.x,b.y,240))objects.push({depth:b.x+b.y+.15,draw:()=>{if(b.id===this.selected){const p=iso(b.x,b.y);ctx.beginPath();ctx.ellipse(p.x,p.y,32,16,0,0,7);ctx.strokeStyle='#fce09c';ctx.lineWidth=2.5;ctx.stroke();}drawBuilding(ctx,{...b,links:game.fortificationLinks(b)},time);buildingDamage(ctx,b,time);if(b.hp<b.maxHp){const p=iso(b.x,b.y,b.type==='keep'?96:64);ctx.fillStyle='#27382c';ctx.fillRect(p.x-17,p.y,34,4);ctx.fillStyle=b.hp/b.maxHp<.35?'#ba6850':'#a8bc80';ctx.fillRect(p.x-17,p.y,34*b.hp/b.maxHp,4);}}});
  if(game.convoy)objects.push({depth:game.convoy.x+game.convoy.y+.3,draw:()=>{const a=game.convoy;if(sprite(ctx,'caravan',a.x,a.y,80))return;prism(ctx,a.x,a.y,.55,.8,12,0,['#c3aa77','#7a6346','#a48b62']);roof(ctx,a.x,a.y,.6,.85,12,'#c8bea0');for(const dy of[-.3,.3]){const p=iso(a.x+.3,a.y+dy);ctx.fillStyle='#483c2d';ctx.beginPath();ctx.arc(p.x,p.y,4,0,7);ctx.fill();}}});
  for(const a of [...game.units,...game.enemies])if(visible(a.x,a.y))objects.push({depth:a.x+a.y+.3,draw:()=>{if(this.selectedUnits?.has(a.id)){const p=iso(a.x,a.y);ctx.strokeStyle='#ffe094';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y,11,5,0,0,7);ctx.stroke();}ctx.save();ctx.translate(0,-(a.elevation||0));person(ctx,a,time);ctx.restore();if(a.hp<a.maxHp){const p=iso(a.x,a.y,21);ctx.fillStyle='#343c32';ctx.fillRect(p.x-7,p.y,14,2);ctx.fillStyle='#ce9271';ctx.fillRect(p.x-7,p.y,14*a.hp/a.maxHp,2);}}});
  for(const w of game.villagers){if(!visible(w.x,w.y))continue;const b=game.buildings.find(b=>b.id===w.buildingId);if(b)objects.push({depth:w.x+w.y+.35,draw:()=>workerPerson(ctx,w,b,time)});}
  objects.sort((a,b)=>a.depth-b.depth);for(const object of objects)object.draw();
  for(const p of game.projectiles){const progress=p.t/p.life,a=iso(p.x+(p.tx-p.x)*progress,p.y+(p.ty-p.y)*progress,(p.z||25)*(1-progress)+18*Math.sin(progress*Math.PI));line(ctx,a,{x:a.x-7,y:a.y+3},'#ffedba',1.7);}
  for(const e of game.effects){const p=iso(e.x,e.y,e.type==='collapse'?2:16),age=e.t/e.life;ctx.globalAlpha=1-age;
   if(e.type==='delivery'){ctx.font='bold 11px Arial';ctx.textAlign='center';ctx.fillStyle=e.resource==='wood'?'#e3c490':e.resource==='stone'?'#e4e9d7':'#ffe096';ctx.strokeStyle='#293c2c';ctx.lineWidth=3;const text='+'+Math.round(e.amount);ctx.strokeText(text,p.x,p.y-15-age*24);ctx.fillText(text,p.x,p.y-15-age*24);}
   else if(e.type==='collapse'){
    for(let i=0;i<9;i++){const angle=i*2.4,dx=Math.cos(angle)*age*35,dy=Math.sin(angle)*age*14;ctx.fillStyle=i%2?'#b6ac89':'#827b65';ctx.fillRect(p.x+dx-3,p.y+dy-3-Math.sin(age*Math.PI)*16,5,4);}
    for(let i=0;i<4;i++){ctx.fillStyle='#d6c39b66';ctx.beginPath();ctx.ellipse(p.x+(i-1.5)*12,p.y-age*18,8+age*20,5+age*10,0,0,7);ctx.fill();}
   }else if(e.type==='fall'){ctx.fillStyle='#655741aa';ctx.beginPath();ctx.ellipse(p.x,p.y+12,9,3,.3,0,7);ctx.fill();}
   else{ctx.strokeStyle=e.type==='arrowHit'?'#f6d780':'#ffbe80';ctx.lineWidth=1.7;for(let i=0;i<5;i++){const a=i*1.26;line(ctx,{x:p.x+Math.cos(a)*age*12,y:p.y+Math.sin(a)*age*7},{x:p.x+Math.cos(a)*(age*12+3),y:p.y+Math.sin(a)*(age*7+2)},ctx.strokeStyle,1.4);}}
   ctx.globalAlpha=1;
  }
  const camp=iso(7,1);flag(ctx,7,1,18,time,'#a65c49');ctx.fillStyle='#523f31';ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillText('▼',camp.x,camp.y+17);
  ctx.restore();
  if(game.night){ctx.fillStyle='#102c5b3c';ctx.fillRect(0,0,this.w,this.h);}if(game.weather==='rain'){ctx.fillStyle='#24434e12';ctx.fillRect(0,0,this.w,this.h);ctx.strokeStyle='#e1f0eb55';ctx.lineWidth=1;ctx.beginPath();for(let i=0;i<70;i++){const x=(seed(i,8)*this.w+time*90)%this.w,y=(seed(i,5)*this.h+time*360)%this.h;ctx.moveTo(x,y);ctx.lineTo(x-5,y+13);}ctx.stroke();}
  const sunlight=ctx.createLinearGradient(0,0,this.w,this.h);sunlight.addColorStop(0,'#ffe3a91a');sunlight.addColorStop(.6,'#fff1c700');sunlight.addColorStop(1,'#173d3022');ctx.fillStyle=sunlight;ctx.fillRect(0,0,this.w,this.h);
  for(let i=0;i<12;i++){const px=(seed(i,3)*this.w+Math.sin(time*.16+i)*18),py=(seed(i,9)*this.h-time*(1+i%3))%this.h;ctx.globalAlpha=.15+Math.sin(time*.6+i)*.1;ctx.fillStyle='#ffedbc';ctx.beginPath();ctx.arc(px,py,1.2,0,7);ctx.fill();}ctx.globalAlpha=1;
  const vignette=ctx.createRadialGradient(this.w*.5,this.h*.5,this.h*.15,this.w*.5,this.h*.5,this.w*.65);vignette.addColorStop(0,'#29493200');vignette.addColorStop(1,'#1d341220');ctx.fillStyle=vignette;ctx.fillRect(0,0,this.w,this.h);
  for(const b of game.buildings){if(!PRODUCTION[b.type])continue;const workers=game.villagers.filter(w=>w.buildingId===b.id),alert=workers.some(w=>w.blocked)?'!':workers.some(w=>w.waitingInput)?'?':workers.some(w=>w.storageFull)?'▣':game.labor<.8?'−':b.stock>25?'…':null;if(alert){const p=this.project(b.x,b.y,70);ctx.fillStyle=alert==='!'?'#a85b3a':'#475b32';ctx.beginPath();ctx.arc(p.x+28*this.scale,p.y,10,0,7);ctx.fill();ctx.fillStyle='#ffe4a2';ctx.font='bold 14px Arial';ctx.textAlign='center';ctx.fillText(alert,p.x+28*this.scale,p.y+5);}}
  if(this.labels)for(const b of game.buildings){if(['wall','tower','well','gate'].includes(b.type)&&b.id!==this.selected)continue;const p=this.project(b.x,b.y);const label=t(b.type);ctx.font='600 12px Arial';ctx.textAlign='center';const width=ctx.measureText(label).width+20;if(p.x<15||p.x>this.w-15||p.y<70||p.y>this.h-175)continue;ctx.fillStyle='#20382ee8';ctx.strokeStyle='#c8aa6655';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(p.x-width/2,p.y+23*this.scale,width,23,6);ctx.fill();ctx.stroke();ctx.fillStyle='#f4e9cf';ctx.fillText(label,p.x,p.y+23*this.scale+15);}
  if(this.target){const p=this.project(this.target.x,this.target.y);const text=t('tapHere');ctx.font='bold 14px Arial';ctx.textAlign='center';const width=ctx.measureText(text).width+28;const yy=p.y-88*this.scale;ctx.fillStyle='#fff2bc';ctx.beginPath();ctx.roundRect(p.x-width/2,yy-21,width,33,6);ctx.fill();ctx.fillStyle='#44321d';ctx.fillText(text,p.x,yy);poly(ctx,[{x:p.x-6,y:yy+12},{x:p.x+6,y:yy+12},{x:p.x,y:yy+20}],'#fff2bc');}
  const mini=document.getElementById('minimap');if(mini&&mini.offsetParent!==null){const mc=mini.getContext('2d'),unit=mini.width/game.size;if(this.miniMap!==game.mapKey||!this.miniGround){this.miniMap=game.mapKey;this.miniGround=document.createElement('canvas');this.miniGround.width=mini.width;this.miniGround.height=mini.height;const bg=this.miniGround.getContext('2d');for(let y=0;y<game.size;y++)for(let x=0;x<game.size;x++){bg.fillStyle=game.land(x,y)==='water'?'#6999a0':game.land(x,y)==='forest'?'#385b35':game.land(x,y)==='rock'?'#adb39b':'#87a05e';bg.fillRect(x*unit,y*unit,unit+.5,unit+.5);}}mc.drawImage(this.miniGround,0,0);for(const b of game.buildings){mc.fillStyle=b.type==='keep'?'#fff0b9':'#d5ba7c';mc.fillRect(b.x*unit-1,b.y*unit-1,4,4);}for(const e of game.enemies){mc.fillStyle='#d35639';mc.fillRect(e.x*unit,e.y*unit,3,3);}const center=this.tile(this.w*(this.w<760?.5:.59),this.h*.46);mc.strokeStyle='#fff9df';mc.lineWidth=1.5;mc.strokeRect((center.x-3)*unit,(center.y-3)*unit,6*unit,6*unit);}
 }
}
