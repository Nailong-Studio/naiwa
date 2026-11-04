import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
import {milkPool,updateGround} from '../dist/combat-content.js';
import {updateFollowers} from '../dist/follower-combat.js';
function setup(ids=[]){const g=new Game(()=>.42);g.start();g.items=ids;g.room.type='fight';g.room.clear=false;g.room.obstacles=[];g.room.hazards=[];g.p.inv=999;g.enemySpeed=()=>0;const e=g.spawn('turret',600,300);e.hp=100;e.cd=999;g.room.enemies=[e];return g}
test('overlapping friendly milk has a bounded pool count and one damage tick per target',()=>{
 const g=setup(),e=g.room.enemies[0],other=g.spawn('turret',620,300);other.hp=100;g.room.enemies.push(other);
 for(let i=0;i<30;i++)milkPool(g,600,300,true);assert.equal(g.effects.length,8);
 updateGround(g,.02);assert.ok(Math.abs(e.hp-98.8)<1e-9);assert.equal(e.hp,other.hp);
 milkPool(g,600,300,true);g.elapsed=.2;updateGround(g,.2);assert.ok(Math.abs(e.hp-98.8)<1e-9);
 g.elapsed=.51;updateGround(g,.31);assert.ok(Math.abs(e.hp-97.6)<1e-9);
});
test('rapid poison refreshes cannot accelerate the poison damage clock',()=>{
 function damage(refresh){const g=setup(),e=g.room.enemies[0];e.poison=3;e.poisonTick=.1;
  for(let i=0;i<50;i++){if(refresh)g.bullets.push({x:e.x,y:e.y,vx:0,vy:0,r:7,life:1,damage:0,poison:true,bounce:0,hits:new Set()});g.update(.02,{})}return 100-e.hp}
 assert.ok(Math.abs(damage(false)-.9)<1e-9);assert.ok(Math.abs(damage(true)-damage(false))<1e-9);
});
test('turtle preserves orbit speed and continuously blocks every contacting projectile',()=>{
 const g=setup(['turtle']);g.elapsed=.5;updateFollowers(g,0);const s=g.followerStates.turtle;
 assert.ok(Math.abs(s.x-g.p.x-Math.cos(1)*56)<1e-9);
 const cluster=()=>Array.from({length:10},()=>({x:s.x+32,y:s.y,r:6}));
 const miss={x:s.x+40,y:s.y,r:6};g.enemyBullets=[...cluster(),miss];updateFollowers(g,0);assert.deepEqual(g.enemyBullets,[miss]);
 g.enemyBullets=cluster();updateFollowers(g,0);assert.equal(g.enemyBullets.length,0);
 assert.equal(g.effects.filter(f=>f.type==='petBlock').length,2,'one visual burst per batch, not per bullet');
});
test('shrimp healing cannot be farmed by repeating the same room clear callback',()=>{
 const g=setup(['shrimppaste']);g.p.hp=2;g.room.clear=true;for(let i=0;i<20;i++)g.onRoomCleared(g.room);assert.equal(g.shrimpClears,1);assert.equal(g.p.hp,2);
});
test('Gojo cooldown persists across rooms and faster repeated jumps cannot refresh the split',()=>{
 const g=setup(['gojohalf','feet']);g.update(.02,{dash:true,mx:1});const ready=g.gojoReadyAt;
 for(let i=0;i<190;i++)g.update(.02,{dash:i%50===0,mx:i%100<50?1:-1,fire:true,ax:1});assert.equal(g.gojo,null);assert.equal(g.gojoReadyAt,ready);
 g.enter(g.rooms.find(r=>r.exists&&r.type==='fight'&&r.id!==g.roomId).id,'top');g.p.dashCD=0;g.update(.02,{dash:true,mx:1});assert.equal(g.gojo,null);assert.equal(g.gojoReadyAt,ready);
});
