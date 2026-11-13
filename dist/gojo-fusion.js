import {BOMB_DAMAGE,itemCombatActive} from './combat-values.js';
import {shotLaneOpen,moveOnTerrain} from './terrain.js';

export const GOJO={cooldown:8,redDamage:6,blueDamage:4,purpleDamage:BOMB_DAMAGE*2,radius:130,warning:.85,redRange:210};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function touchOrb(g,orb,kind,dt){
 for(const e of [...g.room.enemies]){
  if(e.dead||e.airborne||!shotLaneOpen(g.room,orb,e))continue;
  const d=distance(e,orb);
  if(kind==='blue'&&d>12&&d<95&&e.type!=='boss'&&!['fly','hopper'].includes(e.type)){
   const x=e.x,y=e.y,step=Math.min(d-12,100*dt);e.x+=(orb.x-x)/d*step;e.y+=(orb.y-y)/d*step;moveOnTerrain(g.room,e,x,y);
  }
  if(d>e.r+14||orb.hits.has(e))continue;
  orb.hits.add(e);g.damageEnemy(e,kind==='red'?GOJO.redDamage:GOJO.blueDamage,false);
  if(kind==='red'&&e.type!=='boss'){const dx=e.x-orb.x,dy=e.y-orb.y,n=Math.hypot(dx,dy)||1;e.vx=dx/n*190;e.vy=dy/n*190;e.repelled=.16}
  g.effects.push({type:'petImpact',x:e.x,y:e.y,life:.16,max:.16,radius:18});
 }
}
function detonate(g,s){
 const p=s.purple;
 g.effects.push({type:'gojoBlast',x:p.x,y:p.y,radius:GOJO.radius,life:.55,max:.55});
 for(const e of [...g.room.enemies])if(!e.dead&&!e.airborne&&distance(e,p)<=GOJO.radius+e.r&&shotLaneOpen(g.room,p,e))g.damageEnemy(e,GOJO.purpleDamage,false);
 if(distance(g.p,p)<=GOJO.radius+g.p.r&&shotLaneOpen(g.room,p,g.p))g.hurt();
 g.emit('gojoBlast');s.phase='spent';s.left=.35;s.purple=null;
}
export function updateGojoFusion(g,dt,origin){
 const dash=g.p.dash>0,started=dash&&!g.chronoDash,landed=!dash&&g.chronoDash,clock=g.actionClock||0;g.chronoDash=dash;
 if(started&&g.has('gojohalf')&&itemCombatActive(g.room)&&!(g.gojoReadyAt>clock)){
  g.gojoReadyAt=clock+GOJO.cooldown;
  g.gojo={version:2,x:origin.x,y:origin.y,face:g.p.face,left:6,phase:'takeoff',t:0,feet:null,red:null,blue:null,purple:null};g.emit('gojoSplit');
 }
 const s=g.gojo;if(!s)return;
 // Retire an old pre-rework summon safely when resuming a previous save.
 if(s.version!==2||!itemCombatActive(g.room)||!g.has('gojohalf')){g.gojo=null;return}
 s.left-=dt;s.t+=dt;if(s.left<=0){g.gojo=null;return}
 if(s.phase==='takeoff'){
  if(landed){s.feet={x:g.p.x,y:g.p.y,face:g.p.face};s.phase='redWindup';s.t=0}
  return;
 }
 if(s.phase==='redWindup'&&s.t>=.2){
  const angle=g.random()*Math.PI*2;
  s.red={x:s.feet.x,y:s.feet.y-10,dx:Math.cos(angle),dy:Math.sin(angle),travel:0,hits:new Set()};s.phase='redFlight';s.t=0;
 }
 if(s.phase==='redFlight'){
  const r=s.red,step=Math.min(330*dt,GOJO.redRange-r.travel),next={x:r.x+r.dx*step,y:r.y+r.dy*step};
  const blocked=next.x<62||next.x>898||next.y<62||next.y>538||!shotLaneOpen(g.room,r,next);
  if(!blocked){r.x=next.x;r.y=next.y;r.travel+=step;touchOrb(g,r,'red',dt)}
  if(blocked||r.travel>=GOJO.redRange-.01){s.phase='redHold';s.t=0}
 }else if(s.phase==='redHold'&&s.t>=.25){
  s.blue={x:s.x,y:s.y-14,hits:new Set()};s.phase='blueFlight';s.t=0;
 }else if(s.phase==='blueFlight'){
  const b=s.blue,r=s.red,d=distance(b,r),step=Math.min(d,520*dt);
  if(d>0){b.x+=(r.x-b.x)/d*step;b.y+=(r.y-b.y)/d*step}
  // Blue is a spectral projectile: it can reach Red across cover, but cannot
  // pull or damage enemies through cover. The final blast uses the same check.
  touchOrb(g,b,'blue',dt);
  if(distance(b,r)<=24){s.purple={x:r.x,y:r.y,t:0};s.red=null;s.blue=null;s.phase='fusion';s.t=0;g.emit('gojoFuse')}
 }else if(s.phase==='fusion'){
  s.purple.t+=dt;if(s.purple.t>=GOJO.warning)detonate(g,s);
 }
}
