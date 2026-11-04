import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';

function measure(type,floor){
 const g=new Game(()=>.42);g.start();g.floor=floor;g.room.type='fight';g.room.clear=false;g.room.obstacles=[];g.room.hazards=[];g.p.x=750;g.p.y=300;
 const e=g.spawn(type,250,300);e.attack=999;e.cd=999;e.beatDelay=999;g.room.enemies=[e];g.update(.04);
 return {speed:Math.hypot(e.x-250,e.y-300)/.04,g,e};
}
test('actual combat-room movement keeps distinct tiers relative to the starting player',()=>{
 for(const floor of [1,5]){
  const speeds=Object.fromEntries(['runner','hopper','brute','shooter'].map(type=>[type,measure(type,floor).speed]));
  assert.ok(speeds.runner>speeds.hopper);assert.ok(speeds.hopper>speeds.brute);assert.ok(speeds.brute>speeds.shooter);
  assert.ok(speeds.brute>=220*.6&&speeds.brute<220*.75);
  assert.ok(speeds.hopper>=220*.79&&speeds.hopper<220*.9);
  assert.ok(speeds.runner>=220*.95&&speeds.runner<=220*1.08);
 }
});
test('each chapter has a pursuing melee threat without converting turrets into chasers',()=>{
 for(const [type,floor,minRatio] of [['milkleak',1,.69],['milkSkater',1,.72],['beatling',2,.74],['forklift',3,.54],['stitchling',4,.84],['scrapMine',4,.79],['jailer',5,.92]]){
  const {speed,g}=measure(type,floor);assert.ok(speed>=g.p.speed*minRatio,type);if(type==='scrapMine'){assert.ok(speed>g.p.speed&&speed<g.p.speed*1.1)}else assert.ok(speed<g.p.speed,type);
 }
 for(const type of ['turret','milkspitter','soundTurret','dollTurret','warden','echoBell','prismEye'])assert.equal(measure(type,5).speed,0,type);
});
test('late melee follows a fleeing base-speed player closely without unavoidable contact',()=>{
 const {g,e}=measure('jailer',5);g.p.x=500;e.x=200;const gap=g.p.x-e.x;
 for(let i=0;i<25;i++)g.update(.04,{mx:1});
 assert.ok(g.p.x-e.x>gap);assert.ok(g.p.x-e.x-gap<25);assert.equal(g.p.hp,6);
});

test('hopper stops to telegraph before a faster lunge, then slows down',()=>{
 const g=new Game();g.start();g.p.x=800;g.p.y=300;
 const e=g.spawn('hopper',200,300);g.room.enemies=[e];
 for(let i=0;i<15;i++)g.update(.04);
 assert.equal(e.x,200);assert.ok(e.wind>0);assert.ok(Math.abs(e.dx-1)<.001);
 g.update(.04);const x=e.x;g.update(.04);
 const lunge=e.x-x;assert.ok(lunge>20);
 for(let i=0;i<12;i++)g.update(.04);
 const settled=e.x;g.update(.04);assert.ok(e.x-settled<lunge*.5);
});

test('fast enemies join ordinary and challenge rooms without respawning on revisit',()=>{
 for(const floor of [1,3,5]){
  const g=new Game();g.start();g.floor=floor;g.generate();
  const id=g.rooms.find(r=>r.exists&&r.type==='fight').id;g.enter(id,'top');
  assert.ok(g.room.enemies.filter(e=>e.type==='runner').length<=1);
  for(const e of g.room.enemies)g.damageEnemy(e,999);g.update(.02);
  const enemies=g.room.enemies;g.enter(12,'top');g.enter(id,'top');
  assert.equal(g.room.enemies,enemies);assert.ok(g.room.enemies.every(e=>e.dead));
  g.enter(g.rooms.find(r=>r.exists&&r.type==='challenge').id,'top');
  assert.ok(g.room.enemies.filter(e=>e.type==='runner').length<=1);
 }
});
