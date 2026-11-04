import {game,start,processEvents} from './game.js';
import {MOB_SHEETS} from './sprite-art.js';
import {GameAudio} from './game-audio.js';
function chapter(floor){start();game.floor=floor;game.generate();game.enter(game.rooms.find(r=>r.type==='boss'&&r.exists).id,'top');game.p.inv=999;game.p.maxHp=game.p.hp=20;for(const e of game.room.enemies)e.hp=e.maxHp*.48;processEvents()}
for(const b of document.querySelectorAll('[data-floor]'))b.onclick=()=>chapter(Number(b.dataset.floor));
document.querySelector('#qaRescue').onclick=()=>{chapter(5);for(const e of game.room.enemies)game.damageEnemy(e,999);game.update(.02);processEvents()};
document.querySelector('#qaPets').onclick=()=>{start();game.items.push('dog','egg','rabbit','mouse','turtle');game.room.clear=false;game.p.inv=999;game.activeCharge=45;game.room.enemies=['turret','milkspitter','shooter'].map((type,i)=>{const e=game.spawn(type,650,170+i*100);e.hp=e.maxHp=100;return e});game.drop('coin',600,360,3);game.drop('key',580,380);processEvents()};
document.querySelector('#qaEffects').onclick=()=>{start();game.floor=2;game.room.clear=true;game.p.x=480;game.p.y=500;game.room.enemies=MOB_SHEETS.flatMap(s=>s[1]).map((type,i)=>{const e=game.spawn(type,130+i%8*100,140+Math.floor(i/8)*110);e.cd=999;e.hp=e.maxHp=100;return e});game.items.push('dog','egg','mouse','turtle','rabbit');game.p.inv=999;game.enemySpeed=()=>0;processEvents()};
const audio=new GameAudio();document.querySelector('#qaAudio').onclick=()=>{audio.laugh({long:true});setInterval(()=>document.querySelector('#audioState').textContent=`音轨 ${audio.voice.duration.toFixed(2)}秒 / ${audio.voice.currentTime.toFixed(2)}秒 ${audio.voice.paused?'停止':'播放'}`,200)};
