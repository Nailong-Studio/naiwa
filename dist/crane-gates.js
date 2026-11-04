import {overlaps} from './terrain.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Two full-height arms make a corridor; its opening is locked before closing.
export function startCraneGate(g,e){
 const rage=e.hp<e.maxHp*.5;
 e.hands={mode:'gate',t:0,wind:1,placed:false,cancelled:false,fired:0,rage,gap:clamp(g.p.y,165,435),x:clamp(g.p.x,210,750)};
 e.cd=rage?4.7:4.2;
 g.emit('toast',{text:'分拣巨钳 · 封线清场！穿过双臂间的开口，炸掌可停机。'});
 return true;
}
export function craneArms(h){
 const gapSize=156,top=h.gap-gapSize/2,bottom=h.gap+gapSize/2;
 return [{x:h.x,y:(55+top)/2,w:62,h:top-55,r:31},{x:h.x,y:(545+bottom)/2,w:62,h:545-bottom,r:31}];
}
export function updateCraneGate(g,e,dt){
 const h=e.hands;if(h?.mode!=='gate')return false;
 if(e.dead||h.cancelled||e.handDisabled>0){g.room.obstacles=g.room.obstacles.filter(o=>o.owner!==e);g.enemyBullets=g.enemyBullets.filter(b=>b.catcherPressure!==e);e.hands=null;return true}
 h.t+=dt;
 if(h.t>=h.wind&&!h.placed){h.placed=true;g.room.obstacles.push(...craneArms(h).map(a=>({...a,kind:'hand',owner:e})));for(const a of craneArms(h))if(overlaps(a,g.p.x,g.p.y,g.p.r)){g.hurt();g.p.x=clamp(a.x+(g.p.x<a.x?-1:1)*(31+g.p.r+6),72,888)}}
 // Walls travel from the far side; the generous hole matches the hand opening.
 if(h.t>=1.3+h.fired*.85&&h.fired<(h.rage?4:3)){
  const fromLeft=e.x<g.p.x,dir=fromLeft?1:-1;
  for(let y=70;y<=530;y+=24)if(Math.abs(y-h.gap)>94)g.enemyBullets.push({x:fromLeft?65:895,y,vx:dir*(h.rage?285:245),vy:0,r:7,life:4,catcherPressure:e});
  h.fired++;
 }
 if(h.t>=(h.rage?4.35:3.8)){g.room.obstacles=g.room.obstacles.filter(o=>o.owner!==e);e.hands=null}
 return true;
}
export function drawCraneGates(c,g){
 for(const e of g.room.enemies){const h=e.hands;if(e.dead||h?.mode!=='gate'||h.cancelled)continue;
  c.save();c.fillStyle='#76c99940';c.fillRect(55,h.gap-78,850,156);c.strokeStyle='#7cce9b';c.lineWidth=3;c.strokeRect(55,h.gap-78,850,156);
  c.fillStyle='#e8ae7255';c.fillRect(h.x-31,55,62,h.gap-133);c.fillRect(h.x-31,h.gap+78,62,467-h.gap);
  for(const a of craneArms(h)){
   c.save();c.beginPath();c.rect(55,55,850,h.gap-133);c.rect(55,h.gap+78,850,467-h.gap);c.clip();
   c.strokeStyle='#4b4237';c.lineWidth=18;c.beginPath();c.moveTo(e.x,e.y);c.lineTo(a.x,e.y);c.lineTo(a.x,a.y);c.stroke();
   c.strokeStyle='#dab269';c.lineWidth=10;c.stroke();c.restore();c.fillStyle=h.placed?'#cf9853':'#cf985380';c.fillRect(a.x-a.w/2,a.y-a.h/2,a.w,a.h);c.strokeStyle='#493c30';c.lineWidth=3;c.strokeRect(a.x-a.w/2,a.y-a.h/2,a.w,a.h);
   for(let y=a.y-a.h/2+8;y<a.y+a.h/2-4;y+=20){c.fillStyle='#654e34';c.fillRect(a.x-28,y,56,5)}
  }
  c.textAlign='center';c.font='bold 13px system-ui';c.fillStyle='#294c39';c.fillText(h.placed?'穿过钳口 · 炸掌停机':'钳口锁定 · 移向绿色开口',480,h.gap+5);c.restore();
 }
}
