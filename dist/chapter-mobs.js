import {conductSquad,updateSoundMobs} from './sound-mobs.js';
import {overlaps} from './terrain.js';

import {CHAPTER_MOBS} from './mob-catalog.js';
export {CHAPTER_MOBS};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const inMilk=(g,e)=>g.effects.some(f=>f.type==='milkPool'&&Math.hypot(e.x-f.x,e.y-f.y)<e.r+f.radius)||(g.room.hazards||[]).some(h=>h.kind==='milk'&&!h.drained&&!g.room.clear&&overlaps(h,e.x,e.y,e.r));
function shot(g,e,a,speed=205){g.enemyBullets.push({x:e.x+Math.cos(a)*(e.r+5),y:e.y+Math.sin(a)*(e.r+5),vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:7,life:4})}
function zone(g,e,kind,x,y,radius,wind,active){g.effects.push({type:'mobZone',owner:e,kind,x,y,radius,wind,active,life:wind+active,max:wind+active,triggered:false})}
export function mobSpeed(g,e){const def=CHAPTER_MOBS[e.type];if(!def)return;
 if(e.mobCast||e.type==='beatling'&&e.beat)return 0;
 if(e.type==='milkSkater')return inMilk(g,e)?205:def.speed;
 return def.speed;
}
export function mobContact(g,e){
 if(e.type!=='scrapMine'||e.dead)return false;
 e.mobCast=null;
 g.effects.push({type:'bombBlast',x:e.x,y:e.y,radius:85,life:.4,max:.4});
 g.burst(e.x,e.y,'#f4dd99',18);
 g.damageEnemy(e,e.hp,false);
 g.hurt();
 return true;
}
export function mobAttack(g,e){
 if(!CHAPTER_MOBS[e.type]?.shoot)return false;
 if(e.mobCast){e.cd=.2;return true}
 const aim=Math.atan2(g.p.y-e.y,g.p.x-e.x);
 if(e.type==='echoBell'){e.mobCast={kind:'echo',t:0,wind:.65,aim,fired:0};e.cd=2.8}
 if(e.type==='conductor'){e.mobCast={kind:'conduct',t:0,wind:.75};e.cd=4.2}
 if(e.type==='parcelThrower'){zone(g,e,'parcel',clamp(g.p.x,95,865),clamp(g.p.y,95,505),65,1,.25);e.cd=3}
 if(e.type==='forklift'){e.mobCast={kind:'rush',t:0,wind:.75,aim};e.cd=3.8}
 if(e.type==='stitchMedic'){
  const target=g.room.enemies.filter(m=>m!==e&&!m.dead&&m.type!=='boss'&&m.hp<m.maxHp&&Math.hypot(m.x-e.x,m.y-e.y)<185).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
  if(target){e.mobCast={kind:'mend',t:0,wind:.9,target};e.cd=3.2}else{e.cd=1}
 }
 if(e.type==='lockSentry'){zone(g,e,'electric',clamp(g.p.x,110,850),clamp(g.p.y,110,490),60,.85,1.35);e.cd=3.3}
 if(e.type==='prismEye'){e.mobCast={kind:'cross',t:0,wind:.8,aim:(e.crossCycle||0)*Math.PI/8};e.crossCycle=((e.crossCycle||0)+1)%4;e.cd=2.4}
 return true;
}
export function updateMobs(g,dt){
 updateSoundMobs(g,dt);
 for(const e of g.room.enemies)e.rallied=Math.max(0,(e.rallied||0)-dt);
 for(const e of [...g.room.enemies]){
  if(e.dead){e.mobCast=null;continue}
  if(e.repelled>0)continue
  const c=e.mobCast;if(!c)continue;c.t+=dt;
  if(c.kind==='rush'){
   if(c.t>=c.wind&&c.t<c.wind+.5){e.vx=Math.cos(c.aim)*410;e.vy=Math.sin(c.aim)*410}
   else{e.vx=0;e.vy=0}
   if(c.t>=c.wind+.5)e.mobCast=null;
  }else if(c.kind==='echo'){
   while(c.fired<3&&c.t>=c.wind+c.fired*.28){shot(g,e,c.aim,260);const b=g.enemyBullets.at(-1);Object.assign(b,{echoOwner:e,echoAge:0,echoVX:b.vx,echoVY:b.vy,sound:'echo'});c.fired++}
   if(c.fired===3)e.mobCast=null;
  }else if(c.t>=c.wind){
   if(c.kind==='conduct')conductSquad(g,e);
   if(c.kind==='mend'&&!c.target.dead&&Math.hypot(c.target.x-e.x,c.target.y-e.y)<185){c.target.hp=Math.min(c.target.maxHp,c.target.hp+2);g.effects.push({type:'mobHeal',x:c.target.x,y:c.target.y,life:.5,max:.5})}
   if(c.kind==='cross')for(let i=0;i<4;i++)shot(g,e,c.aim+i*Math.PI/2,195);
   e.mobCast=null;
  }
 }
 for(const f of [...g.effects])if(f.type==='mobZone'){
  // Killing the caster interrupts delayed ranged attacks. Death splashes persist until clear.
  if(f.owner?.dead&&f.kind!=='curd'){f.life=0;continue}
  const age=f.max-f.life;
  if(age+dt>=f.wind&&f.life>0){
   if(f.kind==='curd'&&!f.triggered){g.effects.push({type:'milkPool',x:f.x,y:f.y,radius:f.radius,friendly:false,life:3,max:3,tick:0})}
   if(f.kind==='electric'||f.kind==='parcel'&&!f.triggered){if(Math.hypot(g.p.x-f.x,g.p.y-f.y)<f.radius+g.p.r)g.hurt()}
   f.triggered=true;
  }
 }
}
export function mobKilled(g,e){if(e.type==='curdling')zone(g,e,'curd',e.x,e.y,65,.7,.2)}
