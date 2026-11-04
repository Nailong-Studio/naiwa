import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,ITEMS} from '../dist/campaign.js';
import {voiceStats,updateVoice} from '../dist/voice-builds.js';
import {terrainProjectile} from '../dist/terrain.js';
const step=(g,n,input={})=>{for(let t=0;t<n-.0001;t+=.02)g.update(.02,input)};
function game(items=[]){const g=new Game(()=>.1);g.start();g.items=items;g.room.obstacles=[];g.room.hazards=[];g.p.inv=999;g.enemySpeed=()=>0;return g}
test('voice items are obtainable through normal item offers and keep explicit tradeoffs',()=>{
 const g=game();const ids=['fanvoice','heavyvoice','returnvoice'];for(const id of ids){assert.ok(ITEMS.find(i=>i.id===id));assert.ok(g.drawItems(99).some(i=>i.id===id));g.offer('test');g.choices=[ITEMS.find(i=>i.id===id)];assert.ok(g.choose(id));assert.ok(g.has(id))}
 assert.equal(voiceStats(g).shots,3);assert.equal(g.attackInterval(),g.p.rate*1.15*1.8);
});
test('fan shortens range, creates three directions and stacks with double without changing pets',()=>{
 const g=game(['fanvoice','double']);g.shoot(1,0);assert.equal(g.bullets.length,6);assert.equal(new Set(g.bullets.map(b=>Math.atan2(b.vy,b.vx))).size,3);assert.equal(g.bullets.filter(b=>b.vy===0&&Math.abs(b.damage-1.15*.7)<1e-9&&b.life===1.35).length,2);assert.equal(g.bullets.filter(b=>b.vy!==0&&Math.abs(b.damage-.35*.7)<1e-9&&b.life===.42).length,4);assert.ok(Math.abs(g.attackInterval()-.28*1.15)<1e-9);
 g.shoot(1,0,true);const pet=g.bullets.at(-1);assert.ok(pet.pet&&!pet.voice);assert.equal(pet.damage,.65);
});
test('heavy voice changes damage, speed, body and penetration; cadence is used by the combat loop',()=>{
 const g=game(['heavyvoice']);g.update(.02,{fire:true,ax:1});const b=g.bullets[0];assert.equal(b.damage,2.2);assert.equal(b.shotSpeed,270);assert.ok(b.pierce&&b.r>10);assert.equal(g.p.shot,g.attackInterval());step(g,.4,{fire:true,ax:1});assert.equal(g.bullets.length,1);step(g,.14,{fire:true,ax:1});assert.equal(g.bullets.length,2);
});
test('return voice hits the same target once outbound and once returning, then expires at the player',()=>{
 const g=game(['returnvoice']);g.p.y=306;const e=g.spawn('brute',620,300);e.hp=e.maxHp=100;e.cd=999;g.room.enemies=[e];g.shoot(1,0);step(g,1.6);assert.ok(Math.abs(e.hp-98.7)<1e-9);assert.equal(g.bullets.length,0);assert.ok(Math.abs(g.activeCharge-1.3)<1e-9);
});
test('combined fan, heavy, homing, poison, split and returning preserve bounded child shots',()=>{
 const g=game(['fanvoice','heavyvoice','returnvoice','homing','eye','split']);g.shoot(1,0);assert.equal(g.bullets.length,3);const b=g.bullets[0],e=g.spawn('brute',600,300);b.hits.add(e);g.onBulletHit(e,b);assert.equal(g.bullets.length,5);const children=g.bullets.slice(3);assert.ok(children.every(c=>!c.split&&c.poison&&c.homing&&c.returnVoice&&c.hits.has(e)));g.onBulletHit(e,children[0]);assert.equal(g.bullets.length,5);
 const child=children[0];updateVoice(g,child,.3);assert.ok(child.returning&&!child.hits.has(e));child.hits.add(e);updateVoice(g,child,.3);assert.ok(child.hits.has(e),'return cannot reset the hit set repeatedly');
});
test('homing heavy projectiles retain their slow speed instead of accelerating to normal shots',()=>{
 const g=game(['heavyvoice','homing']);const e=g.spawn('brute',800,300);e.cd=999;g.room.enemies=[e];g.shoot(1,0);step(g,.2);assert.ok(Math.hypot(g.bullets[0].vx,g.bullets[0].vy)<=270.01);
});
test('wall and obstacle bounces spend one bounce and combine with milkfoam, with no pet puddles',()=>{
 const g=game(['bubble','milkfoam']);g.p.x=880;g.shoot(1,0);step(g,.04);assert.equal(g.bullets[0].bounce,1);assert.ok(g.effects.some(f=>f.type==='milkPool'&&f.friendly));
 g.effects=[];g.room.obstacles=[{kind:'pillar',x:500,y:300,w:48,h:48,r:24}];const b={x:470,y:300,previousX:450,previousY:300,vx:490,vy:0,r:10,bounce:1,damage:1};assert.equal(terrainProjectile(g,b,false),false);assert.equal(b.vx,-490);assert.equal(b.x,450);assert.equal(b.bounce,0);assert.equal(g.effects.length,1);b.x=470;assert.equal(terrainProjectile(g,b,false),true);assert.equal(g.effects.length,1);
 g.effects=[];g.onBulletBounce({...b,pet:true});assert.equal(g.effects.length,0);
});
test('pausing freezes return timing and changing rooms removes the old voice shots',()=>{
 const g=game(['returnvoice']);g.shoot(1,0);g.mode='paused';step(g,1);assert.equal(g.bullets[0].age,0);g.mode='play';g.enter(g.rooms.find(r=>r.exists&&r.type==='fight').id,'left');assert.equal(g.bullets.length,0);
});
