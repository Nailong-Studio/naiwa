document.documentElement.requestFullscreen=()=>Promise.reject(new Error('Responsive QA uses a fixed viewport'));
import {game,start,processEvents} from './game.js';
import {MEME_FOLLOWERS,MEME_ITEMS} from './meme-items.js';
function scene(floor){start();game.floor=floor;game.generate();game.enter(game.rooms.find(r=>r.exists&&r.type==='boss').id,'top');game.p.inv=999;game.p.hp=6;game.p.x=480;game.p.y=480;game.items.push(...MEME_FOLLOWERS,'ghostbuddha','shrimpfeet','elbow','man');for(const e of game.room.enemies){e.hp=e.maxHp=5000;}game.emit('room');processEvents();}
document.querySelector('#qaPets').onclick=()=>{scene(1);game.room.enemies=[game.spawn('loader',700,260)];game.room.obstacles=[];game.room.hazards=[];game.room.enemies[0].hp=9999;game.room.enemies[0].cd=999;game.p.x=480;game.p.y=330;};
document.querySelector('#qaThree').onclick=()=>{scene(3);const e=game.room.enemies[0];e.handCycle=0;e.cd=.05;setTimeout(()=>game.mode='inspection',1700);};
document.querySelector('#qaFour').onclick=()=>{scene(4);const e=game.room.enemies[0];e.puppetCycle=3;e.hp=2000;e.cd=.05;setTimeout(()=>game.mode='inspection',1700);};
document.querySelector('#qaGhost').onclick=()=>{scene(2);game.room.enemies=[game.spawn('brute',600,350),game.spawn('brute',550,300)];for(const e of game.room.enemies)e.hp=9999;game.room.obstacles=[];game.room.hazards=[];game.p.x=450;game.p.y=350;game.p.inv=0;game.hurt();game.p.x=680;game.p.inv=0;game.hurt=()=>{};game.ghostDecoy.until=game.elapsed+999;game.effects.find(f=>f.type==='ghostIdol').life=game.effects.find(f=>f.type==='ghostIdol').max=999;game.emit('room');processEvents();};
document.querySelector('#qaShop').onclick=()=>{start();game.coins=100;game.enter(game.rooms.find(r=>r.exists&&r.type==='shop').id,'top');game.room.shopStock=MEME_ITEMS;game.offer('新道具');processEvents();};
document.querySelector('#qaHide').onclick=()=>document.querySelector('#qa').remove();
