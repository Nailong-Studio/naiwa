// 图鉴: items, enemies and bosses the player has met in real runs, kept across runs on this
// device. The sandbox and the boss demo never record. Art is drawn with the game's own code.
import {ITEMS,CHAPTERS,BOSS_NAMES} from './campaign.js';
import {itemIcon} from './item-icons.js';
import {drawPixelEnemy} from './pixel-art.js';
import {cachedSpriteImage} from './sprite-art.js';
import {enemyName} from './sandbox.js';

export const CODEX_KEY='naiwa-codex-v1';
// Each enemy appears under the chapter it first shows up in. 碎布小怪 only comes from splits and machines.
export const CODEX_ENEMIES=[
 ['runner',1,'红围巾，高速追击，血量较低。看到它先处理。'],
 ['milkSkater',1,'在普通地面移速为 145，滑上奶迹后会加速到 205。'],
 ['milkleak',1,'边走边漏奶，留下的敌方奶迹会减速并伤害奶蛙。'],
 ['milkspitter',1,'站桩投瓶，奶瓶落地溅出奶迹。'],
 ['turret',1,'站着不动，每 0.85 秒瞄准射击一次，比普通远程怪更积极。'],
 ['shooter',1,'保持距离发射弹幕；第四章会换上连射枪。'],
 ['curdling',1,'被打倒后预警 0.7 秒，随后向四周溅奶。'],
 ['brute',1,'圆滚滚的近战怪，血比普通小怪厚，没有减伤。'],
 ['hopper',1,'冲刺前显示红线，能飞过坑洞，别指望地形挡住它。'],
 ['beatling',2,'踩着节拍停顿 0.65 秒瞄准，然后向你冲撞；指挥在场时冲得更勤。'],
 ['echoBell',2,'预警后朝锁定方向连射三轮，弹幕会折返。'],
 ['soundTurret',2,'轮换错位环射、瞄准扇射和旋转十字，虚线预警后发射。'],
 ['conductor',2,'让附近同伴加速 30%，持续 2 秒，还会催鼓仔和音箱提前出手。'],
 ['loader',3,'守在缺口附近的装卸工，抬枪预警 0.45 秒后射击。'],
 ['forklift',3,'锁定方向预警 0.75 秒后冲锋，撞墙就停。'],
 ['parcelThrower',3,'先标出范围，包裹随后砸向落点。'],
 ['stitchling',4,'被打倒时裂成两只碎布小怪。'],
 ['tiny',4,'拼缝娃娃和造怪口留下的小碎布，跑得很快但很脆。'],
 ['scrapMine',4,'高速追击，碰到奶蛙会立即爆炸。拉开距离击倒它可以阻止爆炸。'],
 ['dollTurret',4,'站桩三连射，躲进掩体等它停火。'],
 ['stitchMedic',4,'定点给同伴回血，打断它就能中止治疗。'],
 ['jailer',5,'移动极快的追捕守卫，别被它贴身。'],
 ['warden',5,'站桩五连射，射得很快，用牢柱挡住火线。'],
 ['lockSentry',5,'预警后放出短暂电网，等电网熄灭再穿过。'],
 ['prismEye',5,'十字射击，每一轮都换一个角度。']
];
export const CODEX_BOSSES=[
 {id:'collector',kinds:['collector'],floor:1,text:'移动时留下奶迹。两次普通投瓶后接一次强化三连投；预警 0.85 秒后长距离冲刺。'},
 {id:'speaker',kinds:['speaker'],floor:2,text:'环形音波、扇形连发和低音震荡轮流来；半血后高空跳砸，落地放出一圈弹幕。'},
 {id:'catcher',kinds:['catcher'],floor:3,text:'双手封住左右，只留上下逃生空间并定向连射，还会双手砸地。炸弹能把双手炸退 3 秒。'},
 {id:'puppet',kinds:['puppet'],floor:4,text:'轮换投怪、缝针连射和十字缝线；召唤物最多 5 只，空中的怪物炮弹也算在内。'},
 {id:'final',kinds:['bull','meishu'],floor:5,text:'牛来两连撞、跺地震荡、牛角扇射；美鼠三连夹击、旋转十字弹。两人定时合击，发动弹墙与冲撞，剩下一个时会暴走。'}
];
const catalogItems=ITEMS.filter(i=>i.id!=='tadpole');
const itemIds=new Set(catalogItems.map(i=>i.id)),enemyIds=new Set(CODEX_ENEMIES.map(([id])=>id)),bossIds=new Set(CODEX_BOSSES.map(b=>b.id));
const bossesByKind=new Map(CODEX_BOSSES.flatMap(b=>b.kinds.map(kind=>[kind,b.id])));
const empty=()=>({items:{},enemies:{},bosses:{}});
const prefix=CODEX_KEY+':';
const journal=new WeakMap();
const validRun=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{1,96}$/.test(id);
const count=n=>Number.isSafeInteger(n)&&n>=0?n:0;
function victories(c,id){
 if(!journal.has(c))journal.set(c,new Map());
 const book=journal.get(c);
 if(!book.has(id))book.set(id,new Set());
 return book.get(id);
}
function meetBoss(c,id){return c.bosses[id]??={met:1,defeated:0}}
function addWin(c,id,run){
 const wins=victories(c,id);if(wins.has(run))return false;
 wins.add(run);const row=meetBoss(c,id);row.defeated=Math.min(Number.MAX_SAFE_INTEGER,row.defeated+1);return true;
}
// Each new fact has an immutable storage key. Two tabs discovering different things can both
// finish their writes even if one tab closes before receiving the other's storage event.
function readFact(c,key){
 const [kind,id,run]=key.split(':');
 if((kind==='seen'||kind==='owned')&&itemIds.has(id))c.items[id]=Math.max(c.items[id]||0,kind==='owned'?2:1);
 else if(kind==='enemy'&&enemyIds.has(id))c.enemies[id]=1;
 else if(kind==='boss'&&bossIds.has(id))meetBoss(c,id);
 else if(kind==='win'&&bossIds.has(id)&&validRun(run))addWin(c,id,run);
}
export function readCodex(storage){
 const c=empty();
 try{
  if(storage===undefined)storage=globalThis.localStorage;
  let d;try{d=JSON.parse(storage?.getItem(CODEX_KEY)||'null')}catch{}
  for(const id of itemIds){const v=d?.items?.[id];if(v===1||v===2)c.items[id]=v}
  for(const id of enemyIds)if(d?.enemies?.[id]===1)c.enemies[id]=1;
  for(const id of bossIds){
   const row=d?.bosses?.[id],tokens=d?.victories?.[id];
   if(row?.met===1||count(row?.defeated)>0)c.bosses[id]={met:1,defeated:count(row.defeated)};
   if(Array.isArray(tokens)){
    const set=victories(c,id);for(const run of tokens)if(validRun(run))set.add(run);
    if(set.size){const boss=meetBoss(c,id);boss.defeated=Math.max(boss.defeated,set.size)}
   }
  }
  for(let i=0;i<(storage?.length||0);i++){
   const key=storage.key(i);if(key?.startsWith(prefix))readFact(c,key.slice(prefix.length));
  }
 }catch{}
 return c;
}
export function mergeCodex(c,other){
 for(const [id,v] of Object.entries(other.items))c.items[id]=Math.max(c.items[id]||0,v);
 Object.assign(c.enemies,other.enemies);
 for(const [id,row] of Object.entries(other.bosses)){
  const local=meetBoss(c,id),ours=victories(c,id),theirs=victories(other,id);
  // Counts from before win receipts existed stay valid across imports and reloads.
  const baseline=Math.max(0,local.defeated-ours.size,row.defeated-theirs.size);
  for(const run of theirs)ours.add(run);
  local.defeated=Math.min(Number.MAX_SAFE_INTEGER,baseline+ours.size);
 }
 return c;
}
export function saveCodex(c,storage){
 try{
  if(storage===undefined)storage=globalThis.localStorage;
  if(!storage)return false;
  const saved=readCodex(storage);
  const write=key=>storage.setItem(prefix+key,'1');
  for(const [id,v] of Object.entries(c.items))if(v>(saved.items[id]||0))write((v===2?'owned:':'seen:')+id);
  for(const id of Object.keys(c.enemies))if(!saved.enemies[id])write('enemy:'+id);
  for(const id of Object.keys(c.bosses)){
   if(!saved.bosses[id])write('boss:'+id);
   const existing=victories(saved,id);
   for(const run of victories(c,id))if(!existing.has(run))write('win:'+id+':'+run);
  }
  mergeCodex(c,saved);
  const tokens={};for(const id of Object.keys(c.bosses)){const set=victories(c,id);if(set.size)tokens[id]=[...set]}
  storage.setItem(CODEX_KEY,JSON.stringify({...c,victories:tokens}));return true;
 }catch{return false}
}
// Observe the room carried by the event: the frog may already be on the next floor when it is handled.
export function recordCodex(c,g,room=g.room,choices=g.mode==='choice'?g.choices:[]){
 if(g.sandbox)return false;
 if(!validRun(g.codexRunId))g.codexRunId=globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
 let changed=false;
 const markItem=(id,level)=>{if(itemIds.has(id)&&level>(c.items[id]||0)){c.items[id]=level;changed=true}};
 for(const id of g.items)markItem(id,2);
 for(const item of choices||[])markItem(item.id,1);
 for(const e of room?.enemies||[]){
  if(e.dummy||e.sandboxSpawned)continue;
  if(e.type==='boss'){
   const id=bossesByKind.get(e.kind);if(!id)continue;
   if(!c.bosses[id]){meetBoss(c,id);changed=true}
   if(room.clear&&room.enemies.every(x=>x.type!=='boss'||x.dead)&&addWin(c,id,g.codexRunId))changed=true;
  }else if(enemyIds.has(e.type)&&!c.enemies[e.type]){c.enemies[e.type]=1;changed=true}
 }
 return changed;
}
export function codexProgress(c){
 return {items:Object.keys(c.items).filter(id=>itemIds.has(id)).length,itemsTotal:catalogItems.length,
  enemies:Object.keys(c.enemies).filter(id=>enemyIds.has(id)).length,enemiesTotal:enemyIds.size,
  bosses:CODEX_BOSSES.filter(b=>c.bosses[b.id]?.met).length,bossesTotal:CODEX_BOSSES.length};
}

