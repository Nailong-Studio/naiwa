import {shotLaneOpen} from './terrain.js';
export const VOICE_ITEMS=[
 {id:'fanvoice',icon:'≋',name:'奶蛙的笑岔气',desc:'大笑变成三束扇形声波；中央束伤害 115%、保留正常射程，两侧近程束各 35%，攻击间隔 +15%。可与双发、分裂、重型笑弹叠加。',short:'中央远射 · 两侧近程 · 攻击稍慢'},
 {id:'heavyvoice',icon:'◍',name:'奶蛙鼓腮面罩',desc:'声波变为慢速大型穿透笑弹；伤害 ×2.2，攻击间隔 ×1.8。可与扇形、追踪和回声叠加。',short:'大型穿透笑弹 · 高伤慢射'},
 {id:'returnvoice',icon:'↶',name:'奶蛙回声嗓',desc:'去程声波留下 2 秒回声印记，回程再命中时震响：对周围 72 范围内的其他敌人造成该笑弹 50% 的溅射伤害（上限 3），震退周围普通怪，中心目标不位移。往返各 65% 伤害；同轮双发、扇形和分裂共享印记，每轮最多震响 3 次，每个敌人最多受到一次溅射，震波不穿墙。',short:'去程标记 · 回程震响 · 串联敌群'}
];
export function voiceStats(g){return {damage:(g.has('fanvoice')?1.15:1)*(g.has('heavyvoice')?2.2:1)*(g.has('returnvoice')?.65:1),interval:(g.has('fanvoice')?1.15:1)*(g.has('heavyvoice')?1.8:1),shots:g.has('fanvoice')?3:1}}
export function shapeVoice(g,start){
 const fan=g.has('fanvoice'),heavy=g.has('heavyvoice'),returning=g.has('returnvoice');if(!fan&&!heavy&&!returning)return;
 const stats=voiceStats(g),original=g.bullets.splice(start),echo=returning?{outbound:new Map(),detonated:new Set(),splashed:new Set()}:undefined;
 for(const bullet of original)for(const offset of fan?[-.28,0,.28]:[0]){
  const a=Math.atan2(bullet.vy,bullet.vx)+offset,speed=heavy?270:490;
  const side=fan&&offset!==0;
  const rangeLife=side?.42*(g.has('megaphone')?1.4:1)*(g.has('tongue')?1.3:1):bullet.life;
  // Slow projectiles keep their intended travel distance, including the return point.
  const travelScale=490/speed,life=rangeLife*travelScale;
  g.bullets.push({...bullet,echo,chain:bullet.chain?{...bullet.chain}:undefined,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,shotSpeed:speed,damage:bullet.damage*stats.damage*(side?.35/1.15:1),r:heavy?bullet.r+7:bullet.r,life:returning?life+travelScale:life,pierce:heavy||returning||bullet.pierce,hits:new Set(),voice:true,heavy,returnVoice:returning,age:0,returnAfter:Math.min(.65,rangeLife*.65)*travelScale,returned:false,returning:false});
 }
}
export function hitVoice(g,e,b){
 if(!b.returnVoice||b.pet||e.airborne||!b.echo)return;
 const group=b.echo;
 if(!b.returning){if(!e.dead&&!group.detonated.has(e)){const until=g.elapsed+2;group.outbound.set(e,until);e.echoUntil=Math.max(e.echoUntil||0,until)}return}
 if(!(group.outbound.get(e)>g.elapsed)||group.detonated.has(e)||group.detonated.size>=3)return;
 group.detonated.add(e);e.echoUntil=0;
 g.effects.push({type:'echoPulse',x:e.x,y:e.y,radius:72,life:.36,max:.36});
 for(const target of [...g.room.enemies]){
  if(target.dead||target.airborne||Math.hypot(target.x-e.x,target.y-e.y)>72+target.r||!shotLaneOpen(g.room,e,target))continue;
  if(target!==e){if(group.splashed.has(target))continue;group.splashed.add(target);g.damageEnemy(target,Math.min(3,b.damage*.5),false)}
  if(target!==e&&!target.dead&&target.type!=='boss'){const a=Math.atan2(target.y-e.y,target.x-e.x);target.vx=Math.cos(a)*160;target.vy=Math.sin(a)*160;target.repelled=.16}
 }
}
export function updateVoice(g,b,dt){
 if(!b.returnVoice||b.pet)return;b.age=(b.age||0)+dt;
 if(!b.returned&&b.age>=b.returnAfter){b.returned=true;b.returning=true;b.hits.clear()}
 if(b.returning){const dx=g.p.x-b.x,dy=g.p.y-6-b.y,len=Math.hypot(dx,dy);if(len<g.p.r){b.life=0;return}const speed=b.shotSpeed||490;b.vx=dx/len*speed;b.vy=dy/len*speed;}
}
