import {game,start,processEvents} from './game.js';
import {MOB_SHEETS} from './sprite-art.js';
function safe(){start();game.p.inv=999;game.p.x=480;game.p.y=510}
document.querySelector('#auditRoster').onclick=()=>{safe();game.room.clear=true;game.items.push('dog','egg','rabbit','turtle','mouse');game.room.enemies=MOB_SHEETS.flatMap(s=>s[1]).map((type,i)=>{const e=game.spawn(type,120+i%7*118,170+Math.floor(i/7)*100);e.cd=999;e.hp=e.maxHp*.7;return e});game.enemySpeed=()=>0;game.mode='paused';processEvents()};
document.querySelector('#auditRescue').onclick=()=>{safe();game.floor=5;game.generate();game.enter(game.rooms.find(r=>r.type==='boss'&&r.exists).id,'top');for(const e of game.room.enemies)game.damageEnemy(e,999);game.update(.02);processEvents()};
document.querySelector('#auditShop').onclick=()=>{safe();game.coins=50;game.enter(game.rooms.find(r=>r.type==='shop'&&r.exists).id,'top');game.p.x=480;game.p.y=300;game.offer('商店');processEvents()};
document.querySelector('#auditDead').onclick=()=>{safe();game.mode='dead';game.emit('end',{win:false});processEvents()};

document.querySelector('#auditHide').onclick=()=>document.querySelector('#artAuditBar').remove();
