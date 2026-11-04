import {game,start,processEvents} from './game.js';
const $=s=>document.querySelector(s);
$('#qaShop').onclick=()=>{start();game.coins=50;game.enter(game.rooms.find(r=>r.type==='shop'&&r.exists).id,'top');game.p.x=480;game.p.y=300;game.offer('商店');processEvents()};
$('#qaDead').onclick=()=>{start();game.p.hp=0;game.mode='dead';game.emit('end',{win:false});processEvents()};
function boss(){start();game.floor=5;game.generate();game.enter(game.rooms.find(r=>r.type==='boss'&&r.exists).id,'top');game.p.inv=999;processEvents()}
$('#qaBoss').onclick=boss;
$('#qaRescue').onclick=()=>{boss();for(const e of game.room.enemies)game.damageEnemy(e,999);game.update(.02);processEvents()};
setInterval(()=>$('#qaState').textContent=JSON.stringify({mode:game.mode,coins:game.coins,hp:game.p.hp,max:game.p.maxHp,used:!!game.reviveUsed,presses:game.rescue?.presses||0}),200);
