import {game,start,processEvents} from './game.js';
import {DEEPSEEK_ITEMS,enterDeepseek} from './deepseek-items.js';
import {spriteImage} from './sprite-art.js';
document.documentElement.requestFullscreen=()=>Promise.reject(new Error('fixed QA viewport'));
spriteImage('deepseek-actions-v1.png');spriteImage('deepseek-items-v1.png');
function setup(){start();game.floor=2;game.generate();game.enter(game.rooms.find(r=>r.exists&&r.type==='fight').id,'top');game.room.obstacles=[];game.room.hazards=[];game.room.enemies=[game.spawn('turret',650,300)];game.room.enemies[0].hp=9999;game.room.enemies[0].cd=999;game.p.x=400;game.p.y=300;game.items.push(...DEEPSEEK_ITEMS.map(i=>i.id));game.whaleFed=3;enterDeepseek(game);game.emit('room');processEvents()}
document.querySelector('#qaFish').onclick=()=>{setup();for(let i=0;i<24;i++)game.update(.04,{});game.p.inv=0;game.mode='inspection';processEvents()};
document.querySelector('#qaFishItems').onclick=()=>{setup();game.room.type='treasure';game.mode='choice';game.choices=DEEPSEEK_ITEMS;game.emit('choice',{title:'大肥鱼的白饭食堂',choices:game.choices});processEvents()};
document.querySelector('#qaFishHide').onclick=()=>document.querySelector('#fishQA').remove();
