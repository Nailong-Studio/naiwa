import {empowerShot} from './empowered-shots.js';
import {shotLaneOpen} from './terrain.js';
import {elbowItemVfx} from './item-vfx.js';
// Trigger budgets belong to a volley, room or cooldown, never to split children.
export const MEME_ITEMS=[
 ['voidframe','棍母的空相框','每第 3 次普通射击变为虚影弹，伤害 +60%，穿透敌人及房内障碍；双发和扇形共用计数。'],
 ['rollwood','滚木谐音梗','笑弹变慢、变大，伤害 +55%，攻击间隔 +25%。'],
 ['penguin','臭企鹅的石头','臭企鹅奶伴，抬翅推出地面滚石：可撞击最多 3 个地面敌人并击退普通怪，弹墙 1 次；冷却 2.7 秒，伤害随基础攻击成长（上限 4.5）。滚石会落入坑洞，不打飞行怪。'],
 ['stonepouch','爱捡石头','声波多反弹一次，不降低伤害；臭企鹅的石头也能反弹。'],
 ['gugucharm','咕咕嘎嘎哨','每第 4 次普通射击变为紧密三连节奏弹；中央弹保留 100% 伤害，两侧各 40%，更容易集中命中。'],
 ['tempura','天素罗虾套','补给型天素罗：每个战斗房最多吐出 2 份虾米团，落地后靠近拾取，获得 10 秒伤害 +35%、移速 +15%。补给 10 秒消失，不直接攻击。'],
 ['oyeye','欧耶节拍','每第 4 次普通射击增伤 50%，首次命中还会震响，对周围 80 范围的其他敌人造成 40% 溅射伤害（上限 3），不穿障碍；每轮只震响一次。与节拍贴同轮增伤合计最多 100%。'],
 ['shrimppaste','虾米糊糊','每清理 4 个战斗房恢复 1 点生命，满血时保留一次待用恢复，在后续清房受伤时结算；天素罗补给强化时间从 10 秒延长至 12 秒。'],
 ['shrimpfeet','天素罗的脚脚','蛙跳落地踩出 100 范围冲击，造成 1.5 + 基础攻击伤害（上限 5），并留下 3 秒脚印，使范围内地面普通怪减速 45%；最多保留 3 处，不穿障碍。搭配欧耶额外造成 1 点伤害。'],
 ['sun','带带大师兄','孙笑川奶伴，举起手机干扰一只附近普通远程怪 2.6 秒，范围 360，打断蓄势，冷却 4.3 秒；不清掉已射出的子弹、不影响 Boss。'],
 ['propertycard','那你去找物管啊','大爆笑会打断范围内普通远程怪的蓄势，并干扰 1.5 秒；不穿墙、不影响 Boss，也不消除已射出的子弹。与大师兄搭配，他的远程干扰冷却从 4.3 秒缩短为 3.5 秒。'],
 ['quietbadge','你吼那么大声干什么','大爆笑充能需求减少 5 点，最低 25；不降低普通声波伤害。'],
 ['kobe','后仰跳投·24号','科比奶伴，蓄势跳起后投出可反弹篮球，冷却 2.1 秒，伤害随基础攻击成长（上限 5）。'],
 ['fadeaway','后仰投篮包','每次成功蛙跳立即向八个方向各射出一发篮球笑弹；每发造成 1 + 基础攻击的 150% 伤害（上限 8），自带穿透，继承毒和反弹，弹速与命中范围提高。固定 8 发，不消耗其他强化，不受双发或扇形增殖。'],
 ['ironrim','打铁篮筐','声波多反弹 1 次，首次反弹后伤害 +25%；与回弹牙套同时触发时，反弹增伤合计最多 40%。'],
 ['man','Man！','5 轮普通射击有效命中后，接下来 2 轮声波增伤 60% 并变大；同轮多发只计一次，强化轮不为自身再充能。多种周期强化叠加最多 3 倍伤害。'],
 ['elbow','肘击护腕','蛙跳沿途肘击造成 3 + 基础攻击的 200% 伤害（上限 12）并击退普通怪；每次蛙跳每个敌人只触发一次，Boss 不会被击退。'],
 ['fouram','凌晨四点闹钟','新战斗房入场 2 秒后获得 5 秒热身：攻击间隔缩短 15%；回访不刷新。'],
 ['mambaout','Mamba out','蛙跳结束后获得 0.25 秒落地无敌，1.8 秒内移速 +25%、攻击间隔缩短 15%；与肘击组合，命中后蛙跳冷却减少 0.45 秒，每次最多一次。'],
 ['politesuit','儒雅随和西装','单发伤害 -18%，攻击间隔缩短 30%；与大师兄搭配，他的远程怪干扰延长到 3.2 秒。'],
 ['ghostbuddha','鬼佛供像','实际受伤后留下一尊鬼佛，吸引附近普通近战怪 3 秒，并给本房存活 Boss 施加 6 秒鬼佛印记，使其受到伤害 +25%；冷却 12 秒。印记按实际战斗时间计时，不改变 Boss 预警、不清弹。'],
 ['sweetpenguin','香企鹅玩偶','香企鹅奶伴，优先拦截正在飞向奶蛙的威胁弹；挥翅前摇 0.18 秒，一次最多拦 5 颗，范围 180，冷却 3 秒。']
].map(([id,name,desc])=>({id,name,desc,short:desc,icon:'✦'}));
export const MEME_FOLLOWERS=['penguin','tempura','sun','kobe','sweetpenguin'];
export function memeDamage(g){return (g.tempuraBuff>0?1.35:1)*(g.has('rollwood')?1.55:1)*(g.has('politesuit')?.82:1)}
export const mambaActive=g=>g.has('mambaout')&&g.outUntil>(g.actionClock??g.elapsed);
export function memeInterval(g){return (mambaActive(g)?.85:1)*(g.has('rollwood')?1.25:1)*(g.has('politesuit')?.7:1)*(g.has('fouram')&&g.room.warmStart<=g.elapsed&&g.room.warmUntil>g.elapsed?.85:1)}
export function prepareMemeShot(g,start,pet){
 if(pet||g.bullets.length<=start)return;const seq=g.memeVolley=(g.memeVolley||0)+1,group={counted:false,rhythmHit:false},man=g.has('man')&&(g.manReady||g.manBurst>0);
 const manStart=man&&!(g.manBurst>0);if(manStart)g.manBurst=2;if(man)g.manBurst--;g.manReady=false;group.manChargeable=!man;
 const original=g.bullets.splice(start);if(manStart)g.emit('itemVoice',{key:'man'});
 if(g.has('oyeye')&&seq%4===0)g.emit('itemVoice',{key:'oyeye'});
 if(g.has('gugucharm')&&seq%4===0)g.emit('itemVoice',{key:'gugu'});
 for(const b of original){
  b.memeGroup=group;b.manBoost=!!man;b.rhythm=!!(g.has('oyeye')&&seq%4===0);b.gugu=!!(g.has('gugucharm')&&seq%4===0);b.damage*=memeDamage(g);if(man){empowerShot(b,1.6);b.r+=3}
  if(g.has('voidframe')&&seq%3===0){b.pierce=true;empowerShot(b,1.6);b.ghost=true}
  if(g.has('rollwood')){b.vx*=.75;b.vy*=.75;b.shotSpeed=(b.shotSpeed||490)*.75;b.life/=.75;if(b.returnAfter)b.returnAfter/=.75;b.r+=3;b.wood=true}
  if(g.has('stonepouch'))b.bounce++;if(g.has('ironrim'))b.bounce++;
  if(g.has('oyeye')&&seq%4===0)empowerShot(b,b.beat?2/1.65:1.5);
  if(g.has('gugucharm')&&seq%4===0){for(const off of [-.08,0,.08]){const a=Math.atan2(b.vy,b.vx)+off,v=Math.hypot(b.vx,b.vy);g.bullets.push({...b,vx:Math.cos(a)*v,vy:Math.sin(a)*v,damage:b.damage*(off===0?1:.4),hits:new Set()})}}
  else g.bullets.push(b);
 }
}
export function hitMeme(g,e,b){
 if(b.pet)return;const group=b.memeGroup;
 if(b.rhythm&&group&&!group.rhythmHit){group.rhythmHit=true;g.effects.push({type:'itemImpact',variant:'rhythm',x:e.x,y:e.y,angle:0,radius:80,life:.3,max:.3});
  for(const target of [...g.room.enemies])if(target!==e&&!target.dead&&!target.airborne&&Math.hypot(target.x-e.x,target.y-e.y)<=80+target.r&&shotLaneOpen(g.room,e,target))g.damageEnemy(target,Math.min(3,b.damage*.4),false);
 }
 if(!g.has('man')||!group||group.counted||group.manChargeable===false||g.manReady||g.manBurst>0)return;
 group.counted=true;g.manHits=(g.manHits||0)+1;if(g.manHits>=5){g.manHits=0;g.manReady=true;g.emit('toast',{text:'Man！接下来两轮大笑强化。'})}
}
export function fireDashVolley(g){
 const p=g.p,group={nextHit:-Infinity};
 for(let i=0;i<8;i++){const a=i*Math.PI/4;g.bullets.push({x:p.x,y:p.y-6,vx:Math.cos(a)*520,vy:Math.sin(a)*520,r:11,life:.9,damage:Math.min(8,1+p.damage*1.5),poison:g.has('eye'),pierce:true,bounce:(g.has('bubble')?2:0)+(g.has('stonepouch')?1:0)+(g.has('ironrim')?1:0)+(g.has('springteeth')?1:0),hits:new Set(),pet:false,fadeBoost:true,dashShot:true,vfxVolley:group})}
 g.effects.push({type:'itemImpact',variant:'basketball',x:p.x,y:p.y-6,angle:0,radius:36,life:.3,max:.3});
}
export function bounceMeme(g,b){if(!b.pet&&g.has('ironrim')&&!b.ironBoost){b.ironBoost=true;b.damage*=g.has('springteeth')?1.4/1.2:1.25}}
export const ghostDamageScale=(g,e)=>g.has('ghostbuddha')&&e.type==='boss'&&e.ghostMarkedUntil>(g.actionClock??g.elapsed)?1.25:1;
export function hurtMeme(g){if(g.has('ghostbuddha')&&!(g.ghostReadyAt>g.elapsed)){g.ghostReadyAt=g.elapsed+12;g.ghostDecoy={x:g.p.x,y:g.p.y,until:g.elapsed+3};g.effects.push({type:'ghostIdol',x:g.p.x,y:g.p.y,life:3,max:3});for(const e of g.room.enemies)if(e.type==='boss'&&!e.dead){e.ghostMarkedUntil=(g.actionClock??g.elapsed)+6;g.effects.push({type:'voiceChain',x:g.p.x,y:g.p.y,tx:e.x,ty:e.y,life:.3,max:.3})}}}
export function clearMeme(g,r){if(!['fight','challenge','boss','vault','cache'].includes(r.type)||!g.has('shrimppaste'))return;g.shrimpClears=Math.min(4,(g.shrimpClears||0)+1);if(g.shrimpClears>=4&&g.p.hp<g.p.maxHp){g.shrimpClears=0;g.p.hp++;g.emit('heal')}}
function nearestDashPoint(a,b,e){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((e.x-a.x)*dx+(e.y-a.y)*dy)/(dx*dx+dy*dy||1)));return {x:a.x+dx*t,y:a.y+dy*t}}
const grounded=e=>!e.dead&&!e.airborne&&!['fly','hopper'].includes(e.type);
export function footZoneScale(g,e){return e!==g.p&&e.type!=='boss'&&grounded(e)&&(g.footZones||[]).some(z=>z.until>g.elapsed&&Math.hypot(e.x-z.x,e.y-z.y)<100+e.r&&shotLaneOpen(g.room,z,e))?.55:1}
export function updateMeme(g,dt,origin=g.p){
 g.tempuraBuff=Math.max(0,(g.tempuraBuff||0)-dt);const p=g.p,dash=p.dash>0;
 if(dash&&!g.wasMemeDash){g.elbowHits=new Set();g.elbowRefund=false;if(g.has('fadeaway'))fireDashVolley(g)}
 if(g.wasMemeDash&&!dash){
  if(g.has('mambaout')){if(!g.room.clear)g.emit('itemVoice',{key:'mamba'});g.outUntil=(g.actionClock??g.elapsed)+1.8;p.inv=Math.max(p.inv,.25)}
  if(g.has('shrimpfeet')){if(!g.room.clear)g.emit('itemVoice',{key:'shrimpfeet'});g.footZones??=[];g.footZones.push({x:p.x,y:p.y,until:g.elapsed+3});g.footZones=g.footZones.slice(-3);g.effects.push({type:'shrimpFeet',x:p.x,y:p.y,life:3,max:3,radius:100});for(const e of [...g.room.enemies])if(grounded(e)&&Math.hypot(e.x-p.x,e.y-p.y)<100+e.r&&shotLaneOpen(g.room,p,e))g.damageEnemy(e,Math.min(5,1.5+p.damage)+(g.has('oyeye')?1:0))}
 }
 if(dash&&g.has('elbow'))for(const e of [...g.room.enemies]){const q=nearestDashPoint(origin,p,e);if(!e.dead&&!e.airborne&&!g.elbowHits.has(e)&&Math.hypot(e.x-q.x,e.y-q.y)<p.r+e.r+18&&shotLaneOpen(g.room,q,e)){g.elbowHits.add(e);g.damageEnemy(e,Math.min(12,3+p.damage*2));if(e.type!=='boss'){const a=Math.atan2(e.y-q.y,e.x-q.x);e.vx=Math.cos(a)*350;e.vy=Math.sin(a)*350;e.repelled=.22}elbowItemVfx(g,e);if(g.has('mambaout')&&!g.elbowRefund){p.dashCD=Math.max(0,p.dashCD-.45);g.elbowRefund=true}}}
 g.wasMemeDash=dash;g.footZones=(g.footZones||[]).filter(z=>z.until>g.elapsed);if(g.ghostDecoy?.until<=g.elapsed)g.ghostDecoy=null;
}
export function memeCombos(g){return [['落地欧耶',['shrimpfeet','oyeye']],['跳投肘击',['fadeaway','elbow']],['打铁集火',['ironrim','man']],['石头弹跳',['penguin','stonepouch']],['喂饱天素罗',['tempura','shrimppaste']],['物管加急',['sun','propertycard']],['文明劝停',['sun','politesuit']],['肘了·Out',['elbow','mambaout']]].filter(([,ids])=>ids.every(id=>g.has(id))).map(([name])=>name)}
