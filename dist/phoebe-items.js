import {playerAttackDamage} from './player-damage.js';
import {wireItemVfx} from './item-vfx.js';
import {steer,moveOnTerrain,safeSpot,shotLaneOpen} from './terrain.js';
export const PHOEBE_ITEMS=[
 {id:'phoebe',name:'菲比啾比',desc:'电工菲比奶伴：抱线盘跟随，蓄势后甩出插头，电线展开接通后才会伤敌。布线冷却 3.2 秒，最长铺线 320，电线在当前房间持续存在，持有菲比时所有电线共用三条上限，新线替换最早的旧线；持有菲比时，她的线路每 0.4 秒造成 0.9 + 当前面板攻击的 60% 伤害（每次上限 3.2），已铺电线随属性实时更新，蛙跳电线伤害额外提高 20%。',short:'电工跟班 · 甩插头布线 · 控制追击路线'},
 {id:'phoebewire',name:'拉电线哈哈',desc:'蛙跳沿实际移动路线铺设电线，落地后通电，在当前房间持续存在，最多保留 2 条，新线替换最早的旧线，换房清空。电线加宽，踩线的地面敌人每 0.4 秒受到 1.4 + 当前面板攻击的 60% 伤害，无固定伤害上限；已铺电线实时继承攻击属性与临时增伤，攻速不改变结算间隔，不触发普通射击的单次强化；多条线不叠伤，不穿墙；持有菲比时总上限增至 3 条，蛙跳电线伤害额外提高 20%。',short:'蛙跳布线 · 引怪踩线 · 最多两条'},
 {id:'phoebesoot',name:'电焦了哈哈',desc:'每个战斗房抵挡一次地面伤害，冒烟但不扣血，并获得 0.8 秒无敌、1.5 秒移速 +20%。不抵挡子弹或碰撞；回访不重置。雨靴可用时先消耗雨靴。',short:'每房一次地面防护 · 电焦加速逃离'},
 {id:'phoebeplug',name:'接根大的哈哈',desc:'普通声波弹速 +15%、射程约 +20%；与拉电线搭配时，电线有效宽度增加。不增加声波伤害，跟班弹不受影响。',short:'更快更远的笑弹 · 加宽电线'}
].map(i=>({...i,icon:'✦'}));
import {itemCombatEncounter} from './combat-values.js';
const combat=g=>itemCombatEncounter(g.room);
export function resetPhoebe(g){g.phoebe=null;g.phoebeWires=[];g.phoebeTrace=null;g.phoebeWasDash=false;g.phoebeBoost=0;}
export function clearPhoebe(g){g.phoebeTrace=null;g.phoebeWasDash=false;}
export function preparePhoebeShot(g,start,pet){
 if(pet||!g.has('phoebeplug'))return;
 for(const b of g.bullets.slice(start)){b.vx*=1.15;b.vy*=1.15;b.shotSpeed=(b.shotSpeed||490)*1.15;b.life*=1.2/1.15;if(b.returnVoice)b.returnAfter*=1.2/1.15;b.phoebePlug=true;}
}
export function guardPhoebe(g){
 if(!g.has('phoebesoot')||!combat(g)||g.room.phoebeSootUsed||g.p.inv>0||g.p.dash>0)return false;
 g.room.phoebeSootUsed=true;g.emit('itemVoice',{key:'phoebesoot'});g.p.inv=.8;g.phoebeBoost=1.5;g.effects.push({type:'phoebeSoot',x:g.p.x,y:g.p.y,life:.8,max:.8});g.emit('toast',{text:'电焦了哈哈！本房地面防护已用，快跑！'});return true;
}
function nearest(a,b,p){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return {x:a.x+dx*t,y:a.y+dy*t};}
function wireDamageAt(g,e){
 if(e.dead||e.airborne||['fly','hopper'].includes(e.type))return 0;
 let damage=0;
 for(const w of g.phoebeWires||[]){if(w.until<=g.elapsed)continue;for(let i=1;i<w.points.length;i++){const q=nearest(w.points[i-1],w.points[i],e);if(Math.hypot(q.x-e.x,q.y-e.y)<=e.r+w.width&&shotLaneOpen(g.room,q,e)){damage=Math.max(damage,w.damage??companionWireDamage(g));break}}}
 return damage;
}
export function touchesPhoebeWire(g,e){return wireDamageAt(g,e)>0}
export function companionWireDamage(g){return Math.min(3.2,.9+playerAttackDamage(g)*.6)}
export function playerWireDamage(g){return (1.4+playerAttackDamage(g)*.6)*(g.has('phoebe')?1.2:1)}
function updateWires(g,origin){
 g.phoebeWires=(g.phoebeWires||[]).filter(w=>w.until>g.elapsed);
 const dash=g.p.dash>0;
 if(g.has('phoebewire')&&combat(g)){
  if(dash&&!g.phoebeWasDash)g.phoebeTrace=[{x:origin.x,y:origin.y}];
  if(g.phoebeTrace&&(dash||g.phoebeWasDash)){
   const points=g.phoebeTrace,last=points.at(-1),p={x:g.p.x,y:g.p.y};
   if(Math.hypot(p.x-last.x,p.y-last.y)>=5&&shotLaneOpen(g.room,last,p))points.push(p);
   if(points.length>28)points.shift();
  }
  if(!dash&&g.phoebeWasDash&&g.phoebeTrace){const points=g.phoebeTrace,length=points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p.x-points[i].x,p.y-points[i].y),0);if(length>=24){g.emit('itemVoice',{key:'phoebe'});g.phoebeWires.push({points,until:Infinity,width:g.has('phoebeplug')?14:9,source:'player',damage:playerWireDamage(g)});g.phoebeWires=g.phoebeWires.slice(-(g.has('phoebe')?3:2))}g.phoebeTrace=null;}
 }
 g.phoebeWasDash=dash;
 for(const w of g.phoebeWires){if(w.source==='player')w.damage=playerWireDamage(g);else if(w.source==='phoebe')w.damage=companionWireDamage(g);}
 for(const e of [...g.room.enemies])if(!(e.phoebeWireUntil>g.elapsed)&&touchesPhoebeWire(g,e)){e.phoebeWireUntil=g.elapsed+.4;g.damageEnemy(e,wireDamageAt(g,e),false);wireItemVfx(g,e);}
}
export function updatePhoebe(g,dt,playerDt,origin){
 g.phoebeBoost=Math.max(0,(g.phoebeBoost||0)-playerDt);updateWires(g,origin);
 if(!g.has('phoebe'))return;
 const home={x:Math.max(70,Math.min(890,g.p.x+70)),y:Math.max(75,Math.min(525,g.p.y+48))},s=g.phoebe??={...safeSpot(g.room,home.x,home.y,10),r:10,type:'pet',phase:'idle',t:0,cd:.6,face:1};s.t+=dt;s.cd=Math.max(0,s.cd-dt);
 if(s.phase==='idle'){
  const d=Math.hypot(s.x-home.x,s.y-home.y),v=steer(g.room,s,home),x=s.x,y=s.y;s.x+=v.x*Math.min(d,260*dt);s.y+=v.y*Math.min(d,260*dt);moveOnTerrain(g.room,s,x,y);s.moving=Math.hypot(s.x-x,s.y-y)>.1;
  const e=g.room.enemies.filter(e=>!e.dead&&!e.airborne&&!['fly','hopper'].includes(e.type)&&Math.hypot(e.x-s.x,e.y-s.y)<400&&shotLaneOpen(g.room,s,e)).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y))[0];
  if(e&&s.cd<=0){s.target=e;s.face=e.x>=s.x?1:-1;s.phase='windup';s.t=0;}
 }else if(s.phase==='windup'&&s.t>=.35){
  const e=s.target;s.t=0;if(!e||e.dead||e.airborne||!shotLaneOpen(g.room,s,e)){s.phase='recover';s.cd=.5;return}
  const from={x:s.x+s.face*22,y:s.y},dx=e.x-from.x,dy=e.y-from.y,d=Math.hypot(dx,dy)||1;
  const to={x:from.x+dx*Math.min(1,320/d),y:from.y+dy*Math.min(1,320/d)};
  if(d<24||!shotLaneOpen(g.room,from,to)){s.phase='recover';s.cd=.5;return}
  s.cable={from,to};s.phase='unroll';
 }else if(s.phase==='unroll'&&s.t>=.4){
  const {from,to}=s.cable;if(combat(g)&&shotLaneOpen(g.room,from,to)){g.emit('itemVoice',{key:'phoebe'});g.phoebeWires.push({points:[from,to],until:Infinity,source:'phoebe',damage:companionWireDamage(g),width:g.has('phoebeplug')?11:7});g.phoebeWires=g.phoebeWires.slice(-(g.has('phoebe')?3:2));g.effects.push({type:'petMuzzle',x:to.x,y:to.y,life:.18,max:.18,radius:12});}
  s.phase='recover';s.cd=3.2;s.t=0;s.cable=null;
 }else if(s.phase==='recover'&&s.t>=.25){s.phase='idle';s.t=0;}

}
export function phoebeCombos(g){return [['通电啾比',['phoebe','phoebewire']],['接根大的',['phoebewire','phoebeplug']],['电工逃生',['phoebewire','phoebesoot']]].filter(([,ids])=>ids.every(id=>g.has(id))).map(([name])=>name);}
