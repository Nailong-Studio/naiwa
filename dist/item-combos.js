import {empowerShot} from './empowered-shots.js';
import {shotLaneOpen} from './terrain.js';
import {milkPool} from './combat-content.js';
export const COMBO_ITEMS=[
 ['mints','❄','奶蛙薄荷糖','攻击间隔缩短 15%，单发伤害降低 5%；更快触发节拍强化。'],
 ['springteeth','↗','奶蛙回弹牙套','声波多反弹 1 次；首次反弹后伤害提升 20%。可叠加池塘泡泡与奶泡。'],
 ['starbadge','☆','奶豆星星贴','命中后标记敌人 2 秒，后续声波对它增伤 20%；穿透与回声也能触发。'],
 ['rattle','♬','奶蛙震音铃','声波推开普通敌人，同一目标每 0.4 秒触发一次；Boss 不受影响。'],
 ['sparebutton','◈','豆包备用纽扣','每层一次抵挡致命伤，保留 1 点生命并获得 2 秒无敌；本层使用后不会重置。'],
 ['coinpouch','¤','奶鼠零钱袋','持有后每清完 3 个战斗房额外获得 2 金币；回访和安全房不计数。'],
 ['papercup','⌁','奶蛙传声纸杯','声波命中后向附近另一敌人传递 35% 伤害；每束及其分裂弹共享一次传声，不穿墙。'],
 ['milkcap','◒','奶蛙奶沫瓶盖','击杀敌人后留下 3 秒友方奶迹，最多保留 6 摊；可搭配奶迹滤芯。'],
 ['beatsticker','♫','奶豆节拍贴','每第 4 次普通攻击变为重拍弹，增伤 85%、弹体变大，命中推开普通怪；同一目标每 0.4 秒最多击退一次，Boss 不会被击退。'],
 ['mending','⌇','豆包缝补线','持有后累计造成 40 点有效伤害，恢复 1 点生命；每层最多恢复 2 次。']
].map(([id,icon,name,desc])=>({id,icon,name,desc,short:desc}));
export function gearDamage(g){return (g.has('double')?.7:1)*(g.has('mints')?.95:1)}
export function gearInterval(g){return g.has('mints')?.85:1}
export function prepareGearShot(g,start,pet){
 if(pet||g.bullets.length<=start)return;
 const beat=g.has('beatsticker')&&((g.beatShots=(g.beatShots||0)+1)%4===0);
 for(const b of g.bullets.slice(start)){
  if(g.has('mints'))b.damage*=.95;
  if(g.has('springteeth'))b.bounce++;
  if(g.has('megaphone'))b.r+=2;
  b.chain={left:g.has('papercup')?1:0};
  if(beat){empowerShot(b,1.85);b.r+=4;b.beat=true}
 }
}
export function bouncedGear(g,b){if(!b.pet&&g.has('springteeth')&&!b.reboundBoost){b.damage*=1.2;b.reboundBoost=true}}
export function hitGear(g,e,b){
 if(b.pet||e.airborne)return;
 if(g.has('starbadge')&&!e.dead)e.starMark=2;
 if((g.has('rattle')||b.beat)&&!e.dead&&e.type!=='boss'&&!(e.rattleCD>0)){
  const len=Math.hypot(b.vx||0,b.vy||0)||1;e.vx=Math.max(-240,Math.min(240,e.vx+(b.vx||0)/len*(b.beat?220:150)));e.vy=Math.max(-240,Math.min(240,e.vy+(b.vy||0)/len*(b.beat?220:150)));e.rattleCD=.4;
 }
 if(b.chain?.left>0){
  const target=g.room.enemies.filter(m=>m!==e&&!m.dead&&!m.airborne&&Math.hypot(m.x-e.x,m.y-e.y)<=155&&shotLaneOpen(g.room,e,m)).sort((a,c)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(c.x-e.x,c.y-e.y))[0];
  if(target){b.chain.left--;g.damageEnemy(target,b.damage*.35*(g.has('starbadge')&&target.starMark>0?1.2:1));g.effects.push({type:'voiceChain',x:e.x,y:e.y,tx:target.x,ty:target.y,life:.18,max:.18});}
 }
}
export function killedGear(g,e){
 if(!g.has('milkcap'))return;
 const old=g.effects.filter(f=>f.capMilk);if(old.length>=6)g.effects=g.effects.filter(f=>f!==old[0]);
 milkPool(g,e.x,e.y,true,42,3);g.effects.at(-1).capMilk=true;
}
export function mendGear(g,damage){
 if(!g.has('mending')||damage<=0)return;
 if(g.mendFloor!==g.floor){g.mendFloor=g.floor;g.mendUses=0;g.mendDamage=0}
 if(g.mendUses>=2)return;g.mendDamage=Math.min(40,(g.mendDamage||0)+damage);
 if(g.mendDamage>=40&&g.p.hp<g.p.maxHp&&g.p.hp>0){g.mendDamage=0;g.mendUses++;g.p.hp++;g.emit('heal')}
}
export function saveWithButton(g){
 if(!g.has('sparebutton')||g.buttonFloor===g.floor||g.p.hp!==1||g.p.inv>0||g.p.dash>0||g.p.shield)return false;
 g.buttonFloor=g.floor;g.p.inv=2;g.emit('toast',{text:'豆包的纽扣挡住了致命伤！本层已使用，获得 2 秒无敌。'});g.emit('shield');return true;
}
export function clearGear(g,room){if(g.has('coinpouch')&&['fight','challenge','boss','vault','cache'].includes(room.type)){g.pouchClears=(g.pouchClears||0)+1;if(g.pouchClears%3===0){g.coins+=2;g.emit('toast',{text:'奶鼠零钱袋：攒下 2 金币。'})}}}
export function updateGear(g,dt){for(const e of g.room.enemies){e.starMark=Math.max(0,(e.starMark||0)-dt);e.rattleCD=Math.max(0,(e.rattleCD||0)-dt)}}
export function synergyText(g){
 const combos=[['反弹留奶',['milkfoam','bubble']],['回弹留奶',['milkfoam','springteeth']],['奶沫增伤',['milkcap','milkfilter']],['往返集火',['returnvoice','starbadge']],['贯穿集火',['heavyvoice','starbadge']],['快攻强拍',['mints','beatsticker']],['扇形传声',['fanvoice','papercup']],['分裂传声',['split','papercup']],['六束扇笑',['fanvoice','double']],['追踪重弹',['heavyvoice','homing']],['输出缝补',['mending','returnvoice']]];
 return combos.filter(([,ids])=>ids.every(id=>g.has(id))).map(([name])=>name).join(' · ')||'继续收集道具，组合不同效果';
}
