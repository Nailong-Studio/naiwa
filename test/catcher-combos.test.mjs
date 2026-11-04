import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
import {drawCatcherCombos} from '../dist/catcher-combos.js';
const step=(g,n)=>{for(let t=0;t<n-.00001;t+=.02)g.update(.02)};
function setup(cycle){const g=new Game();g.start();g.floor=3;g.generate();g.enter(g.rooms.find(r=>r.exists&&r.type==='boss').id,'top');const e=g.room.enemies[0];e.x=480;e.y=120;e.handCycle=cycle;g.p.inv=999;g.p.x=480;g.p.y=300;g.enemyAttack(e);return {g,e}}
test('catcher arena has two opposing belts and half health accelerates the machinery',()=>{
 const {g,e}=setup(0);assert.equal(e.maxHp,220);assert.equal(g.room.hazards.length,2);assert.equal(g.room.hazards[0].dy,-g.room.hazards[1].dy);assert.equal(g.room.hazards[0].power,65);e.hp=80;step(g,.02);assert.ok(e.catcherRage);assert.equal(g.room.hazards[0].power,100);
});
test('sweep warns first, moves both hands and leaves a body-width central escape lane',()=>{
 const {g,e}=setup(2);assert.equal(e.hands.mode,'sweep');step(g,.8);assert.equal(g.room.obstacles.length,0);step(g,.3);const before=g.room.obstacles.map(o=>o.x);step(g,1);const [left,right]=g.room.obstacles;assert.ok(left.x>before[0]&&right.x<before[1]);assert.ok((right.x-right.w/2)-(left.x+left.w/2)>g.p.r*2+20);step(g,1);assert.equal(e.hands,null);assert.equal(g.room.obstacles.length,0);
});
test('cargo leaves an explicitly safe lane, moves horizontally and adds an opposite second wave at half health',()=>{
 for(const rage of [false,true]){const {g,e}=setup(3);if(rage){e.hp=80;e.hands=null;e.handCycle=3;g.enemyAttack(e)}step(g,.8);assert.equal(g.effects.filter(f=>f.type==='cargoWave').length,0);const safe=e.hands.safe;step(g,.2);const first=g.effects.filter(f=>f.type==='cargoWave');assert.equal(first.length,2);assert.ok(first.every(f=>f.y!==[180,300,420][safe]));const x=first[0].x;step(g,.3);assert.ok(first[0].x>x);step(g,1.1);const waves=g.effects.filter(f=>f.type==='cargoWave');assert.equal(waves.length,rage?4:2);if(rage)assert.ok(waves.some(f=>f.vx<0))}
});
test('bombing a loading hand cancels all cargo, opens a vulnerability window and it expires',()=>{
 const {g,e}=setup(3);step(g,1);const hand=g.room.obstacles[0];g.boom(hand.x,hand.y,80);step(g,.02);assert.equal(e.hands,null);assert.equal(g.room.obstacles.length,0);assert.equal(g.effects.filter(f=>f.type==='cargoWave').length,0);let hp=e.hp;g.damageEnemy(e,4);assert.equal(e.hp,hp-6);e.cd=999;step(g,3.1);hp=e.hp;g.damageEnemy(e,4);assert.equal(e.hp,hp-4);
});
test('cargo hits only intersecting players, stops while paused, and disappears on boss death',()=>{
 const {g,e}=setup(3);step(g,1);const f=g.effects.find(f=>f.type==='cargoWave');g.p.x=f.x;g.p.y=f.y;g.p.inv=0;step(g,.02);assert.equal(g.p.hp,5);g.mode='paused';const x=f.x;step(g,.3);assert.equal(f.x,x);g.mode='play';g.damageEnemy(e,999);step(g,.02);assert.equal(g.effects.filter(f=>f.type==='cargoWave').length,0);assert.equal(g.room.obstacles.length,0);
});
test('new hand and cargo cues render finite geometry in warning, active and disabled phases',()=>{
 const labels=[],ctx=new Proxy({}, {get:(_,key)=>(...args)=>{for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a));if(key==='fillText')labels.push(args[0])},set:()=>true});
 for(const c of [2,3]){const {g,e}=setup(c);drawCatcherCombos(ctx,g);step(g,1);drawCatcherCombos(ctx,g);e.handDisabled=3;drawCatcherCombos(ctx,g)}assert.ok(labels.includes('货物安全线 · 留意瞄准'));assert.ok(labels.some(s=>s.includes('易伤')));
});

test('cargo pressure locks aim, warns before firing, and bombs cancel pressure as well as cargo',()=>{
 const {g,e}=setup(3);step(g,1.1);assert.ok(e.hands.pressure);const aim=e.hands.pressure.aim;
 g.p.x=750;step(g,.48);assert.equal(g.enemyBullets.filter(b=>b.catcherPressure===e).length,0);assert.equal(e.hands.pressure.aim,aim);
 step(g,.14);const shots=g.enemyBullets.filter(b=>b.catcherPressure===e);assert.equal(shots.length,3);
 assert.ok(Math.abs(Math.atan2(shots[1].vy,shots[1].vx)-aim)<1e-6);
 const hand=g.room.obstacles[0];g.boom(hand.x,hand.y,80);step(g,.02);assert.equal(e.hands,null);assert.equal(g.enemyBullets.filter(b=>b.catcherPressure===e).length,0);
});
test('sweep pressure has a visible wind-up and freezes with pause',()=>{
 const {g,e}=setup(2);step(g,1.1);const wind=e.hands.pressure.wind;g.mode='paused';step(g,.5);assert.equal(e.hands.pressure.wind,wind);g.mode='play';step(g,.62);assert.equal(g.enemyBullets.filter(b=>b.catcherPressure===e).length,3);
});
