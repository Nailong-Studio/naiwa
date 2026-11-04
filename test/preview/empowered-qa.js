const mod=await import('./game.js');
const {updateDeepseek}=await import('./deepseek-items.js');
const $=s=>document.querySelector(s);
function setup(ids){mod.start();const g=mod.game;g.items=ids;g.room.type='fight';g.room.clear=false;g.room.obstacles=[];g.room.hazards=[];g.room.loot=[];g.p.x=480;g.p.y=300;g.p.inv=999;const e=g.spawn('turret',820,480);e.hp=999;e.cd=999;g.room.enemies=[e];return g}
function finish(g,label){g.mode='paused';g.emit('room');mod.processEvents();$('#qaResult').textContent=JSON.stringify({label,items:g.items,bullets:g.bullets.length,damage:g.bullets.map(b=>+b.damage.toFixed(2)),manBurst:g.manBurst,deepBurst:g.deepBurst,angles:g.bullets.map(b=>Math.round(Math.atan2(b.vy,b.vx)*180/Math.PI))})}
$('#qaRing').onclick=()=>{const g=setup(['fadeaway']);g.update(.02,{dash:true,mx:1});for(let i=0;i<10;i++)g.update(.02,{});finish(g,'成功蛙跳仅触发一次八向篮球弹')};
$('#qaMan').onclick=()=>{const g=setup(['man']);g.manReady=true;g.shoot(1,0);finish(g,'Man第一轮发射后还剩一轮')};
$('#qaDeep').onclick=()=>{const g=setup(['deepthink']);updateDeepseek(g,3,3,{});g.shoot(1,0);finish(g,'思考第一轮发射后还剩两轮')};
$('#qaVoid').onclick=()=>{const g=setup(['voidframe']);g.p.x=300;g.room.obstacles=[{kind:'rock',x:380,y:294,w:40,h:90,r:20}];g.memeVolley=2;g.shoot(1,0);for(let i=0;i<15;i++)g.update(.02,{});finish(g,'虚影已经穿过岩石')};
$('#qaGugu').onclick=()=>{const g=setup(['gugucharm']);g.memeVolley=3;g.shoot(1,0);for(let i=0;i<8;i++)g.update(.02,{});finish(g,'第四轮紧密三发')};
$('#qaRhythm').onclick=()=>{const g=setup(['oyeye']);g.memeVolley=3;g.shoot(1,0);const e=g.spawn('brute',600,300),n=g.spawn('brute',650,330);e.hp=n.hp=100;g.room.enemies=[e,n];g.onBulletHit(e,g.bullets[0]);finish(g,'邻怪溅射后生命 '+n.hp)};
$('#qaBeat').onclick=()=>{const g=setup(['beatsticker']);g.beatShots=3;g.shoot(1,0);finish(g,'第四轮重拍伤害')};
