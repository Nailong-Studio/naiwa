import {hazardEnabled,beltVector} from './chapter-mechanics.js';
import {hazardPhase,hazardActive} from './combat-content.js';
// Draw the exact damaging rectangle, with a different machine silhouette per chapter.
export function drawHazards(c,g,t){
 c.save();c.font='bold 11px system-ui';c.textAlign='center';
 for(const h of g.room.hazards||[]){
  const x=h.x-h.w/2,y=h.y-h.h/2,p=hazardPhase(g,h),on=hazardEnabled(g,h),active=on&&hazardActive(g,h),warning=on&&!active&&p<(h.kind==='resonance'?.65:h.kind==='electric'?.6:.8);
  if(h.channel){const src=g.room.obstacles.find(o=>o.device&&o.channel===h.channel);if(src){c.strokeStyle=on?'#956baf':'#657d6f';c.lineWidth=3;c.beginPath();c.moveTo(src.x,src.y);c.lineTo(h.x,src.y);c.lineTo(h.x,h.y);c.stroke()}}
  c.fillStyle='#283d42';c.fillRect(x-4,y-4,h.w+8,h.h+8);
  if(h.kind==='milk'){
   c.fillStyle=on?'#fff0c3':'#82958a';c.fillRect(x,y,h.w,h.h);c.fillStyle=on?'#e0c796':'#6c8076';
   for(let i=8;i<h.w;i+=25){c.fillRect(x+i,y+9,12,4);c.fillRect(x+i,y+h.h-14,8,4)}
   c.fillStyle='#9e7754';for(let i=0;i<4;i++)c.fillRect(h.x-13+i*8,h.y-8,3,16);
  }else if(h.kind==='belt'){
   const v=beltVector(g,h),vertical=!!v.y,sign=vertical?v.y:v.x,extent=vertical?h.h:h.w;
   c.fillStyle='#555e60';c.fillRect(x,y,h.w,h.h);c.save();c.beginPath();c.rect(x,y,h.w,h.h);c.clip();
   for(let n=-28;n<extent+28;n+=28){const q=n+(t*sign*45)%28;c.fillStyle='#93968b';if(vertical)c.fillRect(x+5,y+q,h.w-10,3);else c.fillRect(x+q,y+5,3,h.h-10)}c.restore();
   c.strokeStyle='#f1d366';c.lineWidth=4;
   for(let n=24;n<extent-8;n+=48){const ax=vertical?h.x:x+n,ay=vertical?y+n:h.y;c.beginPath();c.moveTo(ax-v.x*9-v.y*9,ay-v.y*9+v.x*9);c.lineTo(ax+v.x*8,ay+v.y*8);c.lineTo(ax-v.x*9+v.y*9,ay-v.y*9-v.x*9);c.stroke()}
   c.fillStyle='#d6b865';if(vertical){c.fillRect(x-3,y,5,h.h);c.fillRect(x+h.w-2,y,5,h.h)}else{c.fillRect(x,y-3,h.w,5);c.fillRect(x,y+h.h-2,h.w,5)}
   if(h.reverse){c.fillStyle='#eadba8';c.fillText('换向 '+(4-Math.floor((g.elapsed-(g.room.enteredAt||0))%4)),h.x,y-9)}
  }else{
   const color=h.kind==='resonance'?'#b391d2':h.kind==='press'?'#b99b67':'#9b94e0';
   c.fillStyle=active?'#e98578':warning?'#f3d58c':on?'#536a71':'#4a6257';c.fillRect(x,y,h.w,h.h);
   c.strokeStyle=active?'#fff0b9':color;c.lineWidth=3;c.strokeRect(x,y,h.w,h.h);
   if(h.kind==='resonance'){
    for(let i=8;i<h.w-8;i+=16){const size=active?Math.round(10+Math.abs(Math.sin(t*15+i))*Math.min(34,h.h-16)):4;c.fillStyle=active?'#fbe3ff':color;c.fillRect(x+i,h.y-size/2,7,size)}
    for(const sx of [x-12,x+h.w+4]){c.fillStyle='#45365b';c.fillRect(sx,y+5,8,h.h-10);c.fillStyle=color;c.fillRect(sx+2,h.y-8,4,16)}
   }else if(h.kind==='press'){
    for(let i=0;i<h.w;i+=12){c.fillStyle=i%24?'#3f4145':'#edbc59';c.fillRect(x+i,y,Math.min(12,h.w-i),8);c.fillRect(x+i,y+h.h-8,Math.min(12,h.w-i),8)}
    for(const sx of [x+7,x+h.w-15]){c.fillStyle='#303f4b';c.fillRect(sx,y+12,8,h.h-24);c.fillStyle='#b8c7c3';c.fillRect(sx+2,y+12,4,active?h.h-24:warning?Math.max(4,(p/.8)*(h.h-24)):8)}
    if(active){c.fillStyle='#b3bab7';c.fillRect(x+18,y+12,h.w-36,h.h-24);c.fillStyle='#6c787a';for(let yy=y+20;yy<y+h.h-18;yy+=16)c.fillRect(x+21,yy,h.w-42,4)}
   }else{
    const vertical=h.h>h.w,len=vertical?h.h:h.w;c.strokeStyle=active?'#ecf3ff':'#9b94bd';c.lineWidth=active?4:2;c.beginPath();
    for(let n=0;n<=len;n+=10){const zig=active?(Math.floor(n/10)%2?9:-9):0,ax=h.x+(vertical?zig:n-len/2),ay=h.y+(vertical?n-len/2:zig);if(n===0)c.moveTo(ax,ay);else c.lineTo(ax,ay)}c.stroke();
    for(const end of [-1,1]){const ax=h.x+(vertical?0:end*h.w/2),ay=h.y+(vertical?end*h.h/2:0);c.fillStyle='#433855';c.fillRect(ax-9,ay-9,18,18);c.fillStyle=on?'#e9cb8d':'#6c8e78';c.fillRect(ax-4,ay-4,8,8)}
   }
   if(warning){c.fillStyle='#4e463e';c.fillRect(x+5,y+h.h-5,(h.w-10)*(p/(h.kind==='resonance'?.65:h.kind==='electric'?.6:.8)),3)}
  }
 }
 c.restore();
}
