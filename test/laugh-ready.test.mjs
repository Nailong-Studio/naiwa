import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
import {updateActive} from '../dist/combat-content.js';
import {updateLaughReady,drawLaughReady} from '../dist/laugh-ready.js';
const fresh=()=>{const g=new Game();g.start();return g};
test('readiness announces actual charge crossing once and clears on release',()=>{
 const g=fresh();updateLaughReady(g,.02);g.activeCharge=44;assert.equal(updateLaughReady(g,.02).ready,false);
 const e=g.spawn('brute',600,300);g.damageEnemy(e,1);
 assert.equal(updateLaughReady(g,.02).flash,.8);assert.equal(updateLaughReady(g,.4).flash,.4);
 assert.equal(updateLaughReady(g,1).flash,0);assert.equal(updateLaughReady(g,.02).flash,0);
 updateActive(g,.02,{active:true});assert.equal(g.activeCharge,0);assert.equal(updateLaughReady(g,.02).ready,false);
 g.activeCharge=g.activeCost();assert.equal(updateLaughReady(g,.02).flash,.8);
 assert.equal(updateLaughReady(fresh(),.02).ready,false);
});
test('pause freezes the cue; shop and reduced charge cost can make it ready on return',()=>{
 const g=fresh();g.activeCharge=30;updateLaughReady(g,.02);g.mode='choice';g.items.push('battery');
 assert.equal(updateLaughReady(g,1).ready,false);g.mode='play';assert.equal(updateLaughReady(g,.02).flash,.8);
 g.mode='paused';assert.equal(updateLaughReady(g,10).flash,.8);g.mode='play';assert.equal(updateLaughReady(g,.3).flash,.5);
});
test('visual is bounded, static in reduced motion, hidden outside play, and never mutates combat',()=>{
 const g=fresh();g.activeCharge=45;updateLaughReady(g,.02);let count=0;
 const c={save(){},restore(){},fillRect(...a){assert.ok(a.every(Number.isFinite));count++}};
 drawLaughReady(c,g,true);const still=count;assert.ok(still>0);count=0;drawLaughReady(c,g,false);assert.ok(count>still);
 g.mode='dead';count=0;drawLaughReady(c,g);assert.equal(count,0);assert.equal(g.activeCharge,45);assert.equal(g.p.hp,6);
});
