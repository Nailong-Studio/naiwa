import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
import {milkPool} from '../dist/combat-content.js';

function setup(floor){const g=new Game();g.start();g.floor=floor;g.generate();g.enter(g.rooms.find(r=>r.exists&&r.type==='boss').id,'top');g.p.inv=999;return g}
const step=(g,n)=>{for(let t=0;t<n;t+=.02)g.update(.02)};

test('bosses survive opening bombs plus active laugh and retain full damage from attacks',()=>{
 for(let floor=1;floor<=5;floor++){
  const g=setup(floor);
  for(const e of g.room.enemies){const hp=e.hp;g.damageEnemy(e,50);assert.equal(e.hp,hp-50);assert.ok(!e.dead&&e.hp>=50)}
 }
});
test('bosses are not slowed by their own milk, while grounded ordinary enemies are',()=>{
 const g=setup(1),e=g.room.enemies[0];milkPool(g,e.x,e.y);assert.equal(g.moveScale(e),1);
 const m=g.spawn('brute',e.x,e.y);assert.ok(g.moveScale(m)<1);
});
test('collector speeds up below half health without losing the two normal then triple pattern',()=>{
 const g=setup(1),e=g.room.enemies[0];g.enemyAttack(e);const normal=e.cd;e.hp=e.maxHp*.4;g.enemyAttack(e);assert.ok(e.cd<normal);g.enemyAttack(e);assert.equal(e.bottleCount,3);assert.equal(e.bottleBurst.left,2);
});
test('speaker recovery is shorter at half health but never interrupts its own attack',()=>{
 const g=setup(2),e=g.room.enemies[0];g.enemyAttack(e);const recovery=e.cd-e.sound.duration;
 e.hp=e.maxHp*.4;e.soundCycle=3;g.enemyAttack(e);assert.ok(e.cd>e.sound.duration);assert.ok(e.cd-e.sound.duration<recovery);
});
test('puppet attacks when summons are capped and in-flight pods count toward the cap',()=>{
 const g=setup(4),e=g.room.enemies[0];e.hp=e.maxHp*.4;
 for(let i=0;i<3;i++)g.room.enemies.push(g.spawn('brute',150+i*100,150));
 g.enemyAttack(e);assert.equal(g.effects.filter(f=>f.type==='dollPod').length,2);
 e.puppetCycle=0;g.enemyAttack(e);assert.equal(g.effects.filter(f=>f.type==='dollPod').length,2);assert.equal(e.puppetSkill.mode,'needle');assert.equal(g.enemyBullets.length,0);step(g,.72);assert.equal(e.puppetSkill.fired,1);assert.equal(g.effects.filter(f=>f.type==='dollPod').length,2);
});
test('final villains start apart and enter a stronger solo phase without healing',()=>{
 const g=setup(5),[bull,mouse]=g.room.enemies;assert.ok(Math.abs(bull.cd-mouse.cd)>=.7);
 g.enemyAttack(mouse);assert.equal(mouse.finalSkill.traps.length,3);const hp=mouse.hp;
 g.damageEnemy(bull,999);step(g,.04);assert.ok(mouse.enraged);assert.equal(mouse.hp,hp);mouse.finalCycle=0;g.enemyAttack(mouse);assert.equal(mouse.finalSkill.traps.length,4);
});
