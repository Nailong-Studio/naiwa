import {updateMemeFollowers} from './meme-followers.js';
import {roomNeighbors} from './resource-scenes.js';
import {homeFollowerPoint,FOLLOWERS} from './followers.js';
import {steer,moveOnTerrain,safeSpot,shotLaneOpen} from './terrain.js';
function travel(g,s,target,speed,dt){const d=Math.hypot(target.x-s.x,target.y-s.y);if(d<1)return;const direction=steer(g.room,s,target),x=s.x,y=s.y,step=Math.min(d,speed*dt);s.x+=direction.x*step;s.y+=direction.y*step;moveOnTerrain(g.room,s,x,y);s.moving=Math.hypot(s.x-x,s.y-y)>.1;if(Math.abs(direction.x)>.1)s.face=direction.x>0?1:-1}
export function resetFollowers(g){g.followerStates={};g.memePets={};g.shrimpMeals=[];g.tempuraBuff=0;g.rabbitWave=null;g.rabbitRequest=null}
export function requestRabbit(g,targets){
 if(!g.has('rabbit'))return;
 const nearby=g.room.enemies.filter(e=>!e.dead&&!e.airborne&&Math.hypot(e.x-g.p.x,e.y-g.p.y)<250+e.r&&shotLaneOpen(g.room,g.p,e));if(!nearby.length)return;
 g.rabbitRequest={x:g.p.x,y:g.p.y,targets:nearby};
}
export function updateFollowers(g,dt){
 updateMemeFollowers(g,dt);
 g.followerStates??={};const enemies=g.room.enemies.filter(e=>!e.dead&&!e.airborne);
 for(const id of FOLLOWERS.filter(id=>g.has(id))){
  const home=homeFollowerPoint(g,id);
  const s=g.followerStates[id]??=({...safeSpot(g.room,home.x,home.y,10),r:10,type:'pet',phase:'idle',clock:0,cd:0,face:-1});
  s.clock+=dt;s.cd=Math.max(0,s.cd-dt);s.flash=Math.max(0,(s.flash||0)-dt);s.moving=false;
  if(id==='turtle'){
   s.x=home.x;s.y=home.y;
   let blocked=false;g.enemyBullets=g.enemyBullets.filter(b=>{if(Math.hypot(b.x-s.x,b.y-s.y)>32+b.r)return true;blocked=true;return false});
   if(blocked){s.flash=.25;g.effects.push({type:'petBlock',x:s.x,y:s.y,life:.24,max:.24,radius:34})}
   s.contactHits??=new WeakMap();for(const e of enemies)if(!['fly','hopper'].includes(e.type)&&!(s.contactHits.get(e)>g.elapsed)&&Math.hypot(e.x-s.x,e.y-s.y)<e.r+16&&shotLaneOpen(g.room,s,e)){s.contactHits.set(e,g.elapsed+.5);g.damageEnemy(e,Math.min(3,1+g.p.damage*.5));s.flash=Math.max(s.flash,.18);g.effects.push({type:'petImpact',x:s.x,y:s.y,life:.18,max:.18,radius:20})}continue;
  }
  if(id==='mouse'){
   const loot=g.room.loot.filter(l=>['coin','key','bomb'].includes(l.type)&&Math.hypot(l.x-g.p.x,l.y-g.p.y)<260).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y))[0];
   const door=g.room.clear?roomNeighbors(g).find(d=>{const r=g.rooms[d.id];return r.hidden&&r.bombLocked&&!r.revealed}):null;const sniff=door?{x:Math.max(78,Math.min(882,door.x)),y:Math.max(78,Math.min(522,door.y))}:null;travel(g,s,loot||sniff||home,loot?330:260,dt);s.phase=loot?'collect':sniff?'sniff':'idle';s.secretDoor=door;if(door&&Math.hypot(s.x-sniff.x,s.y-sniff.y)<25&&g.room.mouseHint!==door.id){g.room.mouseHint=door.id;g.emit('toast',{text:'奶鼠闻到了隐藏门！跟着奶鼠，到它指向的墙边放炸弹。'})}continue;
  }
  if(id==='rabbit'&&g.rabbitRequest){const request=g.rabbitRequest;g.rabbitRequest=null;s.phase='windup';s.clock=0;s.request=request;s.sx=s.x;s.sy=s.y}
  if(id==='rabbit'&&s.phase==='windup'&&s.clock>=.16){s.phase='leap';s.clock=0}
  if(id==='rabbit'&&s.phase==='leap'){
   const progress=Math.min(1,s.clock/.3);s.x=s.sx+(s.request.x-s.sx)*progress;s.y=s.sy+(s.request.y-s.sy)*progress;s.lift=Math.sin(progress*Math.PI)*35;
   if(progress===1){s.lift=0;s.phase='recover';s.clock=0;g.rabbitWave={x:s.x,y:s.y,t:0,targets:s.request.targets,hits:new Set()};g.effects.push({type:'petWave',x:s.x,y:s.y,life:.45,max:.45,radius:250})}continue;
  }
  if(id==='rabbit'&&s.phase==='windup')continue;
  if(id==='dog'||id==='egg'){
   if(s.phase==='idle'&&s.cd<=0&&enemies.length){
    const target=enemies.filter(e=>id!=='egg'||shotLaneOpen(g.room,s,e)).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y))[0];
    if(target&&(id==='egg'||Math.hypot(target.x-s.x,target.y-s.y)<320)){s.target=target;s.phase='windup';s.clock=0;s.face=target.x>s.x?1:-1}
   }
   if(s.phase==='windup'){
    if(s.clock<(id==='dog'?.18:.25))continue;
    if(!s.target||s.target.dead){s.phase='recover';s.clock=0;continue}
    if(id==='egg'){
     const dx=s.target.x-s.x,dy=s.target.y-s.y,len=Math.hypot(dx,dy)||1;g.shoot(dx,dy,true);const shot=g.bullets.at(-1);shot.x=s.x+dx/len*18;shot.y=s.y-8+dy/len*18;shot.eggShot=true;shot.pierce=true;shot.damage=Math.min(4,1.2+g.p.damage*.6);
     g.effects.push({type:'petMuzzle',x:shot.x,y:shot.y,life:.18,max:.18,radius:16});s.phase='recover';s.clock=0;s.cd=1.65;
    }else{s.phase='lunge';s.clock=0}
   }
   if(id==='dog'&&s.phase==='lunge'){
    if(s.target.dead||s.clock>.8){s.phase='recover';s.clock=0;s.cd=.85;continue}
    travel(g,s,s.target,720,dt);
    if(Math.hypot(s.target.x-s.x,s.target.y-s.y)<s.target.r+12&&!s.target.airborne&&shotLaneOpen(g.room,s,s.target)){g.damageEnemy(s.target,Math.min(6,2.5+g.p.damage*.75));g.effects.push({type:'petImpact',x:s.x,y:s.y,life:.25,max:.25,radius:30});s.phase='recover';s.clock=0;s.cd=.85}continue;
   }
  }
  if(s.phase==='recover'&&s.clock>.28){s.phase='idle';s.clock=0}
  travel(g,s,home,260,dt);
 }
 if(g.rabbitWave){
  const w=g.rabbitWave;w.t+=dt;const radius=Math.min(250,w.t/.45*250);
  for(const e of w.targets)if(!e.dead&&!w.hits.has(e)&&Math.hypot(e.x-w.x,e.y-w.y)<radius+e.r&&!e.airborne&&shotLaneOpen(g.room,w,e)){w.hits.add(e);g.releasingLaugh=true;try{g.damageEnemy(e,Math.min(5,2+g.p.damage*.8))}finally{g.releasingLaugh=false}g.effects.push({type:'petImpact',x:e.x,y:e.y,life:.18,max:.18,radius:20})}
  if(w.t>=.45)g.rabbitWave=null;
 }
}
