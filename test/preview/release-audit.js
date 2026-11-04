import {game,start,processEvents} from './game.js';
document.querySelector('#qaShop').onclick=()=>{start();game.coins=50;game.enter(game.rooms.find(r=>r.type==='shop'&&r.exists).id,'top');game.p.x=480;game.p.y=300;game.offer('商店');processEvents()};
function finalBoss(){start();game.floor=5;game.generate();game.enter(game.rooms.find(r=>r.type==='boss'&&r.exists).id,'top');game.p.inv=999;game.p.maxHp=game.p.hp=20;processEvents()}
document.querySelector('#qaBoss').onclick=finalBoss;
document.querySelector('#qaRescue').onclick=()=>{finalBoss();for(const e of game.room.enemies)game.damageEnemy(e,999);game.update(.02);processEvents()};
setInterval(()=>{document.querySelector('#qaState').textContent=`${game.mode} / 金币 ${game.coins} / 钥匙 ${game.keys} / 进度 ${game.rescue?.presses||0} / 弹幕 ${game.enemyBullets.length}`},200);
