import {interruptRanged} from './ranged-interrupt.js';
import {startCraneGate,updateCraneGate} from './crane-gates.js';
import {requestRabbit} from './follower-combat.js';
import {startCatcherCombo,updateCatcherCombo,catcherPhase} from './catcher-combos.js';
import {startPuppetAttack,updatePuppet} from './puppet.js';
import {startFinalAttack} from './final-boss.js';
import {hazardEnabled,beltVector} from './chapter-mechanics.js';
import {startScreech,updateScreech} from './screech.js';
import {overlaps,safeSpot,shotLaneOpen} from './terrain.js';
export const STATIONARY=new Set(['turret','milkspitter','soundTurret','dollTurret','warden']);
export function milkPool(g,x,y,friendly=false,radius=30,life=3.5){if(friendly){const pools=g.effects.filter(f=>f.type==='milkPool'&&f.friendly);if(pools.length>=8)g.effects=g.effects.filter(f=>f!==pools[0])}g.effects.push({type:'milkPool',x,y,radius,friendly,life,max:life,tick:0})}
function aimed(g,e,count=1,spread=.22,speed=220){const aim=Math.atan2(g.p.y-e.y,g.p.x-e.x);for(let i=0;i<count;i++){const a=aim+(i-(count-1)/2)*spread;g.enemyBullets.push({x:e.x+Math.cos(a)*(e.r+4),y:e.y+Math.sin(a)*(e.r+4),vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:7,life:5,...(e.kind==='catcher'?{catcherPressure:e}:{})})}}
function radial(g,e,count=12,speed=170){for(let i=0;i<count;i++){const a=(i+.5)*Math.PI*2/count;g.enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:7,life:5})}}
function bottle(g,e,enhanced=false){g.effects.push({type:'milkBottle',owner:e,sx:e.x,sy:e.y-45,x:g.p.x,y:g.p.y,radius:e.kind==='collector'?(enhanced?135:110):55,life:1,max:1,leavesMilk:true})}
export function specialAttack(g,e){
 if(e.kind==='collector'){
  e.bottleCount=(e.bottleCount||0)+1;const enhanced=e.bottleCount%3===0;e.cd=(enhanced?2.3:1.8)*(e.hp<e.maxHp*.5?.85:1);bottle(g,e,enhanced);
  if(enhanced){e.bottleBurst={left:2,t:.25};g.emit('toast',{text:'奶瓶收缴员 · 强化三连投！'})}return true;
 }
 if(e.kind==='catcher'){
  if(e.handDisabled>0){e.cd=.8;return true}
  if(e.hands){e.cd=.3;return true}
  const cycle=(e.handCycle||0)%7;e.handCycle=(e.handCycle||0)+1;
  if(cycle===0||cycle===4)return startCraneGate(g,e);
  if(startCatcherCombo(g,e,cycle))return true;
  const mode=cycle%2?'smash':'block',x=mode==='smash'?Math.max(110,Math.min(850,g.p.x)):Math.max(200,Math.min(760,g.p.x)),y=mode==='smash'?Math.max(90,Math.min(510,g.p.y)):Math.max(170,Math.min(430,g.p.y));
  const total=e.hp<e.maxHp*.5?3:2;
  e.hands={mode,x,y,t:0,wind:.8,fired:0,placed:false,cancelled:false,wave:0,total};e.cd=mode==='block'?3.25:total*1.2+.2;return true;
 }
 if(e.kind==='puppet')return startPuppetAttack(g,e);
 if(e.kind==='bull'||e.kind==='meishu')return startFinalAttack(g,e);
 if(e.type==='milkspitter'){bottle(g,e);e.cd=2.4;return true}
 if(e.type==='soundTurret'){startScreech(g,e);return true}
 if(e.type==='turret'||e.type==='dollTurret'||e.type==='warden'){aimed(g,e,e.type==='warden'?5:e.type==='dollTurret'?3:1,.25,230);e.cd=e.type==='warden'?1.15:.85;return true}
 if(e.type==='loader'||e.type==='shooter'&&e.artChapter===4){e.gunCast={t:0,wind:.45,aim:Math.atan2(g.p.y-e.y,g.p.x-e.x)};e.gunFacing=g.p.x>=e.x?1:-1;e.cd=1.8;return true}
 return false;
}
function removeHands(g,e){g.room.obstacles=g.room.obstacles.filter(o=>o.owner!==e)}
export function updateActors(g,dt){
 for(const e of [...g.room.enemies]){
  if(e.kind==='puppet')updatePuppet(g,e,dt);
  if(e.kind==='catcher')catcherPhase(g,e,dt);
  if(e.type==='soundTurret')updateScreech(g,e,dt);
  if(!e.dead&&e.gunCast){const a=e.gunCast;a.t+=dt;if(a.t>=a.wind){const sx=e.x+e.gunFacing*25,sy=e.y-9;for(const off of [-.22,0,.22])g.enemyBullets.push({x:sx,y:sy,vx:Math.cos(a.aim+off)*240,vy:Math.sin(a.aim+off)*240,r:6,life:4,needle:e.artChapter===4});e.artAttackUntil=g.elapsed+.2;e.gunCast=null}}
  if(e.dead){if(e.hands){removeHands(g,e);e.hands=null}continue}
  if(e.type==='milkleak'||e.kind==='collector'){
   const last=e.lastMilk||{x:e.x,y:e.y};const distance=Math.hypot(e.x-last.x,e.y-last.y);
   if(distance>=24){const count=Math.min(6,Math.ceil(distance/26));for(let i=1;i<=count;i++)milkPool(g,last.x+(e.x-last.x)*i/count,last.y+(e.y-last.y)*i/count,false,e.kind==='collector'?30:23,e.kind==='collector'?4:3);e.lastMilk={x:e.x,y:e.y}}
   else e.lastMilk=last;
  }
  if(e.bottleBurst){e.bottleBurst.t-=dt;if(e.bottleBurst.t<=0){bottle(g,e,true);e.bottleBurst.left--;e.bottleBurst.t=.25;if(!e.bottleBurst.left)e.bottleBurst=null}}
  if(e.kind==='collector'){
   if(e.repelled>0){e.longCharge=null;e.wind=0;continue}
   e.chargeCD=(e.chargeCD??4.5)-dt;
   if(e.chargeCD<=0&&!e.longCharge){const dx=g.p.x-e.x,dy=g.p.y-e.y,len=Math.hypot(dx,dy)||1;e.dx=dx/len;e.dy=dy/len;e.longCharge={t:0};e.chargeCD=6.5;}
   if(e.longCharge){e.longCharge.t+=dt;const t=e.longCharge.t;e.wind=t<.85?.85-t:0;if(t>=.85&&t<1.5){e.vx=e.dx*620;e.vy=e.dy*620}else{e.vx=0;e.vy=0}if(t>=1.5)e.longCharge=null}
  }
  e.handDisabled=Math.max(0,(e.handDisabled||0)-dt);
  if(e.kind==='catcher'&&(updateCraneGate(g,e,dt)||updateCatcherCombo(g,e,dt)))continue;
  if(e.hands){const h=e.hands;h.t+=dt;
   if(h.cancelled||e.handDisabled>0){removeHands(g,e);g.enemyBullets=g.enemyBullets.filter(b=>b.catcherPressure!==e);e.hands=null;continue}
   if(h.t>=h.wind&&!h.placed){h.placed=true;
    if(h.mode==='block'){
     const arms=[-1,1].map(s=>({kind:'hand',owner:e,x:h.x+s*110,y:h.y,w:62,h:174,r:32}));g.room.obstacles=[...g.room.obstacles,...arms];
     for(const o of arms)if(overlaps(o,g.p.x,g.p.y,g.p.r)){g.hurt();g.p.x=o.x+(g.p.x<o.x?-1:1)*(o.w/2+g.p.r+5)}
    }else{if(h.wave===h.total-1){const away=Math.atan2(g.p.y-h.y,g.p.x-h.x);for(let i=0;i<20;i++){const a=i*Math.PI/10,d=Math.atan2(Math.sin(a-away),Math.cos(a-away));if(Math.abs(d)<.55)continue;g.enemyBullets.push({x:h.x,y:h.y,vx:Math.cos(a)*210,vy:Math.sin(a)*210,r:6,life:4.5,catcherPressure:e})}}for(const x of [h.x-55,h.x+55]){g.effects.push({type:'handImpact',x,y:h.y,radius:65,life:.4,max:.4});if(Math.hypot(g.p.x-x,g.p.y-h.y)<65+g.p.r)g.hurt()}}
   }
   if(h.mode==='block'&&h.placed&&h.fired<(e.hp<e.maxHp*.5?4:3)&&h.t>=1.05+h.fired*.55){aimed(g,e,5,.3,210);h.fired++}
   if(h.mode==='smash'&&h.t>=1.2&&h.wave<h.total-1){h.wave++;h.t=0;h.placed=false;h.x=Math.max(110,Math.min(850,g.p.x));h.y=Math.max(90,Math.min(510,g.p.y))}
   else if(h.t>(h.mode==='block'?3.1:1.2)){removeHands(g,e);e.hands=null}
  }
 }
 for(const fx of [...g.effects])if(fx.type==='dollPod'){
  if(fx.owner.dead){fx.life=0;continue}
  if(fx.life<=dt&&!fx.landed){fx.landed=true;if(Math.hypot(g.p.x-fx.x,g.p.y-fx.y)<fx.radius+g.p.r)g.hurt();
   const p=safeSpot(g.room,fx.x,fx.y),m=g.spawn(fx.spawnType,p.x,p.y);m.hp=m.maxHp=3;m.r=17;m.summoned=true;g.room.enemies.push(m);g.effects.push({type:'handImpact',x:fx.x,y:fx.y,radius:fx.radius,life:.35,max:.35});
  }
 }
}
export function hazardPhase(g,h){const duration=h.kind==='press'?4.5:3.8;return ((g.elapsed-(g.room.enteredAt||0)+h.phase)%duration+duration)%duration}
export function hazardActive(g,h){const p=hazardPhase(g,h);return h.kind==='milk'||h.kind==='resonance'&&p>=.65&&p<1.65||h.kind==='press'&&p>=.8&&p<1.5||h.kind==='electric'&&p>=.6&&p<2.2}
export function onMilk(g,actor){return (g.room.hazards||[]).some(h=>h.kind==='milk'&&hazardEnabled(g,h)&&overlaps(h,actor.x,actor.y,actor.r))||g.effects.some(f=>f.type==='milkPool'&&Math.hypot(actor.x-f.x,actor.y-f.y)<f.radius+actor.r)}
export function movementScale(g,actor){if(actor.type==='hopper'||actor.type==='boss')return 1;return onMilk(g,actor)?actor===g.p&&g.has('milkboots')?1:.72:1}
export function groundDrift(g,actor){if(actor.type==='hopper')return {x:0,y:0};const belt=(g.room.hazards||[]).find(h=>h.kind==='belt'&&overlaps(h,actor.x,actor.y,actor.r));const v=belt?beltVector(g,belt):{x:0,y:0},power=(belt?.power||80)*(actor===g.p&&g.has('milkboots')?.5:1);return {x:v.x*power,y:v.y*power}}
export function updateGround(g,dt){
 for(const fx of g.effects)if(fx.type==='milkPool'){
  if(fx.friendly){fx.tick-=dt;if(fx.tick<=0){fx.tick=.5;for(const e of [...g.room.enemies])if(!e.dead&&!e.airborne&&!(e.friendlyMilkUntil>g.elapsed)&&Math.hypot(e.x-fx.x,e.y-fx.y)<fx.radius+e.r){e.friendlyMilkUntil=g.elapsed+.5;g.damageEnemy(e,1.2)}}}
  else if(Math.hypot(g.p.x-fx.x,g.p.y-fx.y)<fx.radius+g.p.r&&!g.has('milkboots'))(g.hurtGround?g.hurtGround():g.hurt());
 }
 if(g.elapsed-(g.room.enteredAt||0)<1)return;
 for(const h of g.room.hazards||[]){if(!hazardEnabled(g,h))continue;const phase=hazardPhase(g,h),active=hazardActive(g,h);
  if(active&&overlaps(h,g.p.x,g.p.y,g.p.r)&&!(h.kind==='milk'&&g.has('milkboots')))(g.hurtGround?g.hurtGround():g.hurt());
  if(h.kind==='press'&&active){const cycle=Math.floor((g.elapsed-(g.room.enteredAt||0)+h.phase)/4.5);if(h.lastCycle!==cycle){h.lastCycle=cycle;for(const e of [...g.room.enemies])if(!e.dead&&overlaps(h,e.x,e.y,e.r))g.damageEnemy(e,4)}}
 }
}
export function updateActive(g,dt,input){
 const ready=input.active&&!g.activeLatch&&g.activeCharge>=g.activeCost();g.activeLatch=!!input.active;
 if(!ready)return false;
 g.activeCharge=0;const p=g.p,radius=160;g.effects.push({type:'laugh',x:p.x,y:p.y,radius,life:.45,max:.45});
 requestRabbit(g,g.room.enemies.filter(e=>!e.dead&&Math.hypot(e.x-p.x,e.y-p.y)<radius+e.r));
 g.releasingLaugh=true;
 try{for(const e of [...g.room.enemies])if(!e.dead&&Math.hypot(e.x-p.x,e.y-p.y)<radius+e.r){
  g.damageEnemy(e,4);const len=Math.hypot(e.x-p.x,e.y-p.y),dx=len?(e.x-p.x)/len:1,dy=len?(e.y-p.y)/len:0;
  e.vx=dx*450;e.vy=dy*450;e.repelled=.35;
 }}finally{g.releasingLaugh=false}
 for(const b of g.enemyBullets){const len=Math.hypot(b.x-p.x,b.y-p.y);if(len>radius+b.r)continue;const dx=len?(b.x-p.x)/len:1,dy=len?(b.y-p.y)/len:0;b.x=p.x+dx*Math.max(len,p.r+b.r+10);b.y=p.y+dy*Math.max(len,p.r+b.r+10);b.vx=dx*320;b.vy=dy*320;}
 if(g.has('propertycard')){
  for(const o of g.room.obstacles)if(['resonator','relay'].includes(o.kind)&&Math.hypot(o.x-p.x,o.y-p.y)<radius+30)o.disabled=4;
  for(const e of g.room.enemies)if(Math.hypot(e.x-p.x,e.y-p.y)<radius+e.r&&shotLaneOpen(g.room,p,e)&&interruptRanged(g,e,1.5))g.effects.push({type:'voiceChain',x:p.x,y:p.y,tx:e.x,ty:e.y-12,life:.22,max:.22});
 }
 if(g.has('spillcup'))milkPool(g,p.x,p.y,true,95,4);g.emit('laugh');return true;
}
export function killedSpecial(g,e){if(e.type==='stitchling'&&!e.summoned){for(const dx of [-26,26]){const p=safeSpot(g.room,e.x+dx,e.y),m=g.spawn('tiny',p.x,p.y);m.hp=m.maxHp=2;m.r=12;m.summoned=true;g.room.enemies.push(m)}}}
