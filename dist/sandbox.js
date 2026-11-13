// 沙盒试玩: a free-play run for players and for testing. It never writes the saved run,
// the best record or any unlock. All changes go through the same Game methods as a real run.
import {ITEMS,CHAPTERS,BOSS_NAMES} from './campaign.js';
import {Game as Base,applyItemStats} from './engine.js';
import {ENCOUNTERS} from './encounter-profiles.js';
import {CHAPTER_MOBS} from './mob-catalog.js';
import {THEMED_ENEMIES} from './chapter-content.js';
import {navigationSnapshot,overlaps,spawnEncounter} from './terrain.js';
import {resetFollowers} from './follower-combat.js';
import {resetPhoebe,clearPhoebe} from './phoebe-items.js';
import {resetDeepseek} from './deepseek-items.js';
import {resetChronoRoom} from './chrono-items.js';
import {itemIcon} from './item-icons.js';

export const SANDBOX_TABS=[['scene','场景'],['enemies','敌人'],['items','道具'],['frog','奶蛙'],['dev','开发者']];
export const SANDBOX_ROOMS=[['boss','Boss 房'],['shop','补给商店'],['treasure','道具房'],['challenge','挑战房'],['vault','钥匙补给库'],['cache','封墙藏室'],['start','接应点']];
const GENERIC={runner:'抢奶跑腿怪',brute:'圆肚怪',hopper:'飞扑怪',shooter:'远程怪'};
const MAX_SPAWNED=24,DUMMY_HP=999999,BASE_STATS={speed:220,damage:1,rate:.28,maxHp:6};

export function createSandboxState(){return {active:false,god:false,oneHit:false,hitboxes:false,info:false,speed:1,tab:'scene',falls:0}}
export function enemyName(type){return CHAPTER_MOBS[type]?.name||THEMED_ENEMIES[type]||GENERIC[type]||type}
// The enemies a chapter's rooms really use, in the order the encounter tables list them.
export function chapterEnemies(floor){return [...new Set(ENCOUNTERS[floor-1].flat())].map(type=>({type,name:enemyName(type)}))}
export function sandboxItems(){return ITEMS.filter(i=>i.id!=='tadpole')}

function revealFloor(g){for(const r of g.rooms)if(r.exists){r.seen=true;if(r.hidden)r.revealed=true}}
// Instance-level hooks, so a fresh Game for a real run never carries them.
export function installSandbox(g,state){
 const proto=Object.getPrototypeOf(g);g.sandbox=true;
 g.hurt=function(){
  if(state.god)return;
  const shield=this.p.shield;
  proto.hurt.call(this);
  if(shield&&!this.p.shield)this.sandboxExtraShield=false;
  if(this.mode!=='dead')return;
  // A fall in the sandbox stands straight back up instead of ending the run.
  for(let i=this.events.length-1;i>=0;i--)if(this.events[i].type==='end')this.events.splice(i,1);
  this.mode='play';this.p.hp=this.p.maxHp;this.p.inv=2;state.falls++;
  this.emit('toast',{text:'沙盒保护：奶蛙倒下后已满血站起。'});this.emit('heal');
 };
 g.choose=function(id){
  const shield=this.p.shield,ownedLotus=this.has('lotus'),ok=proto.choose.call(this,id);
  if(ok&&(id==='service_shield'||(id==='lotus'&&shield&&!ownedLotus)))this.sandboxExtraShield=true;
  return ok;
 };
 g.damageEnemy=function(e,n,credit=true){
  if(e.dummy){const before=e.hp;proto.damageEnemy.call(this,e,n,credit);logDummy(this,e,before-e.hp);if(e.hp<DUMMY_HP/2)e.hp=DUMMY_HP;return}
  return proto.damageEnemy.call(this,e,state.oneHit&&n>0&&!e.dead?DUMMY_HP:n,credit);
 };
 g.enemySpeed=function(e){return e.dummy?0:proto.enemySpeed.call(this,e)};
 g.enemyAttack=function(e){if(e.dummy){e.cd=99;return true}return proto.enemyAttack.call(this,e)};
 g.enemyContact=function(e){return e.dummy?true:proto.enemyContact.call(this,e)};
 g.generate=function(){proto.generate.call(this);revealFloor(this)};
 // The campaign caps a step at 40 ms. Substep fast-forward on slower displays.
 g.update=function(dt,input){
  const duration=Math.min(dt,.04)*state.speed,steps=Math.max(1,Math.ceil(duration/.04));
  for(let i=0;i<steps;i++){
   const enemies=this.room.enemies||[],dummies=enemies.filter(e=>e.dummy&&!e.dead);
   this.room.sandboxTraining=enemies.some(e=>e.sandboxSpawned&&!e.dead);
   for(const e of dummies){e.attack=99;e.cd=99;e.wind=0;e.vx=0;e.vy=0}
   proto.update.call(this,duration/steps,input);
   for(const e of dummies){e.x=e.anchorX;e.y=e.anchorY}
  }
 };
 revealFloor(g);
}
// Start resources: enough to open every lock and try the shop without grinding.
export function startSandbox(g,state){g.start();installSandbox(g,state);g.coins=30;g.keys=5;g.bombs=5;g.emit('room');return g}

