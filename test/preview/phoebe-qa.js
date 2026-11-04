import {game,start,processEvents} from './game.js';
import {spriteImage} from './sprite-art.js';
import {PHOEBE_ITEMS} from './phoebe-items.js';
import {updateMemeFollowers} from './meme-followers.js';
document.documentElement.requestFullscreen=()=>Promise.reject(new Error('fixed QA viewport'));
for(const f of ['phoebe-electrician-v1.png','penguins-actions-v1.png','meme-followers-v1.png'])spriteImage(f);
function setup(ids){start();game.room.type='fight';game.room.clear=false;game.room.obstacles=[];game.room.hazards=[];game.items=ids;game.p.x=350;game.p.y=300;game.p.inv=999;game.enemySpeed=()=>0;const e=game.spawn('turret',600,348);e.hp=e.maxHp=999;e.cd=999;game.room.enemies=[e];game.emit('room');processEvents()}
function finish(){game.p.inv=0;game.mode='inspection';processEvents()}
document.querySelector('#qaWire').onclick=()=>{setup(['phoebe','phoebewire','phoebeplug']);for(let i=0;i<80;i++)game.update(.02,{});finish()};
document.querySelector('#qaRoles').onclick=()=>{setup(['tempura','sun','penguin']);game.room.enemies[0].x=440;game.room.enemies[0].mobCast={kind:'cross',t:0,wind:1};updateMemeFollowers(game,0);for(const s of Object.values(game.memePets))s.cd=0;updateMemeFollowers(game,0);updateMemeFollowers(game,.4);updateMemeFollowers(game,.4);finish()};
document.querySelector('#qaItems').onclick=()=>{setup([]);game.choices=PHOEBE_ITEMS;game.mode='choice';game.emit('choice',{title:'菲比的电工工具箱',choices:PHOEBE_ITEMS});processEvents()};
document.querySelector('#qaHide').onclick=()=>document.querySelector('#phoebeQA').remove();