const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
export const CODEX_TABS=[['items','道具'],['enemies','敌人'],['bosses','关末']];
function entries(codex,tab){
 if(tab==='items')return catalogItems.map(i=>({id:i.id,known:!!codex.items[i.id],owned:codex.items[i.id]===2,name:i.name,text:i.desc,icon:codex.items[i.id]?itemIcon(i):''}));
 if(tab==='enemies')return CODEX_ENEMIES.map(([type,floor,text])=>({id:type,known:!!codex.enemies[type],name:enemyName(type),text,floor,art:{type,floor}}));
 return CODEX_BOSSES.map(b=>{const row=codex.bosses[b.id];return {id:b.id,known:!!row?.met,defeated:row?.defeated||0,name:BOSS_NAMES[b.floor-1],text:b.text,floor:b.floor,art:{boss:b.kinds,floor:b.floor}}});
}
export function codexHTML(codex,state){
 const tab=state.tab||'items',list=entries(codex,tab),p=codexProgress(codex);
 const pick=list.find(e=>e.id===state.pick&&e.known)||list.find(e=>e.owned)||list.find(e=>e.known)||null;
 const count={items:`${p.items}/${p.itemsTotal}`,enemies:`${p.enemies}/${p.enemiesTotal}`,bosses:`${p.bosses}/${p.bossesTotal}`};
 const detail=pick?`<div class="codex-detail"><div class="codex-detail-art">${pick.icon||`<canvas width="120" height="120" data-codex-art="${esc(pick.id)}"></canvas>`}</div><div><h3>${esc(pick.name)}</h3><p class="codex-meta">${tab==='items'?(pick.owned?'已获得':'见过 · 尚未拿到'):tab==='enemies'?`第 ${pick.floor} 章 · ${esc(CHAPTERS[pick.floor-1])}`:`第 ${pick.floor} 章关末 · ${pick.defeated?`击败 ${pick.defeated} 次`:'尚未击败'}`}</p><p>${esc(pick.text)}</p></div></div>`
  :`<div class="codex-detail codex-empty"><p>还没有记录。开始冒险，遇到的${tab==='items'?'道具':tab==='enemies'?'敌人':'关末敌人'}会出现在这里。</p></div>`;
 const cells=list.map(e=>`<button class="codex-cell${e.known?'':' unknown'}" data-codex-pick="${esc(e.id)}"${e.known?'':' disabled'} aria-pressed="${pick?.id===e.id}" aria-label="${e.known?esc(e.name):'未发现'}">${e.known?(e.icon||`<canvas width="64" height="64" data-codex-art="${esc(e.id)}"></canvas>`):'<span class="codex-unknown" aria-hidden="true">?</span>'}<span>${e.known?esc(e.name):'？？？'}</span>${e.owned?'<i class="codex-owned" aria-hidden="true">✓</i>':''}</button>`).join('');
 return `<div class="modal codex-modal" role="dialog" aria-modal="true" aria-labelledby="codexTitle"><div class="mini">POND FIELD NOTES</div><h2 id="codexTitle">奶蛙图鉴</h2>
<div class="codex-tabs" role="tablist">${CODEX_TABS.map(([id,name])=>`<button role="tab" data-codex-tab="${id}" aria-selected="${tab===id}">${name}<small>${count[id]}</small></button>`).join('')}</div>
<div class="codex-body" role="tabpanel"><div class="codex-reading" aria-live="polite">${detail}</div><div class="codex-list"><div class="codex-grid">${cells}</div><p class="codex-note">只记录正式冒险，沙盒试玩不计入。${state.sessionOnly?'浏览器暂时无法保存，当前记录仅在本次游戏中保留。':'记录保存在这台设备的这个浏览器里。'}</p></div></div>
<button class="primary" id="codexClose">合上图鉴</button></div>`;
}
// Draws enemy or boss art into the panel's canvases; call again when sprite sheets finish loading.
export function paintCodexArt(root,list=CODEX_ENEMIES){
 for(const canvas of root.querySelectorAll('canvas[data-codex-art]')){
  const id=canvas.dataset.codexArt,c=canvas.getContext('2d'),w=canvas.width;c.clearRect(0,0,w,w);c.imageSmoothingEnabled=false;
  const boss=CODEX_BOSSES.find(b=>b.id===id),floor=boss?boss.floor:(list.find(([t])=>t===id)||[])[1]||1;
  const actors=boss?boss.kinds.map((kind,i,all)=>({type:'boss',kind,x:all.length>1?(i?.68:.32)*w:w/2,y:w*.72})):[{type:id,x:w/2,y:w*.78}];
  const size=boss?156:id==='tiny'?42:id==='forklift'?78:68,scale=w/(boss?(boss.kinds.length>1?300:190):size*1.1);
  c.save();c.scale(scale,scale);
  for(const a of actors)drawPixelEnemy(c,{...a,x:a.x/scale,y:a.y/scale,r:boss?56:19,t:0,hp:1,maxHp:1,artChapter:floor,artFacing:-1,gunFacing:-1,dead:false},0);
  c.restore();
 }
}
export const CODEX_SHEETS=['mobs-milk-v1.png','mobs-stage-v1.png','mobs-factory-v1.png','gunners-actions-v1.png','chapter-bosses-v1.png','bull-actions-v2.png','meishu-actions-v1.png'];
export function whenCodexArt(root,callback){
 const waiting=[];
 if(root.querySelector('canvas[data-codex-art]'))for(const file of CODEX_SHEETS){
  const img=cachedSpriteImage(file);
  if(img&&!img.complete){img.addEventListener('load',callback,{once:true});waiting.push(img)}
 }
 return ()=>{for(const img of waiting)img.removeEventListener('load',callback)};
}
