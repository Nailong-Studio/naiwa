import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
import {hitVoice} from '../dist/voice-builds.js';
import {updateMemeFollowers} from '../dist/meme-followers.js';
import {memeDamage,updateMeme} from '../dist/meme-items.js';
function setup(ids=[]){const g=new Game(()=>.42);g.start();g.items=ids;g.room.type='fight';g.room.clear=false;g.room.obstacles=[];g.room.hazards=[];g.p.x=300;g.p.y=300;g.p.inv=999;g.enemySpeed=()=>0;const e=g.spawn('turret',480,294);e.hp=e.maxHp=1000;e.cd=999;g.room.enemies=[e];return g}
test('echo center keeps its position and velocity while only surrounding enemies are repelled',()=>{
 for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const g=setup(['returnvoice']),e=g.room.enemies[0];e.x=g.p.x+dx*150;e.y=g.p.y+dy*150;g.shoot(dx,dy);const b=g.bullets[0];hitVoice(g,e,b);hitVoice(g,e,{...b,vx:-dx*490,vy:-dy*490,returning:true});assert.equal(e.vx,0);assert.equal(e.vy,0);}
});
test('sustained echo fire does not drag its target behind the player',()=>{
 const g=setup(['returnvoice']),e=g.room.enemies[0];for(let i=0;i<500;i++)g.update(.02,{fire:true,ax:1});assert.equal(e.x,480);assert.ok(e.hp<970);assert.equal(g.p.hp,6);
});
test('paper cup cannot chain through solid cover but still reaches a clear nearby target',()=>{
 const g=setup(['papercup','split']),e=g.room.enemies[0],blocked=g.spawn('turret',540,294),open=g.spawn('turret',480,375);blocked.hp=open.hp=100;g.room.enemies.push(blocked,open);g.room.obstacles=[{kind:'pillar',x:510,y:294,w:12,h:55,r:6}];g.shoot(1,0);const b=g.bullets[0];g.onBulletHit(e,b);assert.equal(blocked.hp,100);assert.ok(Math.abs(open.hp-99.65)<1e-9);g.onBulletHit(e,g.bullets.at(-1));assert.ok(Math.abs(open.hp-99.65)<1e-9);
});
test('tempura buff expires, does not stack, and shrimp paste extends it without healing or adding resources',()=>{
 const g=setup(['tempura','shrimppaste']);g.shrimpMeals=[{x:300,y:300,sx:300,sy:300,age:1,life:4}];g.p.hp=3;updateMemeFollowers(g,.02);assert.equal(g.tempuraBuff,12);assert.equal(memeDamage(g),1.45);assert.equal(g.p.hp,3);assert.equal(g.coins,0);
 updateMeme(g,6);g.shrimpMeals=[{x:300,y:300,sx:300,sy:300,age:1,life:4}];updateMemeFollowers(g,.02);assert.equal(g.tempuraBuff,12);assert.equal(memeDamage(g),1.45);updateMeme(g,12);assert.equal(memeDamage(g),1);
 g.shrimpMeals=[{x:300,y:300,sx:300,sy:300,age:1,life:.01}];updateMemeFollowers(g,.02);assert.equal(g.tempuraBuff,0);
});
test('wood improves damage while retaining slower cadence and projectile speed; companions are unaffected',()=>{
 const g=setup(['rollwood']);g.shoot(1,0);const b=g.bullets[0];assert.equal(b.damage,1.55);assert.equal(g.attackInterval(),.28*1.25);assert.equal(Math.hypot(b.vx,b.vy),490*.75);g.shoot(1,0,true);assert.equal(g.bullets.at(-1).damage,.65);assert.equal(Math.hypot(g.bullets.at(-1).vx,g.bullets.at(-1).vy),490);
});
