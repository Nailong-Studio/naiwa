import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
import {drawFinalFight} from '../dist/final-boss.js';
const step=(g,n)=>{for(let t=0;t<n-.00001;t+=.02)g.update(.02)};
function setup(){const g=new Game();g.start();g.floor=5;g.generate();g.enter(g.rooms.find(r=>r.exists&&r.type==='boss').id,'top');const [bull,mouse]=g.room.enemies;bull.x=220;bull.y=300;mouse.x=780;mouse.y=150;bull.cd=mouse.cd=999;g.p.x=600;g.p.y=300;g.p.inv=999;return {g,bull,mouse}}
test('both final bosses rotate three skills and eventually coordinate in the real update loop',()=>{
 const {g,bull,mouse}=setup(),seen={bull:new Set(),meishu:new Set()};bull.cd=1.4;mouse.cd=2.2;let combo=false;
 for(let i=0;i<1800;i++){g.update(.02);for(const e of [bull,mouse])if(e.finalSkill)seen[e.kind].add(e.finalSkill.mode);combo||=!!g.room.finalFight?.combo}
 assert.ok(combo);for(const mode of ['charge','stomp','fan'])assert.ok(seen.bull.has(mode),mode);for(const mode of ['traps','cross','fan','curtain'])assert.ok(seen.meishu.has(mode),mode);assert.equal(bull.maxHp,280);assert.equal(mouse.maxHp,250);
});
test('each bull charge locks a telegraphed path, travels far, and warns again before retargeting',()=>{
 const {g,bull}=setup();g.enemyAttack(bull);const s=bull.finalSkill,x=bull.x;step(g,.76);assert.equal(bull.x,x);g.p.y=480;assert.equal(s.ty,300);step(g,.6);assert.ok(bull.x-x>300);step(g,.22);assert.equal(s.wave,1);assert.ok(s.age<=.04);assert.ok(s.ty>300);const nextX=bull.x,nextY=bull.y;step(g,.76);assert.equal(bull.x,nextX);assert.equal(bull.y,nextY);step(g,.85);assert.equal(bull.finalSkill,null);
});
test('charge sweep hits an intersecting player and the charged laugh interrupts it',()=>{
 const {g,bull}=setup();g.p.x=460;g.p.inv=0;g.enemyAttack(bull);step(g,.76);assert.equal(g.p.hp,6);step(g,.4);assert.equal(g.p.hp,5);g.activeCharge=g.activeCost();g.p.x=bull.x+100;g.p.y=bull.y;g.update(.02,{active:true});assert.equal(bull.finalSkill,null);assert.ok(bull.repelled>0);
});
test('stomp hurts only the expanding band and dash invulnerability can cross it',()=>{
 for(const dash of [false,true]){const {g,bull}=setup();bull.finalCycle=1;g.p.x=bull.x+160;g.p.inv=0;g.enemyAttack(bull);step(g,.8);assert.equal(g.p.hp,6);if(dash)g.p.inv=1;step(g,.45);assert.equal(g.p.hp,dash?6:5)}
});
test('mouse traps warn before damage and do not follow the player after lock',()=>{
 const {g,mouse}=setup();g.p.inv=0;g.enemyAttack(mouse);const traps=mouse.finalSkill.traps;step(g,.9);assert.equal(g.p.hp,6);step(g,.12);assert.equal(g.p.hp,5);g.p.x=300;g.p.y=450;g.p.inv=0;step(g,.55);assert.equal(g.p.hp,5);assert.equal(traps[0].x,600);
});
test('mouse cross and both fan attacks warn and emit several separated volleys',()=>{
 for(const who of ['bull','mouse']){const state=setup(),{g}=state,e=state[who];e.finalCycle=2;g.enemyAttack(e);step(g,.66);assert.equal(g.enemyBullets.length,0);step(g,.06);assert.equal(e.finalSkill.fired,1);assert.equal(g.enemyBullets.length,who==='bull'?5:7);step(g,1.6);assert.equal(e.finalSkill.fired,3)}
 const {g,mouse}=setup();mouse.finalCycle=1;g.enemyAttack(mouse);step(g,.8);assert.equal(g.enemyBullets.length,0);step(g,.08);assert.equal(g.enemyBullets.length,4);const first=Math.atan2(g.enemyBullets[0].vy,g.enemyBullets[0].vx);step(g,.25);assert.equal(mouse.finalSkill.fired,2);assert.ok(Math.abs(Math.atan2(g.enemyBullets[4].vy,g.enemyBullets[4].vx)-first-.2)<.001);
});
test('combined curtain waits for existing skills, leaves a wide gap and does not overlap new attacks',()=>{
 const {g,bull,mouse}=setup();g.enemyAttack(bull);g.room.finalFight={next:0,pending:false,combo:null};step(g,.1);assert.equal(g.room.finalFight.combo,null);assert.ok(g.room.finalFight.pending);step(g,3.1);assert.ok(g.room.finalFight.combo);assert.equal(mouse.finalSkill.mode,'curtain');const gap=g.room.finalFight.combo.gap;step(g,1.3);const wall=g.enemyBullets.filter(b=>b.finalCombo);assert.ok(wall.length);assert.ok(wall.every(b=>Math.abs(b.y-gap)>120));assert.ok(240>2*(bull.r+2*g.p.r+7));const skill=mouse.finalSkill;g.enemyAttack(mouse);assert.equal(mouse.finalSkill,skill);step(g,5);assert.equal(g.room.finalFight.combo,null);
});
test('partner death cancels the joint attack, cleans hostile ownership and strengthens either survivor',()=>{
 for(const survivor of ['bull','mouse']){const state=setup(),{g,bull,mouse}=state,alive=state[survivor],dead=survivor==='bull'?mouse:bull;g.room.finalFight={next:0,pending:false,combo:null};step(g,1.3);assert.ok(g.enemyBullets.some(b=>b.finalCombo));g.damageEnemy(dead,999);step(g,.02);assert.ok(alive.enraged);assert.equal(g.room.finalFight.combo,null);assert.ok(g.enemyBullets.every(b=>!b.finalCombo&&b.finalOwner!==dead));alive.finalCycle=0;g.enemyAttack(alive);assert.equal(survivor==='bull'?alive.finalSkill.total:alive.finalSkill.traps.length,survivor==='bull'?3:4);g.damageEnemy(alive,999);step(g,.02);assert.equal(g.mode,'rescue');assert.equal(g.enemyBullets.length,0);assert.equal(alive.finalSkill,null)}
});
test('pausing freezes the combo and all final-boss cues render finite geometry',()=>{
 const {g,bull,mouse}=setup();const labels=[],ctx=new Proxy({}, {get:(_,key)=>(...args)=>{for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a));if(key==='fillText')labels.push(args[0])},set:()=>true});
 for(const e of [bull,mouse])for(let cycle=0;cycle<3;cycle++){e.finalSkill=null;e.finalCycle=cycle;g.enemyAttack(e);drawFinalFight(ctx,g);step(g,1);drawFinalFight(ctx,g);e.finalSkill=null;e.cd=999}
 g.room.finalFight={next:0,pending:false,combo:null};step(g,.02);const t=g.room.finalFight.combo.t;g.mode='paused';step(g,2);assert.equal(g.room.finalFight.combo.t,t);drawFinalFight(ctx,g);assert.ok(labels.some(s=>s.includes('弹墙通道')));
});
