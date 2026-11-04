const NativeAudio=window.Audio,media=[];window.Audio=class extends NativeAudio{constructor(url){super(url);const m={file:new URL(url).pathname.split('/').at(-1),audio:this,furthest:0,plays:0};media.push(m);this.addEventListener('playing',()=>{if(!this.muted)m.plays++});this.addEventListener('timeupdate',()=>{if(!this.muted)m.furthest=Math.max(m.furthest,this.currentTime)})}};
const mod=await import('./game.js');const {start,processEvents}=mod,$=s=>document.querySelector(s);
$('#qaShop').onclick=()=>{start();const g=mod.game;g.coins=50;g.enter(g.rooms.find(r=>r.type==='shop'&&r.exists).id,'top');g.p.x=480;g.p.y=300;g.offer('商店');processEvents()};
$('#qaDead').onclick=()=>{const g=mod.game;g.p.hp=0;g.mode='dead';g.emit('end',{win:false});processEvents()};
function boss(floor){start();const g=mod.game;g.floor=floor;g.generate();g.enter(g.rooms.find(r=>r.type==='boss'&&r.exists).id,'top');g.p.inv=999;processEvents()}
document.querySelectorAll('[data-qa-floor]').forEach(b=>b.onclick=()=>boss(Number(b.dataset.qaFloor)));
$('#qaRescue').onclick=()=>{boss(5);const g=mod.game;for(const e of g.room.enemies)g.damageEnemy(e,999);g.update(.02);processEvents()};
$('#qaCoinAudio').onclick=()=>{start();const g=mod.game;processEvents();g.items=['man'];g.manReady=true;g.shoot(1,0);processEvents();setTimeout(()=>{g.room.loot.push({type:'coin',amount:1,x:g.p.x,y:g.p.y});g.update(.02);processEvents()},150)};
setInterval(()=>{$('#qaState').textContent=JSON.stringify({mode:mod.game.mode,floor:mod.game.floor,coins:mod.game.coins,hp:mod.game.p.hp,max:mod.game.p.maxHp,used:!!mod.game.reviveUsed,presses:mod.game.rescue?.presses||0});$('#qaAudio').textContent=media.filter(m=>m.plays).map(m=>`${m.file}: ${m.furthest.toFixed(2)}s/${m.audio.duration?.toFixed(2)}s`).join(' | ')},100);
