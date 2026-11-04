import {interruptRanged} from './ranged-interrupt.js';
import {MEME_FOLLOWERS} from './meme-items.js';
import {drawSprite} from './sprite-art.js';
import {steer,moveOnTerrain,safeSpot,shotLaneOpen} from './terrain.js';
// Threats are ranked by estimated arrival, not by spawn order. Moving-away
// and harmless tangential shots must not consume the rescue interception.
function incomingThreats(g){return g.enemyBullets.map(b=>{
 const dx=b.x-g.p.x,dy=b.y-g.p.y,vx=b.vx||0,vy=b.vy||0,v2=vx*vx+vy*vy;
 const radius=g.p.r+(b.r||6)+14,time=v2?-(dx*vx+dy*vy)/v2:0;
 const close=Math.hypot(dx,dy)<=radius;
 if(Math.hypot(dx,dy)>180||(!close&&(time<0||time>.8)))return null;
 const t=Math.max(0,Math.min(.8,time));
 return Math.hypot(dx+vx*t,dy+vy*t)<=radius?{bullet:b,time:t}:null;
 }).filter(Boolean).sort((a,b)=>a.time-b.time).map(v=>v.bullet);}
export function updateMemeFollowers(g,dt){
 g.shrimpMeals=(g.shrimpMeals||[]).filter(m=>{m.age+=dt;m.life-=dt;if(m.life<=0)return false;if(m.age>=.35&&Math.hypot(g.p.x-m.x,g.p.y-m.y)<32){g.tempuraBuff=g.has('shrimppaste')?12:10;g.effects.push({type:'petCollect',x:m.x,y:m.y,life:.3,max:.3,radius:18});g.emit('toast',{text:'虾米补给：伤害 +35%，移速 +15%！'});return false}return m.life>0});
 g.memePets??={};const ids=MEME_FOLLOWERS.filter(id=>g.has(id));
 for(const [i,id] of ids.entries()){
  const a=3.5+i*.8,home={x:Math.max(80,Math.min(880,g.p.x+Math.cos(a)*85)),y:Math.max(80,Math.min(520,g.p.y+Math.sin(a)*60))};
  const s=g.memePets[id]??={...safeSpot(g.room,home.x,home.y,10),r:10,type:'pet',cd:id==='tempura'?1.4:1+i*.3,phase:'idle',t:0};s.t+=dt;s.cd-=dt;
  if(s.phase==='idle'){
   const d=Math.hypot(home.x-s.x,home.y-s.y),v=steer(g.room,s,home),x=s.x,y=s.y;s.x+=v.x*Math.min(d,260*dt);s.y+=v.y*Math.min(d,260*dt);moveOnTerrain(g.room,s,x,y);s.moving=Math.hypot(s.x-x,s.y-y)>.1;
   const enemy=g.room.enemies.filter(e=>!e.dead&&!e.airborne&&(!['penguin','kobe'].includes(id)||shotLaneOpen(g.room,s,e))&&(id!=='penguin'||!['fly','hopper'].includes(e.type))&&(id!=='sun'||e.type!=='boss'&&(g.canEnemyShoot(e)||e.type==='shooter')&&!(e.phoneMutedUntil>g.elapsed)&&Math.hypot(e.x-s.x,e.y-s.y)<360&&shotLaneOpen(g.room,s,e))).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y))[0];
   const device=id==='sun'?g.room.obstacles.find(o=>['resonator','relay'].includes(o.kind)&&!(o.disabled>0)&&Math.hypot(o.x-s.x,o.y-s.y)<300):null;
   const bullet=id==='sweetpenguin'?incomingThreats(g)[0]:null;
   const canFeed=id==='tempura'&&!g.room.clear&&(g.room.tempuraServings||0)<2&&!g.shrimpMeals.length;
   if(s.cd<=0&&(id==='sweetpenguin'?bullet:id==='tempura'?canFeed:enemy||device)){s.target=device||bullet||enemy||g.p;s.device=!!device;s.phase='windup';s.t=0;s.face=s.target.x>=s.x?1:-1}
  }else if(s.phase==='windup'&&s.t>=(id==='sweetpenguin'?.18:.38)){
   s.phase='attack';s.t=0;s.cd=id==='sun'?(s.device?(g.has('propertycard')?6:8):(g.has('propertycard')?3.5:4.3)):id==='sweetpenguin'?3:id==='kobe'?2.1:id==='tempura'?6.5:2.7;
   if(id==='sweetpenguin'){
    const threats=incomingThreats(g).slice(0,5);if(!threats.length)s.cd=.35;
    for(const b of threats){g.enemyBullets=g.enemyBullets.filter(v=>v!==b);g.effects.push({type:'petBlock',x:b.x,y:b.y,life:.3,max:.3,radius:24},{type:'voiceChain',x:s.x,y:s.y-9,tx:b.x,ty:b.y,life:.2,max:.2})}
   }else if(id==='tempura'){
    if(!g.room.clear&&(g.room.tempuraServings||0)<2&&!g.shrimpMeals.length){g.room.tempuraServings=(g.room.tempuraServings||0)+1;g.emit('itemVoice',{key:'oyeye'});const q=safeSpot(g.room,s.x+(s.face||1)*24,s.y+16,8);g.shrimpMeals.push({...q,sx:s.x+(s.face||1)*14,sy:s.y-16,age:0,life:10});}
   }else if(s.device&&g.room.obstacles.includes(s.target)){s.target.disabled=3;g.emit('itemVoice',{key:'quiet'});g.effects.push({type:'voiceChain',x:s.x,y:s.y,tx:s.target.x,ty:s.target.y,life:.3,max:.3})}
   else if(id==='sun'){
    const e=s.target;if(e&&!e.dead&&e.type!=='boss'&&shotLaneOpen(g.room,s,e)){g.emit('itemVoice',{key:'quiet'});const duration=g.has('politesuit')?3.2:2.6;interruptRanged(g,e,duration);g.effects.push({type:'voiceChain',x:s.x,y:s.y-9,tx:e.x,ty:e.y-12,life:.25,max:.25});}
   }else if(s.target&&!s.target.dead){
    const rock=id==='penguin',sx=s.x+(s.face||1)*(id==='kobe'?19:14),sy=rock?s.y+6:s.y-44;
    const a=Math.atan2(s.target.y-sy,s.target.x-sx),speed=rock?300:340;
    g.bullets.push({x:sx,y:sy,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:rock?11:9,damage:rock?Math.min(4.5,1.5+g.p.damage*.75):Math.min(5,1.8+g.p.damage*.8),life:rock?2.4:1.8,bounce:rock?(g.has('stonepouch')?2:1):1,pierce:rock,rollingRock:rock,age:0,pet:true,hits:new Set(),memePet:id});
    g.effects.push({type:'petMuzzle',x:sx,y:sy,life:.18,max:.18,radius:12});
   }
  }else if(s.phase==='attack'&&s.t>=.28){s.phase='idle';s.t=0}
 }
}
export function drawMemeFollowers(c,g){
 for(const m of g.shrimpMeals||[]){const t=Math.min(1,m.age/.35),x=m.sx+(m.x-m.sx)*t,y=m.sy+(m.y-m.sy)*t-Math.sin(t*Math.PI)*20;c.save();c.fillStyle='#6c595b';c.fillRect(x-8,y-5,16,11);c.fillStyle='#f3cc83';c.fillRect(x-6,y-3,12,7);c.fillStyle='#c47b67';for(let i=0;i<3;i++)c.fillRect(x-5+i*4,y-2,2,4);c.restore();}
 for(const e of g.room.enemies)if(!e.dead&&e.phoneMutedUntil>g.elapsed){c.save();c.fillStyle='#39536d';c.fillRect(e.x-7,e.y-80,14,17);c.fillStyle='#b7e2eb';c.fillRect(e.x-4,e.y-77,8,9);c.fillStyle='#cf8ba9';for(let i=0;i<4;i++)c.fillRect(e.x-7+i*4,e.y-66-i*4,4,3);c.restore();}

 for(const id of MEME_FOLLOWERS.filter(id=>g.has(id))){const s=g.memePets?.[id];if(!s)continue;const frame=s.phase==='windup'?2:s.phase==='attack'?3:s.moving?Math.floor(g.elapsed*9)%2:0;
  const penguin=['penguin','sweetpenguin'].includes(id),row=penguin?(id==='penguin'?0:1):['unused','tempura','sun','kobe'].indexOf(id);
  const lift=id==='kobe'&&s.phase==='attack'?Math.cos(s.t/.28*Math.PI/2)*18:0;
  drawSprite(c,penguin?'penguins-actions-v1.png':'meme-followers-v1.png',frame,row,4,penguin?2:4,s.x,s.y-lift,48,{flip:s.face===-1});
 }
}