function logDummy(g,e,dealt){if(!(dealt>0))return;const now=g.actionClock??g.elapsed;e.dummySince??=now;e.dummyTotal+=dealt;e.dummyLog.push({t:now,dealt});while(e.dummyLog.length&&e.dummyLog[0].t<now-5)e.dummyLog.shift()}
// Use the player's clock during slow time and keep a fixed window after the first five seconds.
export function dummyDps(g,e){const now=g.actionClock??g.elapsed,span=Math.max(1,Math.min(5,now-(e.dummySince??now)));return (e.dummyLog||[]).reduce((sum,h)=>sum+(h.t>=now-5?h.dealt:0),0)/span}

export function setSandboxChapter(g,floor){
 if(!Number.isInteger(floor)||floor<1||floor>CHAPTERS.length)return false;
 g.rescue=null;g.mode=g.mode==='rescue'?'play':g.mode;g.floor=floor;g.generate();return true;
}
export function enterSandboxRoom(g,destination){
 const room=g.rooms.find(r=>r.exists&&(r.type===destination||String(r.id)===String(destination)));if(!room)return false;
 g.rescue=null;if(g.mode==='rescue')g.mode='play';
 Object.assign(room,{locked:false,bombLocked:false,seen:true});if(room.hidden){room.hidden=false;room.revealed=true}
 g.enter(room.id,'top');return g.roomId===room.id;
}
// A fresh copy of a chapter, straight into its boss room.
export function sandboxBoss(g,floor){return setSandboxChapter(g,floor)&&enterSandboxRoom(g,'boss')}

