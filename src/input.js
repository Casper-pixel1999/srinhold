import {zoomAt} from './render.js';

export function connectInput(canvas,renderer,onTap) {
  const pointers=new Map();let pinching=false,pinchDistance=0,pinchCenter=null;
  const point=e=>{const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};};
  const pair=()=>{const [a,b]=[...pointers.values()];return {distance:Math.hypot(a.x-b.x,a.y-b.y),center:{x:(a.x+b.x)/2,y:(a.y+b.y)/2}};};
  canvas.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse'&&e.button!==0)return;
    const p=point(e);pointers.set(e.pointerId,{...p,startX:p.x,startY:p.y,moved:false});canvas.setPointerCapture(e.pointerId);
    if(pointers.size===2){pinching=true;for(const p of pointers.values())p.moved=true;const data=pair();pinchDistance=data.distance;pinchCenter=data.center;}
  });
  canvas.addEventListener('pointermove',e=>{
    const old=pointers.get(e.pointerId);if(!old)return;
    const p=point(e),dx=p.x-old.x,dy=p.y-old.y;
    old.x=p.x;old.y=p.y;
    if(Math.hypot(p.x-old.startX,p.y-old.startY)>7)old.moved=true;
    if(pointers.size>=2){
      const data=pair();if(pinchDistance>0)zoomAt(renderer.camera,data.distance/pinchDistance,pinchCenter.x,pinchCenter.y);
      renderer.camera.x+=data.center.x-pinchCenter.x;renderer.camera.y+=data.center.y-pinchCenter.y;
      pinchDistance=data.distance;pinchCenter=data.center;
    }else if(old.moved){renderer.camera.x+=dx;renderer.camera.y+=dy;}
  });
  function finish(e,cancelled) {
    const p=pointers.get(e.pointerId);if(!p)return;
    pointers.delete(e.pointerId);
    if(!cancelled&&!p.moved&&!pinching)onTap(renderer.pick(p.x,p.y),p);
    if(!pointers.size){pinching=false;pinchDistance=0;pinchCenter=null;}
  }
  canvas.addEventListener('pointerup',e=>finish(e,false));canvas.addEventListener('pointercancel',e=>finish(e,true));canvas.addEventListener('lostpointercapture',e=>finish(e,true));
  canvas.addEventListener('wheel',e=>{e.preventDefault();const p=point(e);zoomAt(renderer.camera,Math.exp(-e.deltaY*.0015),p.x,p.y);},{passive:false});
}
