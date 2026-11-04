// Presentation only: charge and damage remain owned by the combat system.
const states=new WeakMap();
export function updateLaughReady(g,dt=0){
 let s=states.get(g);if(!s){s={ready:false,flash:0,phase:0};states.set(g,s)}
 if(g.mode!=='play')return s;
 const ready=g.activeCharge>=g.activeCost();
 s.phase+=Math.max(0,dt);
 s.flash=ready&&!s.ready?.8:ready?Math.max(0,s.flash-Math.max(0,dt)):0;
 s.ready=ready;return s;
}
export function laughReadyState(g){return states.get(g)||{ready:false,flash:0,phase:0}}
const block=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x/2)*2,Math.round(y/2)*2,w,h)};
export function drawLaughReady(c,g,reducedMotion=false){
 const s=laughReadyState(g);if(g.mode!=='play'||!s.ready||g.activeCharge<g.activeCost())return;
 const x=g.p.x,y=Math.max(24,g.p.y-77),gold='#ffd66e',cream='#fff6c9',ink='#473e2e';
 c.save();
 // A small outlined sound glyph stays above the sprite, not over the hitbox.
 block(c,x-16,y-12,32,24,ink);block(c,x-14,y-10,28,20,gold);
 block(c,x-10,y-3,4,6,ink);block(c,x-6,y-6,4,12,ink);
 for(const side of [-1,1]){block(c,x+2,y+side*4,4,2,ink);block(c,x+6,y+side*7,4,2,ink)}
 block(c,x+4,y-2,2,4,ink);block(c,x+10,y-5,2,10,ink);
 if(s.flash>0&&!reducedMotion){
  const t=1-s.flash/.8,r=30+t*26;c.globalAlpha=Math.min(1,s.flash*2.5);
  for(const side of [-1,1]){
   const sx=x+side*r,sy=g.p.y-25;
   block(c,sx,sy-12,4,24,ink);block(c,sx,sy-10,2,20,gold);
   for(const v of [-1,1]){block(c,sx-side*6,sy+v*14,8,4,ink);block(c,sx-side*4,sy+v*14,4,2,cream)}
   block(c,x+side*(18+t*28),y-20-t*10,4,4,gold);
  }
 }
 c.restore();
}
