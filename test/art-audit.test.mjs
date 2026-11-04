import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,ITEMS} from '../dist/campaign.js';
import {followerPoint,FOLLOWERS,drawFollowers} from '../dist/followers.js';
import {heroFrame} from '../dist/hero-art.js';
import {drawPixelEnemy,drawPixelFloor,drawPixelShot,pixelRing} from '../dist/pixel-art.js';
import {CHAPTER_MOBS} from '../dist/mob-catalog.js';
function random(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}
const ctx=new Proxy({}, {get:()=> (...args)=>{for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a))},set:()=>true});
test('all five chapters remain connected across 250 seeded layouts with free main routes',()=>{
 for(let floor=1;floor<=5;floor++)for(let seed=1;seed<=50;seed++){
  const g=new Game(random(seed));g.floor=floor;g.generate();const reached=new Set([12]),queue=[12];
  while(queue.length)for(const n of g.neighbors(queue.shift())){const r=g.rooms[n];if(r.exists&&!r.locked&&!r.bombLocked&&!reached.has(n)){reached.add(n);queue.push(n)}}
  for(const type of ['boss','shop','challenge'])assert.ok(reached.has(g.rooms.find(r=>r.exists&&r.type===type).id),`${floor}:${seed}:${type}`);
 }
});
test('combined-item combat stays finite with bounded projectiles through all chapters and both phases',()=>{
 for(let floor=1;floor<=5;floor++)for(const rage of [false,true]){
  const g=new Game(random(floor*7+Number(rage)));g.start();g.floor=floor;g.generate();
  for(const item of ITEMS){g.mode='choice';g.choices=[item];g.choose(item.id)}
  g.enter(g.rooms.find(r=>r.exists&&r.type==='boss').id,'top');g.p.inv=999;g.p.hp=g.p.maxHp;
  for(const e of g.room.enemies){e.maxHp=100000;e.hp=rage?40000:100000}
  for(let frame=0;frame<1200;frame++){
   g.update(.02,{mx:Math.cos(frame/90),my:Math.sin(frame/90),fire:true,auto:true,dash:frame%150===0,active:frame%60===0});g.events=[];
   for(const a of [g.p,...g.room.enemies,...g.bullets,...g.enemyBullets])for(const key of ['x','y'])assert.ok(Number.isFinite(a[key]),`${floor}:${key}`);
   assert.ok(g.bullets.length<400);assert.ok(g.enemyBullets.length<400);assert.ok(g.room.enemies.filter(e=>!e.dead).length<=6);assert.ok(g.p.hp>=0&&g.p.hp<=g.p.maxHp);
  }
 }
});

test('all-item builds survive the new burst/ghost combination across five boss rooms and recover normal cadence',()=>{
 for(let floor=1;floor<=5;floor++){
  const g=new Game(random(floor+90));g.start();g.floor=floor;g.generate();
  for(const item of ITEMS){g.mode='choice';g.choices=[item];g.choose(item.id)}
  g.enter(g.rooms.find(r=>r.exists&&r.type==='boss').id,'top');
  for(const e of g.room.enemies){e.maxHp=100000;e.hp=100000}
  const interval=g.attackInterval();g.p.inv=0;g.p.shield=false;g.p.hp=g.p.maxHp;g.hurt();assert.ok(g.sandy?.left>0);assert.ok(g.room.enemies.every(e=>e.ghostMarkedUntil>0));
  for(let frame=0;frame<170;frame++){g.update(.02,{mx:Math.cos(frame/50),my:Math.sin(frame/50),fire:true,ax:1,dash:frame%100===0,active:frame%60===0});g.events=[];assert.ok(g.attackInterval()>0);for(const b of [...g.bullets,...g.enemyBullets])assert.ok([b.x,b.y,b.vx,b.vy].every(Number.isFinite));assert.ok(g.bullets.length<400);assert.ok(g.phoebeWires.length<=3)}
  assert.equal(g.sandy.left,0);assert.ok(g.room.enemies.every(e=>e.ghostMarkedUntil>g.actionClock));assert.ok(g.attackInterval()>=interval*.5);
 }
});
test('egg winds up before firing and dog damages only after physical contact',()=>{
 const g=new Game();g.start();g.items.push('egg','dog');g.room.clear=false;const e=g.spawn('turret',640,300);e.hp=e.maxHp=100;e.cd=999;g.room.enemies=[e];
 g.update(.02);assert.equal(g.bullets.length,0);assert.equal(e.hp,100);
 for(let i=0;i<14;i++)g.update(.02);
 const b=g.bullets.find(b=>b.pet),egg=followerPoint(g,'egg');assert.ok(b);assert.ok(Math.hypot(b.x-egg.x,b.y-egg.y)<50);
 let impact;for(let i=0;i<40&&!impact;i++){g.update(.02);impact=g.effects.find(f=>f.type==='petImpact')}
 assert.ok(impact);const dog=followerPoint(g,'dog');assert.ok(Math.hypot(impact.x-e.x,impact.y-e.y)<e.r+12);assert.ok(Math.hypot(impact.x-dog.x,impact.y-dog.y)<15);
});
test('hero animation prioritizes hurt, jump and landing while staying inside the sheet',()=>{
 const g=new Game();g.elapsed=1;g.heroMoving=true;assert.ok(heroFrame(g)>=4&&heroFrame(g)<8);g.heroLaughUntil=2;assert.ok(heroFrame(g)>=8&&heroFrame(g)<12);g.heroLandUntil=2;assert.equal(heroFrame(g),14);g.p.dash=.2;assert.equal(heroFrame(g),12);g.p.dash=.1;assert.equal(heroFrame(g),13);g.heroHurtUntil=2;assert.equal(heroFrame(g),15);
});
test('pixel roster, every chapter palette and follower/effect geometry render without invalid values',()=>{
 const g=new Game();g.start();g.items.push(...FOLLOWERS);for(let floor=1;floor<=5;floor++){g.floor=floor;drawPixelFloor(ctx,g.room,floor)}
 for(const type of [...Object.keys(CHAPTER_MOBS),'brute','hopper','runner','milkleak','milkspitter','turret','soundTurret','loader','dollTurret','stitchling','tiny','warden','jailer'])drawPixelEnemy(ctx,g.spawn(type,300,250),1);
 for(const kind of ['collector','speaker','catcher','puppet','bull','meishu'])drawPixelEnemy(ctx,g.makeBoss(kind,300,250),1);
 drawFollowers(ctx,g);for(const hostile of [false,true])drawPixelShot(ctx,{x:300,y:250,vx:250,vy:100,r:7},hostile);pixelRing(ctx,400,300,160,'#fff');
});
