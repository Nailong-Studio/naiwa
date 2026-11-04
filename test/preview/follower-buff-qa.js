const mod=await import('./game.js');const $=s=>document.querySelector(s);let scene='尚未开始';
function setup(ids){mod.start();const g=mod.game;g.items=ids;g.room.type='fight';g.room.clear=false;g.room.obstacles=[];g.room.hazards=[];g.room.loot=[];g.p.x=420;g.p.y=330;g.hurt=()=>{};g.enemySpeed=()=>0;g.room.enemies=[[620,300],[540,430],[700,380]].map(([x,y])=>{const e=g.spawn('turret',x,y);e.hp=e.maxHp=10000;e.cd=1;return e});g.activeCharge=g.activeCost();g.emit('room');mod.processEvents();return g}
$('#qaAttack').onclick=()=>{setup(['dog','egg','penguin','kobe','ricewhale','tadpole']);scene='输出奶伴：独立攻击动作、实体弹道'};
$('#qaSupport').onclick=()=>{const g=setup(['turtle','sweetpenguin','mouse','tempura','sun','phoebe','rabbit']);g.drop('bomb',650,330,2);scene='辅助奶伴：拾取、护卫、布线和大爆笑波纹'};
$('#qaFreeze').onclick=()=>{mod.game.mode='paused'};
setInterval(()=>{const g=mod.game;$('#qaStatus').textContent=JSON.stringify({scene,time:+g.elapsed.toFixed(1),damage:+g.room.enemies.reduce((n,e)=>n+e.maxHp-e.hp,0).toFixed(2),bombs:g.bombs,bullets:g.bullets.length,wires:g.phoebeWires?.length||0,servings:g.room.tempuraServings||0,items:g.items})},100);