function spawnPoint(g,used){
 let best=null,bestScore=-1;
 for(const cell of navigationSnapshot(g.room)){
  const {x,y}=cell;
  if(!cell.free||cell.distance<0||x<90||x>870||y<90||y>510)continue;
  const away=Math.hypot(x-g.p.x,y-g.p.y);
  if(away<150||used.some(e=>Math.hypot(e.x-x,e.y-y)<e.r+36))continue;
  if((g.room.hazards||[]).some(h=>h.kind!=='belt'&&overlaps(h,x,y,24)))continue;
  if(away>bestScore){bestScore=away;best={x,y}}
 }
 return best;
}
export function spawnSandboxEnemy(g,type,{dummy=false,flying=false}={}){
 const room=g.room;room.enemies||=[];const live=room.enemies.filter(e=>!e.dead);
 if(live.length>=MAX_SPAWNED)return null;
 const spot=spawnPoint(g,live);if(!spot)return null;
 const e=g.spawn(dummy?(flying?'hopper':'brute'):type,spot.x,spot.y);
 e.sandboxSpawned=true;e.cd=Math.max(e.cd||0,1.2);e.attack=Math.max(e.attack||0,1.2);e.chargeCD=Math.max(e.chargeCD||0,1.2);
 if(dummy){Object.assign(e,{dummy:flying?'fly':'ground',anchorX:e.x,anchorY:e.y,hp:DUMMY_HP,maxHp:DUMMY_HP,cd:99,dummyTotal:0,dummyLog:[]})}
 room.enemies.push(e);room.sandboxTraining=true;
 // Doors close for a real fight. A cleared boss room stays cleared so its finale cannot replay.
 if(!dummy&&!(room.type==='boss'&&room.clear))room.clear=false;
 g.emit('room');return e;
}
// Removes enemies without death effects (no splashes, splits or drops).
export function clearSandboxEnemies(g,{dummies=true}={}){
 let n=0;for(const e of g.room.enemies||[])if(!e.dead&&(dummies||!e.dummy)){e.dead=true;e.deadAt=g.elapsed;g.burst(e.x,e.y,'#b9d28a',10);n++}
 g.room.sandboxTraining=g.room.enemies.some(e=>e.sandboxSpawned&&!e.dead);
 g.enemyBullets=[];g.explosives=[];g.emit('room');return n;
}
export function resetSandboxRoom(g){
 const room=g.room;if(!['fight','challenge'].includes(room.type))return false;
 clearSandboxEnemies(g);room.enemies=spawnEncounter(g,room);room.clear=false;room.warmStart=g.elapsed+1;room.warmUntil=g.elapsed+4;
 for(const e of room.enemies){e.cd=Math.max(e.cd||0,1.2);e.attack=Math.max(e.attack||0,1.2);e.chargeCD=Math.max(e.chargeCD||0,1.2)}
 g.emit('room');return true;
}

function grant(g,item){
 const mode=g.mode,choices=g.choices;g.mode='choice';g.choices=[item];
 const ok=Base.prototype.choose.call(g,item.id);g.mode=mode;g.choices=choices;return ok;
}
function itemStats(ids){const stats={...BASE_STATS};for(const id of ids)applyItemStats(stats,id);return stats}
function removeItems(g,keep){
 const old=g.items,previous=itemStats(old),next=itemStats(keep),p=g.p;
 const lost=id=>old.includes(id)&&!keep.includes(id);
 g.items=keep;
 p.speed=next.speed;p.rate=next.rate;p.damage=next.damage;
 p.maxHp+=next.maxHp-previous.maxHp;p.hp=Math.min(p.hp,p.maxHp);
 if(lost('lotus')){p.shield=!!g.sandboxExtraShield&&p.shield;p.shieldCD=0}
 if(!keep.length){
  resetChronoRoom(g);resetFollowers(g);resetDeepseek(g);resetPhoebe(g);
 }else{
  for(const id of old)if(!keep.includes(id)){delete g.followerStates?.[id];delete g.memePets?.[id]}
  if(lost('gojohalf'))g.gojo=null;
  if(lost('sandevistan')){g.sandy=null;g.sandyTrails=[]}
  if(lost('ricewhale'))g.whale=null;
  if(lost('deepthink')){g.deepThink=0;g.deepReady=false;g.deepBurst=0}
  if(lost('rabbit')){g.rabbitWave=null;g.rabbitRequest=null}
  if(lost('tempura')){g.shrimpMeals=[];g.tempuraBuff=0}
  if(lost('phoebe'))g.phoebe=null;
  if(lost('phoebewire'))clearPhoebe(g);
  if(lost('phoebe')||lost('phoebewire')){
   g.phoebeWires=(g.phoebeWires||[]).filter(w=>w.source==='player'?g.has('phoebewire'):g.has('phoebe')).slice(-(g.has('phoebe')?3:2));
  }
 }
 if(lost('phoebesoot'))g.phoebeBoost=0;
 g.activeCharge=Math.min(g.activeCost(),g.activeCharge);g.emit('room');
}
export function setSandboxItem(g,id,on){
 const item=ITEMS.find(i=>i.id===id);if(!item||on===g.has(id))return false;
 if(on){if(id==='lotus'&&g.p.shield)g.sandboxExtraShield=true;const ok=grant(g,item);if(ok)g.activeCharge=Math.min(g.activeCost(),g.activeCharge);return ok}
 removeItems(g,g.items.filter(i=>i!==id));return true;
}
export function clearSandboxItems(g){removeItems(g,[])}

