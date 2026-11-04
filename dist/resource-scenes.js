import {encounterRoster} from './encounter-profiles.js';
import {encounterCount} from './encounter-budget.js';
export const EXCHANGES=[
 {id:'trade_key_bomb',icon:'⚿ → ✹',name:'2 把钥匙 → 1 枚炸弹',desc:'每层限换 1 次',cost:'keys',costAmount:2,gain:'bombs',amount:1,limit:1},
 {id:'trade_bomb_key',icon:'✹ → ⚿',name:'2 枚炸弹 → 1 把钥匙',desc:'每层限换 1 次',cost:'bombs',costAmount:2,gain:'keys',amount:1,limit:1},
 {id:'trade_key_coin',icon:'⚿ → ●',name:'1 把钥匙 → 2 金币',desc:'每层限换 2 次',cost:'keys',gain:'coins',amount:2,limit:2},
 {id:'trade_bomb_coin',icon:'✹ → ●',name:'1 枚炸弹 → 2 金币',desc:'每层限换 2 次',cost:'bombs',gain:'coins',amount:2,limit:2},
 {id:'trade_blood',icon:'♥ → ●',name:'消耗 2 点生命 → 3 金币',desc:'每层限 1 次，需至少 3 点当前生命；护盾不能抵扣',cost:'health',gain:'coins',amount:3,costAmount:2,limit:1}
];
function mainReachable(g,blocked){const reached=new Set([12]),todo=[12];while(todo.length)for(const n of g.neighbors(todo.shift()))if(g.rooms[n].exists&&!blocked.has(n)&&!reached.has(n)){reached.add(n);todo.push(n)}return g.rooms.filter(r=>r.exists&&!blocked.has(r.id)).every(r=>reached.has(r.id))}
export function installResourceRooms(g){
 const blocked=new Set(g.rooms.filter(r=>r.exists&&r.locked).map(r=>r.id));
 for(const type of ['vault','cache']){
  const adjacent=r=>g.neighbors(r.id).filter(n=>g.rooms[n].exists);
  // Caches favour enclosed map gaps; every touching room must have a free main-route entrance.
  const empty=g.rooms.filter(r=>!r.exists&&adjacent(r).length>0&&(type==='cache'||adjacent(r).length===1)&&adjacent(r).every(n=>!blocked.has(n)&&g.rooms[n].type!=='boss'));
  const score=type==='cache'?Math.max(0,...empty.map(r=>adjacent(r).length)):1;
  const candidates=empty.filter(r=>adjacent(r).length===score);
  let r=candidates[Math.floor(g.random()*candidates.length)];
  if(!r)r=g.rooms.find(r=>r.exists&&r.type==='fight'&&adjacent(r).every(n=>!blocked.has(n)&&g.rooms[n].type!=='boss')&&mainReachable(g,new Set([...blocked,r.id])));
  if(!r)continue;
  Object.assign(r,{exists:true,type,clear:true,enemies:[],locked:type==='vault',bombLocked:type==='cache',hidden:type==='cache',revealed:false,resourceClaimed:false,seen:type==='vault'&&g.neighbors(12).includes(r.id),visited:false,obstacles:[],hazards:[]});blocked.add(r.id);
 }
 // False cracks point at empty cells beside a boss: map knowledge can rule these out.
 for(const room of g.rooms)room.wallDecoys=[];
 const falseTargets=g.rooms.filter(r=>!r.exists&&g.neighbors(r.id).some(n=>g.rooms[n].exists&&g.rooms[n].type==='boss'));
 const choices=falseTargets.flatMap(target=>g.neighbors(target.id).filter(n=>g.rooms[n].exists&&!blocked.has(n)&&g.rooms[n].type!=='boss').map(parent=>({parent,target:target.id})));
 const usedRooms=new Set(),usedTargets=new Set();let count=0;
 while(choices.length&&count<2){const pick=choices.splice(Math.floor(g.random()*choices.length),1)[0];if(usedRooms.has(pick.parent)||usedTargets.has(pick.target))continue;const wall=roomSides(g,pick.parent).find(d=>d.id===pick.target);g.rooms[pick.parent].wallDecoys.push({...wall,spent:false});usedRooms.add(pick.parent);usedTargets.add(pick.target);count++}
 g.rooms[12].exchanges={};
}
export function enterResourceRoom(g){const r=g.room;if(!['vault','cache'].includes(r.type)||r.resourceStarted)return;r.resourceStarted=true;r.clear=false;

 const positions=[[220,180],[740,180],[320,350],[640,350],[480,180],[220,450],[740,450],[480,420],[350,140],[610,140]].filter(([x,y])=>Math.hypot(x-g.p.x,y-g.p.y)>=160).slice(0,encounterCount(r,g.floor));
 const guardProfile=[1,2,3,4,7][Math.floor(r.seed||0)%5];
 const guards=encounterRoster({...r,encounterProfile:guardProfile},g.floor,positions.length);
 r.enemies=positions.map(([x,y],i)=>g.spawn(guards[i],x,y));
 if(r.type==='cache'){r.dangerTime=12;r.fallTimer=1.2}
 g.emit('toast',{text:r.type==='vault'?'补给库伏击！击败库房守卫后才能拿走补给。':'藏室坍塌！躲避落物 12 秒并清除守卫，补给才会解封。'});
}
export function claimResourceRoom(g){const r=g.room;if(!['vault','cache'].includes(r.type)||r.resourceClaimed)return;r.resourceClaimed=true;
 const roll=g.random();r.resourceOutcome=roll<.25?'empty':'supplies';
 if(r.resourceOutcome==='empty'){g.emit('toast',{text:'白跑一趟：补给已经被搬空了，这间没有掉落。'});return}
 if(r.type==='cache'){
  if(roll<.5){r.resourceOutcome='coins';g.drop('coin',480,300,6)}
  else if(roll<.75){r.resourceOutcome='tools';g.drop('key',450,300,2);g.drop('bomb',515,300,1)}
  else if(roll<.9){r.resourceOutcome='healing';g.drop('heart',450,300,2);g.drop('coin',515,300,3)}
  else{r.resourceOutcome='item';g.offer('隐藏藏室 · 意外发现的道具');if(!g.choices.length){g.mode='play';r.resourceOutcome='coins';g.drop('coin',480,300,6)}}
  g.emit('toast',{text:'藏室已解封，看看这次留下了什么。'});return;
 }
 g.drop(r.type==='vault'?'bomb':'key',450,300,2);g.drop('coin',515,300,3);
 g.emit('toast',{text:r.type==='vault'?'补给库：2 枚炸弹和 3 金币，拿走后不会再刷新。':'封墙藏室：2 把钥匙和 3 金币，拿走后不会再刷新。'});
}
export function updateResourceRoom(g,dt){const r=g.room;if(r.type!=='cache'||r.clear||!(r.dangerTime>0))return;r.dangerTime=Math.max(0,r.dangerTime-dt);r.fallTimer-=dt;
 if(r.fallTimer<=0){r.fallTimer=1.6;g.effects.push({type:'mobZone',kind:'parcel',x:Math.max(110,Math.min(850,g.p.x)),y:Math.max(110,Math.min(490,g.p.y)),radius:70,wind:1,active:.2,life:1.2,max:1.2,triggered:false,sx:480,sy:60})}
}
export function suspiciousWalls(g){
 if(!g.room.clear)return [];
 const real=roomNeighbors(g).filter(d=>{const r=g.rooms[d.id];return r.type==='cache'&&r.hidden&&!r.revealed&&r.bombLocked});
 return [...real,...(g.room.wallDecoys||[]).filter(d=>!d.spent)];
}
export function roomSides(g,i=g.roomId){return [{id:i-1,valid:i%5>0,x:47,y:300,side:'left'},{id:i+1,valid:i%5<4,x:913,y:300,side:'right'},{id:i-5,valid:i>=5,x:480,y:47,side:'top'},{id:i+5,valid:i<20,x:480,y:553,side:'bottom'}].filter(d=>d.valid)}
export function roomNeighbors(g){return roomSides(g).filter(d=>g.rooms[d.id]?.exists)}
export function blastResourceDoors(g,x,y,radius){
 if(!g.room.clear)return;
 for(const d of roomNeighbors(g)){const next=g.rooms[d.id];if(next.bombLocked&&Math.hypot(x-d.x,y-d.y)<radius){next.bombLocked=false;next.hidden=false;next.revealed=true;next.seen=true;g.emit('toast',{text:'隐藏封墙炸开了！可以进入藏室。'});g.emit('room')}}
 for(const d of g.room.wallDecoys||[])if(!d.spent&&Math.hypot(x-d.x,y-d.y)<radius){d.spent=true;g.emit('toast',{text:'墙灰脱落了，后面是实墙，没有隐藏房。'})}
}
export function offerExchange(g){g.choices=EXCHANGES.filter(t=>(g.room.exchanges[t.id]||0)<t.limit).map(t=>({...t,desc:t.desc+' · 剩余 '+(t.limit-(g.room.exchanges[t.id]||0))+' 次'}));g.mode='choice';g.emit('choice',{title:'豆包回收台 · 生命 '+g.p.hp+' / 钥匙 '+g.keys+' / 炸弹 '+g.bombs,choices:g.choices})}
export function chooseExchange(g,id){const t=EXCHANGES.find(t=>t.id===id);if(!t)return null;
 if(g.room.type!=='start'||g.mode!=='choice'||!g.choices.some(c=>c.id===id))return false;
 const used=g.room.exchanges[t.id]||0;if(used>=t.limit)return false;
 const cost=t.costAmount||1,available=t.cost==='health'?g.p.hp:g[t.cost];
 if(available<cost||t.cost==='health'&&available<=cost){g.emit('toast',{text:t.cost==='health'?'需至少 3 点生命，不能用最后的生命兑换。':t.cost==='keys'?'需要 '+cost+' 把钥匙。':'需要 '+cost+' 枚炸弹。'});return false}
 if(t.cost==='health')g.p.hp-=cost;else g[t.cost]-=cost;
 g[t.gain]+=t.amount;g.room.exchanges[t.id]=used+1;g.mode='play';g.emit('room');g.emit('toast',{text:'兑换完成：'+t.name});return true;
}
