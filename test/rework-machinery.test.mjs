import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
import {CHAPTER_LAYOUTS} from '../dist/chapter-content.js';
import {hazardActive,updateGround} from '../dist/combat-content.js';
import {craneArms} from '../dist/crane-gates.js';
import {overlaps} from '../dist/terrain.js';
const step=(g,n)=>{for(let t=0;t<n;t+=.02)g.update(.02)};
function boss(floor,cycle,rage=false){const g=new Game();g.start();g.floor=floor;g.generate();g.enter(g.rooms.find(r=>r.exists&&r.type==='boss').id,'top');g.p.inv=999;g.p.x=600;g.p.y=350;const e=g.room.enemies[0];e.x=300;e.y=130;e.hp=rage?e.maxHp*.4:e.maxHp;e.handCycle=e.puppetCycle=cycle;g.enemyAttack(e);e.cd=999;return {g,e}}
test('ordinary chapter layouts keep cover but have no persistent floor hazards or devices',()=>{
 for(const layouts of CHAPTER_LAYOUTS)for(const l of layouts){assert.equal(l.hazards,undefined,l.id);const obstacles=l.build();assert.ok(obstacles.length,l.id);assert.ok(obstacles.every(o=>!o.device),l.id)}
 for(let floor=1;floor<=5;floor++)for(let seed=1;seed<=10;seed++){
  let state=seed;const g=new Game(()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296));g.floor=floor;g.generate();
  for(const room of g.rooms){assert.equal((room.hazards||[]).length,0);assert.ok(room.obstacles.every(o=>!o.device))}
 }
});

test('press warning is harmless, activation hurts both enemies and player, clear rooms disable machinery',()=>{
 const g=new Game();g.start();const h={kind:'press',x:480,y:300,w:120,h:160,phase:0};g.room.hazards=[h];g.room.clear=false;g.room.enteredAt=-4.5;g.p.inv=0;const e=g.spawn('brute',480,300);e.hp=20;g.room.enemies=[e];g.elapsed=.75;assert.equal(hazardActive(g,h),false);updateGround(g,.02);assert.equal(g.p.hp,6);g.elapsed=.85;updateGround(g,.02);assert.equal(g.p.hp,5);assert.equal(e.hp,16);updateGround(g,.02);assert.equal(e.hp,16);g.room.clear=true;g.p.inv=0;updateGround(g,.02);assert.equal(g.p.hp,5);
});
test('crane gate provides a player-width hole, locks it during the warning and lets a bomb cancel all pressure',()=>{
 const {g,e}=boss(3,0);const h=e.hands,locked=h.gap;g.p.y=480;step(g,.9);assert.equal(g.room.obstacles.length,0);assert.equal(h.gap,locked);step(g,.45);assert.equal(g.room.obstacles.length,2);assert.ok(craneArms(h).every(a=>!overlaps(a,h.x,locked,g.p.r+16)));assert.ok(g.enemyBullets.every(b=>Math.abs(b.y-locked)>94));const a=g.room.obstacles[0];g.boom(a.x,a.y,70);step(g,.04);assert.equal(e.hands,null);assert.equal(g.enemyBullets.length,0);assert.ok(e.handDisabled>0);
});
test('loom alternates top/bottom volleys through a 200px escape corridor and adds one warned pod',()=>{
 for(const rage of [false,true]){const {g,e}=boss(4,3,rage),s=e.puppetSkill;step(g,.94);assert.equal(g.enemyBullets.length,0);step(g,.1);assert.ok(g.enemyBullets.length>10);assert.ok(g.enemyBullets.every(b=>b.vy>0&&Math.abs(b.x-s.x)>100));step(g,.28);assert.ok(g.effects.some(f=>f.type==='dollPod'&&f.life>.8));step(g,.48);assert.ok(g.enemyBullets.some(b=>b.vy<0));g.damageEnemy(e,999);step(g,.04);assert.equal(g.enemyBullets.length,0);assert.equal(e.puppetSkill,null)}
});
test('rivet gun and chapter-four shooter aim, wind up, then emit three shots from their weapon side',()=>{
 for(const type of ['loader','shooter']){const g=new Game();g.start();g.floor=4;g.room.clear=false;g.p.x=750;g.p.y=300;const e=g.spawn(type,400,300);g.room.enemies=[e];g.enemyAttack(e);e.cd=999;step(g,.4);assert.equal(g.enemyBullets.length,0);assert.ok(e.gunCast);step(g,.06);assert.equal(g.enemyBullets.length,3);assert.ok(g.enemyBullets.every(b=>b.x>e.x));assert.equal(e.gunCast,null)}
});