export function sandboxResource(g,kind){
 const p=g.p;
 if(kind==='coins')g.coins+=10;else if(kind==='keys')g.keys+=3;else if(kind==='bombs')g.bombs+=3;
 else if(kind==='heal')p.hp=p.maxHp;else if(kind==='laugh')g.activeCharge=g.activeCost();
 else if(kind==='shield'){p.shield=true;g.sandboxExtraShield=true}else if(kind==='maxhp'){if(p.maxHp>=24)return false;p.maxHp++;p.hp++}
 else return false;
 g.emit('room');return true;
}

const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const toggle=(key,label,on,hint)=>`<button class="sandbox-toggle" data-sandbox="toggle" data-key="${key}" aria-pressed="${on}"><b>${label}</b><small>${hint}</small></button>`;
function sceneTab(g){
 const rooms=g.rooms.filter(r=>r.exists),names=new Map(SANDBOX_ROOMS);
 return `<h3>章节</h3><div class="sandbox-row">${CHAPTERS.map((name,i)=>`<button data-sandbox="chapter" data-value="${i+1}" aria-pressed="${g.floor===i+1}"><b>${i+1}</b>${name}</button>`).join('')}</div>
<p class="sandbox-note">切换章节会生成新的楼层，道具和资源保留。</p>
<h3>直达本层房间</h3><div class="sandbox-row">${rooms.map(r=>`<button data-sandbox="room" data-value="${r.type}" data-room-id="${r.id}"${g.roomId===r.id?' aria-current="true"':''}><b>#${r.id}</b>${esc(names.get(r.type)||r.encounterName||'战斗房')}</button>`).join('')}</div>
<h3>Boss 挑战</h3><div class="sandbox-row">${BOSS_NAMES.map((name,i)=>`<button data-sandbox="boss" data-value="${i+1}"><b>${i+1}</b>${name}</button>`).join('')}</div>`;
}
function enemiesTab(g){
 const live=(g.room.enemies||[]).filter(e=>!e.dead).length,full=live>=MAX_SPAWNED,fight=['fight','challenge'].includes(g.room.type);
 return `<h3>第 ${g.floor} 章敌人 <small>本房 ${live} / ${MAX_SPAWNED}</small></h3><div class="sandbox-row">${chapterEnemies(g.floor).map(e=>`<button data-sandbox="spawn" data-value="${e.type}"${full?' disabled':''}>${esc(e.name)}</button>`).join('')}</div>
<h3>训练靶 <small>不动、不攻击，显示累计伤害和秒伤</small></h3><div class="sandbox-row"><button data-sandbox="dummy" data-value="ground"${full?' disabled':''}>地面训练靶</button><button data-sandbox="dummy" data-value="fly"${full?' disabled':''}>飞行训练靶</button></div>
<h3>本房</h3><div class="sandbox-row"><button data-sandbox="clearEnemies"${live?'':' disabled'}>清空敌人</button><button data-sandbox="resetRoom"${fight?'':' disabled'}>重新生成本房敌人</button></div>
<p class="sandbox-note">要换章节的敌人，先在“场景”切换章节。</p>`;
}
function itemsTab(g){
 return `<h3>道具 <small>已拥有 ${g.items.length} 件 · 点一下拿取或放下</small></h3><div class="sandbox-items">${sandboxItems().map(i=>`<button data-sandbox="item" data-value="${i.id}" aria-pressed="${g.has(i.id)}" title="${esc(i.desc)}">${itemIcon(i)}<span>${esc(i.name)}</span></button>`).join('')}</div>
<div class="sandbox-row"><button data-sandbox="clearItems"${g.items.length?'':' disabled'}>清空全部道具</button></div>`;
}
function frogTab(g,state){
 const p=g.p;
 return `<h3>资源 <small>生命 ${p.hp}/${p.maxHp} · 金币 ${g.coins} · 钥匙 ${g.keys} · 炸弹 ${g.bombs}</small></h3><div class="sandbox-row">
<button data-sandbox="resource" data-value="heal">回满生命</button><button data-sandbox="resource" data-value="maxhp"${p.maxHp>=24?' disabled':''}>生命上限 +1</button><button data-sandbox="resource" data-value="shield">一次性护盾</button><button data-sandbox="resource" data-value="laugh">充满大爆笑</button><button data-sandbox="resource" data-value="coins">金币 +10</button><button data-sandbox="resource" data-value="keys">钥匙 +3</button><button data-sandbox="resource" data-value="bombs">炸弹 +3</button></div>
<h3>规则</h3><div class="sandbox-toggles">${toggle('god','无敌',state.god,'不受任何伤害')}${toggle('oneHit','一击必杀',state.oneHit,'训练靶除外')}</div>
<p class="sandbox-note">关掉无敌时，奶蛙倒下会立刻满血站起，沙盒不会结束。</p>`;
}
function devTab(g,state){
 return `<h3>调试显示</h3><div class="sandbox-toggles">${toggle('hitboxes','碰撞范围',state.hitboxes,'角色、子弹和障碍的判定')}${toggle('info','调试信息',state.info,'帧率、数量、房间与种子')}</div>
<h3>游戏速度</h3><div class="sandbox-row sandbox-speed">${[.5,1,2].map(v=>`<button data-sandbox="speed" data-value="${v}" aria-pressed="${state.speed===v}">${v===.5?'慢动作 ×0.5':v===1?'正常 ×1':'加速 ×2'}</button>`).join('')}</div>
<p class="sandbox-note">房间 #${g.roomId} · ${esc(g.room.type)}${g.room.layoutName?' · '+esc(g.room.layoutName):''} · 种子 ${g.seedLabel}</p>`;
}
export function sandboxPanelHTML(g,state){
 const body={scene:sceneTab,enemies:enemiesTab,items:itemsTab,frog:frogTab,dev:devTab}[state.tab]||sceneTab;
 return `<div class="modal sandbox-modal" role="dialog" aria-modal="true" aria-labelledby="sandboxTitle"><div class="mini">SANDBOX · 不保存 · 不影响正式存档</div><h2 id="sandboxTitle">沙盒工具箱</h2>
<div class="sandbox-tabs" role="tablist">${SANDBOX_TABS.map(([id,name])=>`<button role="tab" data-sandbox-tab="${id}" aria-selected="${state.tab===id}">${name}</button>`).join('')}</div>
<div class="sandbox-body" role="tabpanel">${body(g,state)}</div>
<div class="sandbox-actions"><button class="primary" id="sandboxClose">回到沙盒 →</button><button class="secondary" id="sandboxExit">退出沙盒</button></div></div>`;
}
// Runs one panel button. Returns {close} when the action moves the frog to a new room.
export function runSandboxAction(g,state,action,value){
 switch(action){
  case 'chapter':return {done:setSandboxChapter(g,Number(value)),close:true,text:`已切换到第 ${value} 章 · ${CHAPTERS[value-1]}`};
  case 'room':return {done:enterSandboxRoom(g,value),close:true};
  case 'boss':return {done:sandboxBoss(g,Number(value)),close:true,text:`Boss 挑战 · ${BOSS_NAMES[value-1]}`};
  case 'spawn':return {done:!!spawnSandboxEnemy(g,value)};
  case 'dummy':return {done:!!spawnSandboxEnemy(g,null,{dummy:true,flying:value==='fly'})};
  case 'clearEnemies':return {done:clearSandboxEnemies(g)>0};
  case 'resetRoom':return {done:resetSandboxRoom(g),close:true};
  case 'item':return {done:setSandboxItem(g,value,!g.has(value))};
  case 'clearItems':clearSandboxItems(g);return {done:true};
  case 'resource':return {done:sandboxResource(g,value)};
  case 'toggle':if(!['god','oneHit','hitboxes','info'].includes(value))return {done:false};state[value]=!state[value];return {done:true};
  case 'speed':{const v=Number(value);if(![.5,1,2].includes(v))return {done:false};state.speed=v;return {done:true}}
 }
 return {done:false};
}

