import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
import {CHAPTER_LAYOUTS,ENCOUNTERS} from '../dist/chapter-content.js';
import {milkPool,STATIONARY} from '../dist/combat-content.js';
import {blocked,spawnEncounter} from '../dist/terrain.js';
const step=(g,seconds,input={})=>{for(let t=0;t<seconds-.0001;t+=.02)g.update(.02,input)};
function boss(floor){const g=new Game();g.start();g.floor=floor;g.generate();g.enter(g.rooms.find(r=>r.exists&&r.type==='boss').id,'top');const e=g.room.enemies[0];e.x=200;e.y=150;e.cd=100;e.chargeCD=100;e.attack=100;g.p.x=800;g.p.y=450;g.p.inv=100;return {g,e}}

test('each chapter retains distinct cover layouts and varied enemy mixes without floor machinery',()=>{
 for(let floor=1;floor<=5;floor++){const g=new Game();g.start();g.floor=floor;g.generate();
  for(const layout of CHAPTER_LAYOUTS[floor-1])assert.ok(g.rooms.some(r=>r.layoutId===layout.id));
  for(const room of g.rooms.filter(r=>r.layoutId))assert.equal(room.hazards.length,0);
  const room=g.rooms.find(r=>r.layoutId);let fast=0,stationary=0;
  for(let variant=0;variant<8;variant++){room.seed=0;room.encounterProfile=variant;const enemies=spawnEncounter(g,room);fast+=enemies.filter(e=>e.type==='runner').length;stationary+=enemies.filter(e=>STATIONARY.has(e.type)).length;assert.ok(enemies.every(e=>ENCOUNTERS[floor-1][variant].includes(e.type)))}
  assert.equal(fast,2);assert.ok(stationary>=3);
 }
});
test('stationary turrets fire more frequently than moving shooters, while brutes have no frontal shield',()=>{
 const shots=[];for(const type of ['turret','shooter']){const g=new Game();g.start();g.p.x=850;g.p.y=450;const e=g.spawn(type,200,150);e.cd=0;g.room.enemies=[e];step(g,1.8);shots.push(g.enemyBullets.length);if(type==='turret'){assert.equal(e.x,200);assert.equal(e.y,150)}else assert.ok(e.x>200)}assert.ok(shots[0]>shots[1]);
 const g=new Game(),e=g.spawn('shield',200,200);assert.equal(e.type,'brute');assert.equal(g.bulletDamage(e,{x:220,y:200,damage:2,pierce:false}),2);
});
test('collector fires two normal bottles then three independently aimed enhanced bottles',()=>{
 const {g,e}=boss(1);g.enemyAttack(e);assert.equal(g.effects.filter(f=>f.type==='milkBottle').length,1);g.effects=[];g.enemyAttack(e);assert.equal(g.effects.length,1);g.effects=[];g.enemyAttack(e);
 g.p.x=700;step(g,.28);g.p.x=600;step(g,.28);const bottles=g.effects.filter(f=>f.type==='milkBottle');assert.equal(bottles.length,3);assert.deepEqual(bottles.map(b=>b.x),[800,700,600]);assert.ok(bottles.every(b=>b.radius===135));
});
test('collector long charge covers more distance, has a longer cooldown and leaves temporary milk',()=>{
 const {g,e}=boss(1);e.x=180;e.y=300;g.p.x=820;g.p.y=300;e.chargeCD=0;e.cd=100;step(g,.82);assert.equal(e.x,180);step(g,.7);assert.ok(e.x>500);assert.ok(e.chargeCD>4);assert.ok(g.effects.some(f=>f.type==='milkPool'&&f.max===4));
});
test('milk hurts and expires; boots protect; filter and foam affect attacks',()=>{
 const g=new Game();g.start();g.p.hp=g.p.maxHp=20;g.p.inv=0;milkPool(g,g.p.x,g.p.y,false,30,.5);step(g,.1);assert.equal(g.p.hp,19);step(g,.6);assert.ok(!g.effects.some(f=>f.type==='milkPool'));
 g.items.push('milkboots','milkfilter','milkfoam');g.p.inv=0;milkPool(g,g.p.x,g.p.y,false,30,2);step(g,.1);assert.equal(g.p.hp,19);assert.equal(g.moveScale(g.p),1);g.shoot(1,0);assert.equal(g.bullets.at(-1).damage,1.4);
 g.random=()=>.1;const e=g.spawn('brute',600,300);g.onBulletHit(e,{pet:false,split:false});assert.ok(g.effects.some(f=>f.type==='milkPool'&&f.friendly));
});
test('speaker phase two leap marks a landing, becomes airborne, lands with area damage and dense bullets',()=>{
 const {g,e}=boss(2);e.hp=e.maxHp*.4;e.soundCycle=3;g.p.inv=0;g.enemyAttack(e);const hp=e.hp;g.damageEnemy(e,5);assert.equal(e.hp,hp);assert.ok(e.airborne);assert.equal(g.enemyBullets.length,0);
 const target={x:e.sound.targetX,y:e.sound.targetY};step(g,.86);assert.equal(e.airborne,false);assert.ok(Math.hypot(e.x-target.x,e.y-target.y)<1);assert.equal(g.p.hp,5);assert.ok(g.enemyBullets.length>=20);
});
test('catcher blocks the sides with hands, leaves an escape route and bombs retract both arms',()=>{
 const {g,e}=boss(3);g.p.x=600;g.p.y=300;g.enemyAttack(e);step(g,.6);assert.equal(g.room.obstacles.length,0);step(g,.4);assert.equal(g.room.obstacles.filter(o=>o.kind==='hand').length,2);
 assert.equal(blocked(g.room,600,300,21),false);assert.equal(blocked(g.room,600,180,21),true);step(g,1.2);assert.ok(e.hands.fired>=2);
 const hand=g.room.obstacles.find(o=>o.kind==='hand');g.boom(hand.x,hand.y,80);assert.equal(g.room.obstacles.filter(o=>o.kind==='hand').length,0);assert.ok(e.handDisabled>=3);step(g,.1);assert.equal(e.hands,null);
});
test('catcher hand smash warns, then rotates to a warned gate instead of instant radial spam',()=>{
 const {g,e}=boss(3);e.handCycle=1;g.p.inv=0;g.enemyAttack(e);step(g,.6);assert.equal(g.p.hp,6);step(g,.3);assert.equal(g.p.hp,5);
 step(g,1.55);e.handCycle=4;g.enemyBullets=[];g.enemyAttack(e);assert.equal(g.enemyBullets.length,0);assert.equal(e.hands.mode,'gate');step(g,1.32);assert.ok(g.enemyBullets.length>0);
});
test('puppet pods deal area damage and leave a living monster, with a summon cap',()=>{
 const {g,e}=boss(4);g.p.inv=0;g.enemyAttack(e);assert.equal(g.effects.filter(f=>f.type==='dollPod').length,1);step(g,.8);assert.equal(g.room.enemies.length,1);step(g,.25);assert.equal(g.room.enemies.length,2);assert.equal(g.p.hp,5);assert.ok(g.room.enemies[1].summoned);
 g.effects=[];while(g.room.enemies.length<6)g.room.enemies.push(g.spawn('brute',400,200));g.enemyAttack(e);assert.equal(g.effects.filter(f=>f.type==='dollPod').length,0);
});
test('active laugh releases immediately while moving, with smaller damage and range',()=>{
 const g=new Game();g.start();g.items.push('spillcup');g.p.inv=100;g.activeCharge=g.activeCost();const near=g.spawn('brute',600,300),far=g.spawn('turret',700,300);near.hp=near.maxHp=far.hp=far.maxHp=50;far.cd=100;g.room.enemies=[near,far];const x=g.p.x;
 g.update(.02,{active:true,mx:1});assert.ok(g.p.x>x);assert.equal(near.hp,46);assert.equal(far.hp,50);assert.equal(g.activeCharge,0);assert.ok(g.effects.some(f=>f.type==='milkPool'&&f.friendly));assert.ok(g.effects.some(f=>f.type==='laugh'&&f.radius===160));
});
test('dash retains a short invulnerability window after movement ends',()=>{
 const g=new Game();g.start();g.p.inv=0;g.update(.02,{dash:true,mx:1});step(g,.24);assert.equal(g.p.dash,0);assert.ok(g.p.inv>0);g.hurt();assert.equal(g.p.hp,6);step(g,.2);g.hurt();assert.equal(g.p.hp,5);
});
test('shop supplies consume coins, give resources without passive items, and reject wasted healing',()=>{
 const g=new Game();g.start();g.enter(g.rooms.find(r=>r.exists&&r.type==='shop').id,'top');g.coins=9;g.offer('shop');assert.ok(g.choose('supply_key'));assert.equal(g.keys,2);assert.equal(g.coins,6);assert.equal(g.items.length,0);
 g.offer('shop');assert.equal(g.choose('supply_heart'),false);assert.equal(g.coins,6);g.p.hp=3;assert.ok(g.choose('supply_heart'));assert.equal(g.p.hp,5);assert.equal(g.coins,3);g.offer('shop');assert.ok(g.choose('supply_bomb'));assert.equal(g.bombs,3);assert.equal(g.coins,0);
});
