import {overlaps,safeSpot} from './terrain.js';
export const DEVICES=new Set(['milkValve','resonator','assembler','relay']);
export function hitDevice(g,o,damage){
 if(!DEVICES.has(o.kind))return false;
 if(o.disabled>0)return true;
 o.hp-=damage;if(o.hp>0)return true;
 if(o.kind==='milkValve'||o.kind==='assembler'){
  g.room.obstacles=g.room.obstacles.filter(v=>v!==o);
  if(o.kind==='milkValve'){
   g.effects=g.effects.filter(f=>f.type!=='milkPool'||f.friendly||Math.hypot(f.x-o.x,f.y-o.y)>170);
   for(const h of g.room.hazards||[])if(h.kind==='milk'&&Math.hypot(h.x-o.x,h.y-o.y)<170)h.drained=true;
   g.effects.push({type:'milkPool',x:o.x,y:o.y,radius:95,friendly:true,life:4,max:4,tick:0});
  }
  g.emit('toast',{text:o.kind==='milkValve'?'奶阀破裂：附近奶迹清除，反向喷奶！':'造怪口已摧毁，不再生产碎布怪。'});
 }else{o.disabled=4;o.hp=o.maxHp;g.emit('toast',{text:o.kind==='relay'?'供电中断 4 秒，快穿过电网！':'共振暂停 4 秒，趁机进攻！'})}
 g.burst(o.x,o.y,'#d6c99b',10);return true;
}
export function updateDevices(g,dt){
 for(const o of g.room.obstacles){
  if(!DEVICES.has(o.kind))continue;o.disabled=Math.max(0,o.disabled-dt);
  if(o.kind!=='assembler'||g.room.clear||o.spawned>=3)continue;
  o.timer-=dt;
  if(o.timer<=0){
   const alive=g.room.enemies.filter(e=>!e.dead).length;
   if(alive<8){const p=safeSpot(g.room,o.x,o.y+65,18,g.p,g.room.enemies.filter(e=>!e.dead)),m=g.spawn('tiny',p.x,p.y);m.hp=m.maxHp=2;m.r=12;m.summoned=true;g.room.enemies.push(m);o.spawned++;g.burst(p.x,p.y,'#c6b394',6)}
   o.timer=6;
  }
 }
}
export function hazardEnabled(g,h){if(h.drained||g.room.clear)return false;if(!h.channel)return true;
 const source=g.room.obstacles.find(o=>(o.kind==='resonator'||o.kind==='relay')&&o.channel===h.channel);
 return !!source&&!(source.disabled>0);
}
export function beltVector(g,h){const sign=h.reverse&&Math.floor((g.elapsed-(g.room.enteredAt||0))/4)%2?-1:1;return {x:(h.dx||0)*sign,y:(h.dy||0)*sign}}
export function blastDevices(g,x,y,radius){for(const o of [...g.room.obstacles])if(DEVICES.has(o.kind)&&overlaps(o,x,y,radius))hitDevice(g,o,6)}
