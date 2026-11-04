import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
import {drawPuppetAttack} from '../dist/puppet.js';
const step=(g,n)=>{for(let t=0;t<n-.00001;t+=.02)g.update(.02)};
function setup(cycle=0,rage=false){const g=new Game();g.start();g.floor=4;g.generate();g.enter(g.rooms.find(r=>r.exists&&r.type==='boss').id,'top');const e=g.room.enemies[0];e.x=480;e.y=160;e.puppetCycle=cycle;e.hp=rage?100:e.maxHp;g.p.x=600;g.p.y=400;g.p.inv=999;g.enemyAttack(e);return {g,e}}
test('puppet rotates through four distinct attacks even if every summoned monster dies immediately',()=>{
 const {g,e}=setup();const seen=new Set(['pods']);for(let i=0;i<900;i++){for(const m of g.room.enemies)if(m!==e)m.dead=true;if(e.puppetSkill)seen.add(e.puppetSkill.mode);g.update(.02)}assert.deepEqual([...seen].sort(),['loom','needle','pods','stitch']);assert.ok(e.puppetCycle>=5);
});
test('needle locks each telegraphed volley, then reacquires for the next burst',()=>{
 const {g,e}=setup(1),s=e.puppetSkill,aim=s.aim;g.enemyAttack(e);assert.equal(e.puppetSkill,s);assert.equal(e.puppetCycle,2);
 step(g,.66);assert.equal(g.enemyBullets.length,0);g.p.x=150;step(g,.06);assert.equal(s.fired,1);assert.equal(g.enemyBullets.length,5);assert.equal(s.aim,aim);assert.equal(g.enemySpeed(e),0);
 step(g,.1);assert.notEqual(s.aim,aim);const secondAim=s.aim;g.p.x=800;step(g,.64);assert.equal(s.fired,1);assert.equal(s.aim,secondAim);
 step(g,.06);assert.equal(s.fired,2);step(g,.8);assert.equal(s.fired,3);step(g,.16);assert.equal(e.puppetSkill,null);assert.ok(g.enemySpeed(e)>0);
});
test('half health adds a fourth seven-needle volley with a fresh aim warning',()=>{const {g,e}=setup(1,true),s=e.puppetSkill;step(g,.72);assert.equal(g.enemyBullets.length,7);step(g,2.4);assert.equal(s.fired,4)});
test('stitch cross has a harmless warning and safe quadrants, but hurts on its active strips',()=>{
 for(const safe of [false,true]){const {g,e}=setup(2);g.p.inv=0;step(g,.9);assert.equal(g.p.hp,6);if(safe){g.p.x+=90;g.p.y+=90}step(g,.1);assert.equal(g.p.hp,safe?6:5);assert.equal(e.puppetSkill.x,600);assert.equal(e.puppetSkill.y,400)}
});
test('rage stitch retargets only between waves and gives another full warning',()=>{
 const {g,e}=setup(2,true);step(g,1.3);g.p.x=260;g.p.y=350;step(g,.32);const s=e.puppetSkill;assert.equal(s.wave,1);assert.equal(s.x,260);assert.equal(s.y,350);g.p.inv=0;step(g,.9);assert.equal(g.p.hp,6);step(g,.08);assert.equal(g.p.hp,5);step(g,.65);assert.equal(e.puppetSkill.wave,2);step(g,1.6);assert.equal(e.puppetSkill,null);
});
test('pause freezes skill timing and death cancels active stitching and pending summons',()=>{
 const {g,e}=setup(2);const time=e.puppetSkill.t;g.mode='paused';step(g,1);assert.equal(e.puppetSkill.t,time);g.mode='play';g.effects.push({type:'dollPod',owner:e,life:.5,max:.5,x:300,y:300,radius:75,spawnType:'brute'});g.damageEnemy(e,999);step(g,.6);assert.equal(e.puppetSkill,null);assert.equal(g.effects.filter(f=>f.type==='dollPod').length,0);assert.equal(g.room.enemies.filter(m=>m!==e&&!m.dead).length,0);
});
test('needle and stitching cues draw finite geometry before and after activation',()=>{
 const labels=[],ctx=new Proxy({}, {get:(_,key)=>(...args)=>{for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a));if(key==='fillText')labels.push(args[0])},set:()=>true});for(const cycle of [1,2]){const {g}=setup(cycle);drawPuppetAttack(ctx,g);step(g,1);drawPuppetAttack(ctx,g)}assert.ok(labels.some(s=>s.includes('蓄势')));assert.ok(labels.includes('缝合！'));
});
