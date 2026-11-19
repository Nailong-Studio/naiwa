import {blocked,moveOnTerrain,safeSpot} from './terrain.js';

export const FROG_JUMP_SECONDS=.23;
export const FROG_JUMP_SPEED=730;
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));

// Search back along the intended jump, never through a wall or beyond its range.
// A gap wider than one jump has no landing on its far bank, so stop on this bank.
export function frogJumpLanding(room,x,y,toX,toY,r){
 const dx=toX-x,dy=toY-y,steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/2));
 for(let i=steps;i>=0;i--){
  const point={x:x+dx*i/steps,y:y+dy*i/steps};
  if(point.x>=49&&point.x<=911&&point.y>=49&&point.y<=551&&!blocked(room,point.x,point.y,r))return point;
 }
 return null;
}

export function moveFrogOnTerrain(room,p,fromX,fromY,landing=false){
 if(!(p.dash>0)){delete p.frogJump;moveOnTerrain(room,p,fromX,fromY);return}
 let jump=p.frogJump;
 if(!jump||jump.roomId!==room.id){
  const remaining=Math.min(FROG_JUMP_SECONDS,p.dash);
  const end=frogJumpLanding(room,fromX,fromY,
   clamp(fromX+p.dx*FROG_JUMP_SPEED*remaining,49,911),
   clamp(fromY+p.dy*FROG_JUMP_SPEED*remaining,49,551),p.r)
   ||safeSpot(room,fromX,fromY,p.r);
  jump=p.frogJump={roomId:room.id,x:fromX,y:fromY,toX:end.x,toY:end.y};
 }
 const dx=jump.toX-jump.x,dy=jump.toY-jump.y,length2=dx*dx+dy*dy;
 const progress=length2?clamp(((p.x-jump.x)*dx+(p.y-jump.y)*dy)/length2,0,1):1;
 p.x=jump.x+dx*progress;p.y=jump.y+dy*progress;
 if(landing){
  // Bosses can create new obstacles during a jump. Recheck before touching down.
  const end=frogJumpLanding(room,jump.x,jump.y,jump.toX,jump.toY,p.r)||safeSpot(room,jump.x,jump.y,p.r);
  p.x=end.x;p.y=end.y;delete p.frogJump;
 }
}