// Debug overlay, drawn in room coordinates on top of the frame.
export function drawSandboxOverlay(ctx,g,state,fps){
 const live=(g.room.enemies||[]).filter(e=>!e.dead);ctx.save();
 for(const e of live)if(e.dummy){
  ctx.fillStyle='#fff3d1';ctx.strokeStyle='#1d2b26';ctx.lineWidth=4;ctx.font='bold 15px system-ui';ctx.textAlign='center';
  const label=`${e.dummy==='fly'?'飞行':'地面'}训练靶 · 累计 ${(e.dummyTotal||0).toFixed(1)} · 秒伤 ${dummyDps(g,e).toFixed(1)}`;
  ctx.strokeText(label,e.x,e.y-e.r-24);ctx.fillText(label,e.x,e.y-e.r-24);
 }
 if(state.hitboxes){
  ctx.lineWidth=2;
  ctx.strokeStyle='#ffcf4a';for(const o of g.room.obstacles||[]){ctx.beginPath();if(o.w)ctx.rect(o.x-o.w/2,o.y-o.h/2,o.w,o.h);else ctx.arc(o.x,o.y,o.r,0,Math.PI*2);ctx.stroke()}
  ctx.strokeStyle='#ff6f6f';for(const e of live){ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,Math.PI*2);ctx.stroke()}
  ctx.strokeStyle='#ff9a3c';for(const b of g.enemyBullets){ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.stroke()}
  ctx.strokeStyle='#7fe3ff';for(const b of g.bullets){ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.stroke()}
  ctx.strokeStyle='#8dff8a';ctx.beginPath();ctx.arc(g.p.x,g.p.y,g.p.r,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='#fff3d1';ctx.font='bold 12px system-ui';ctx.textAlign='center';for(const e of live)if(!e.dummy)ctx.fillText(`${Math.max(0,e.hp).toFixed(1)}/${e.maxHp}`,e.x,e.y+e.r+14);
 }
 if(state.info){
  const lines=[`${Math.round(fps)} FPS · 速度 ×${state.speed}`,`敌人 ${live.length} · 敌弹 ${g.enemyBullets.length} · 笑声 ${g.bullets.length} · 特效 ${g.effects.length}`,`第 ${g.floor} 章 · 房间 #${g.roomId} ${g.room.type}${g.room.layoutName?' · '+g.room.layoutName:''}`,`种子 ${g.seedLabel} · 倒下 ${state.falls} 次`];
  ctx.fillStyle='#0c1413c4';ctx.fillRect(56,56,350,18*lines.length+12);
  ctx.fillStyle='#d9f2c4';ctx.font='bold 13px ui-monospace,monospace';ctx.textAlign='left';ctx.textBaseline='alphabetic';
  lines.forEach((t,i)=>ctx.fillText(t,66,76+i*18));
 }
 ctx.restore();
}
