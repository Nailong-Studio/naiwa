import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
import {updateFollowers} from '../dist/follower-combat.js';
import {updateMemeFollowers} from '../dist/meme-followers.js';
import {chronoAttackInterval} from '../dist/chrono-items.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function setup(ids){const g=new Game(()=>.42);g.start();g.items=ids;g.room.type='fight';g.room.clear=false;g.room.obstacles=[];g.room.hazards=[];g.p.x=300;g.p.y=300;g.p.inv=0;const e=g.spawn('turret',800,450);e.hp=1000;e.cd=999;g.room.enemies=[e];g.enemySpeed=()=>0;return g}
test('sweet penguin intercepts five imminent threats, preserves outgoing shots and respects cooldown',()=>{
 const g=setup(['sweetpenguin']);updateMemeFollowers(g,0);const s=g.memePets.sweetpenguin;s.cd=0;
 const shots=Array.from({length:7},(_,i)=>({x:360+i*8,y:300,vx:-200,vy:0,r:5})),away={x:390,y:300,vx:200,vy:0,r:5};g.enemyBullets=[...shots,away];updateMemeFollowers(g,0);assert.equal(g.enemyBullets.length,8);updateMemeFollowers(g,.18);assert.deepEqual(g.enemyBullets,[shots[5],shots[6],away]);assert.equal(s.cd,3);updateMemeFollowers(g,.3);updateMemeFollowers(g,.3);assert.equal(g.enemyBullets.length,3);assert.equal(g.effects.filter(f=>f.type==='voiceChain').length,5);
});
test('turtle damages on actual contact with per-enemy cooldown while blocking every frame without speeding up',()=>{
 const g=setup(['turtle']);updateFollowers(g,0);const s=g.followerStates.turtle,e=g.room.enemies[0];e.x=s.x;e.y=s.y;g.enemyBullets=[{x:s.x,y:s.y,r:5}];updateFollowers(g,0);close(e.hp,998.5);assert.equal(g.enemyBullets.length,0);g.enemyBullets=[{x:s.x,y:s.y,r:5}];updateFollowers(g,.1);assert.equal(g.enemyBullets.length,0);close(e.hp,998.5);
 g.elapsed=.5;e.x=300+Math.cos(1)*56;e.y=300+Math.sin(1)*56;updateFollowers(g,.4);close(e.hp,997);close(s.x,e.x);close(s.y,e.y);assert.ok(g.effects.some(f=>f.type==='petImpact'));
});
test('turtle cannot hit airborne enemies or through cover; boss contact scales to a bounded cap',()=>{
 const g=setup(['turtle']);updateFollowers(g,0);const s=g.followerStates.turtle,boss=g.makeBoss('puppet',s.x,s.y);boss.hp=1000;g.p.damage=100;g.room.enemies=[boss];boss.airborne=true;updateFollowers(g,0);assert.equal(boss.hp,1000);boss.airborne=false;updateFollowers(g,0);assert.equal(boss.hp,997);
 const e=g.spawn('turret',s.x+25,s.y);e.hp=100;g.room.enemies=[e];g.room.obstacles=[{kind:'rock',x:s.x+13,y:s.y,w:10,h:70,r:5}];updateFollowers(g,0);assert.equal(e.hp,100);
});
test('real damage marks every living boss without moving aim, clearing projectiles or directly dealing damage',()=>{
 const g=setup(['ghostbuddha']);const bosses=['bull','meishu'].map((kind,i)=>g.makeBoss(kind,600+i*100,300));g.room.enemies=bosses;for(const b of bosses)b.hp=1000;g.enemyBullets=[{x:200,y:100,vx:50,vy:0,r:5,life:5}];g.hurt();assert.equal(g.p.hp,5);assert.ok(g.ghostDecoy);assert.equal(g.enemyBullets.length,1);
 for(const b of bosses){assert.equal(b.hp,1000);assert.equal(b.ghostMarkedUntil,6);g.damageEnemy(b,4);assert.equal(b.hp,995)}
 g.actionClock=5.99;g.damageEnemy(bosses[0],4);assert.equal(bosses[0].hp,990);g.actionClock=6;g.damageEnemy(bosses[0],4);assert.equal(bosses[0].hp,986);g.p.inv=0;g.hurt();assert.equal(bosses[0].ghostMarkedUntil,6);
});
test('ghost boss mark uses player time even during Sandevistan, and shield absorption does not trigger it',()=>{
 const g=setup(['ghostbuddha','sandevistan']);const boss=g.makeBoss('puppet',700,300);g.room.enemies=[boss];boss.cd=999;g.p.shield=true;g.hurt();assert.equal(boss.ghostMarkedUntil,undefined);g.p.inv=0;g.hurt();assert.equal(boss.ghostMarkedUntil,6);g.mode='paused';g.update(.04,{});assert.equal(g.actionClock,undefined);g.mode='play';for(let i=0;i<151;i++)g.update(.02,{});assert.ok(g.elapsed<1);assert.ok(g.actionClock>3);const hp=boss.hp;g.damageEnemy(boss,4);close(hp-boss.hp,5);g.actionClock=6;const expired=boss.hp;g.damageEnemy(boss,4);close(expired-boss.hp,4);
});
test('Sandevistan has two seconds of threefold cadence, one second of recovery boost, and no slowdown of already faster builds',()=>{
 const g=setup(['sandevistan']);g.p.shot=.9;g.hurt();close(g.attackInterval(),g.p.rate/3);assert.ok(g.p.shot<=g.p.rate/3);g.sandy.age=1.99;close(chronoAttackInterval(g,.3),.1);g.sandy.age=2;close(chronoAttackInterval(g,.3),.24);g.sandy.left=0;close(chronoAttackInterval(g,.3),.3);g.sandy.left=3;g.sandy.age=0;close(chronoAttackInterval(g,.1),.055);close(chronoAttackInterval(g,.03),.03);
});
