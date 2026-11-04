import {game,processEvents} from './game.js';
document.querySelector('#qaKill').onclick=()=>{game.p.hp=1;game.p.inv=0;game.p.shield=false;game.hurt();processEvents()};
setInterval(()=>{document.querySelector('#qaStatus').textContent=JSON.stringify({mode:game.mode,hp:game.p.hp,maxHp:game.p.maxHp,used:!!game.reviveUsed,watch:game.reviveWatch?.elapsed})},100);
