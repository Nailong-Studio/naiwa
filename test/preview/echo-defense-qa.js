import {game,start,processEvents} from './game.js';
import {spriteImage} from './sprite-art.js';
import {updateFollowers} from './follower-combat.js';
document.documentElement.requestFullscreen=()=>Promise.reject(new Error('fixed QA viewport'));
for(const f of ['penguins-actions-v1.png','followers-family-v2.png'])spriteImage(f);
function setup(ids){start();game.room.type='fight';game.room.clear=false;game.room.obstacles=[];game.room.hazards=[];game.room.enemies=[];game.items=ids;game.p.x=350;game.p.y=300;game.p.inv=999;game.enemySpeed=()=>0;game.emit('room');processEvents()}
document.querySelector('#qaEcho').onclick=()=>{setup(['returnvoice']);for(const [x,y] of [[520,294],[565,330],[530,360]]){const e=game.spawn('turret',x,y);e.hp=e.maxHp=100;e.cd=999;game.room.enemies.push(e)}game.shoot(1,0);let n=0;while(n++<70&&!game.effects.some(f=>f.type==='echoPulse'))game.update(.02,{});for(let i=0;i<12;i++)game.update(.02,{});game.p.inv=0;game.mode='inspection';processEvents()};
document.querySelector('#qaDefense').onclick=()=>{setup(['turtle','sweetpenguin']);game.room.enemies=[game.spawn('turret',700,300)];game.room.enemies[0].cd=999;updateFollowers(game,0);const s=game.followerStates.turtle;game.enemyBullets=[...Array.from({length:6},(_,i)=>({x:s.x+24,y:s.y-12+i*4,vx:-160,vy:0,r:6,life:4})),{x:game.p.x,y:game.p.y-95,vx:0,vy:200,r:6,life:4},{x:game.p.x-65,y:game.p.y,vx:200,vy:0,r:6,life:4}];game.memePets.sweetpenguin.cd=0;updateFollowers(game,0);updateFollowers(game,.19);game.p.inv=0;game.mode='inspection';processEvents()};
document.querySelector('#qaFishHide').onclick=()=>document.querySelector('#fishQA').remove();

