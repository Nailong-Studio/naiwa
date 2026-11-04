import {game,start,processEvents} from './game.js';
import {spriteImage} from './sprite-art.js';
document.documentElement.requestFullscreen=()=>Promise.reject(new Error('QA fixed viewport'));
spriteImage('gojo-manga-actions-v2.png');spriteImage('sandevistan-v1.png');
function setup(){start();game.floor=3;game.generate();game.enter(game.rooms.find(r=>r.exists&&r.type==='fight').id,'top');game.room.obstacles=[];game.room.hazards=[];game.room.enemies=[game.spawn('brute',700,350),game.spawn('turret',750,180)];for(const e of game.room.enemies){e.hp=9999;e.cd=99;}game.p.x=300;game.p.y=350;game.p.inv=0;game.items.push('sandevistan','gojohalf');game.emit('room');processEvents();}
document.querySelector('#qaSandy').onclick=()=>{setup();game.enemyBullets=Array.from({length:9},(_,i)=>({x:620,y:100+i*45,vx:-160,vy:0,life:12,r:7}));game.hurt();for(let i=0;i<45;i++)game.update(.02,{mx:1,my:-.3,fire:true,ax:1});game.heroMoving=true;game.mode='inspection';processEvents();};
document.querySelector('#qaGojo').onclick=()=>{setup();game.update(.02,{dash:true,mx:1});for(let i=0;i<8;i++)game.update(.02,{mx:1,fire:true,ax:1});game.mode='inspection';processEvents();};
document.querySelector('#qaHide').onclick=()=>document.querySelector('#chronoQA').remove();
