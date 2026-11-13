import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
import {sandyActive,afterChronoStep,chronoStep} from '../dist/chrono-items.js';
const advance=(g,seconds,input={})=>{for(let i=0;i<Math.round(seconds/.02);i++)g.update(.02,input)};
function setup(ids=['sandevistan']){const g=new Game(()=>.42);g.start();g.items.push(...ids);g.room.type='fight';g.room.clear=false;g.room.obstacles=[];g.room.hazards=[];g.room.enemies=[g.spawn('turret',800,130)];g.room.enemies[0].cd=999;g.room.enemies[0].hp=99999;g.p.x=300;g.p.y=400;g.p.inv=0;return g}
test('Sandevistan triggers only on actual nonlethal health loss in uncleared rooms, once per room',()=>{
 const g=setup();g.p.shield=true;g.hurt();assert.ok(!sandyActive(g));g.p.inv=0;g.hurt();assert.equal(g.p.hp,5);assert.equal(g.sandy.left,3);g.p.inv=0;g.hurt();assert.equal(g.p.hp,5);advance(g,3.02);assert.ok(!sandyActive(g));g.p.inv=0;g.hurt();assert.equal(g.p.hp,4);assert.ok(!sandyActive(g));const lethal=setup();lethal.p.hp=1;lethal.hurt();assert.equal(lethal.mode,'dead');assert.ok(!sandyActive(lethal));const safe=setup();safe.room.clear=true;safe.hurt();assert.ok(!sandyActive(safe));
});
test('world and hostile projectile clocks slow while player and normal shots retain real time',()=>{
 const g=setup();g.hurt();g.enemyBullets=[{x:400,y:200,vx:200,vy:0,r:5,life:10}];g.shoot(1,0);const shot=g.bullets[0],sx=shot.x;advance(g,.5,{mx:1});assert.ok(g.elapsed<.1);assert.ok(g.enemyBullets[0].x<420);assert.ok(Math.abs(g.p.x-448.5)<.01);assert.ok(Math.abs(shot.x-sx-245)<.01);assert.ok(g.room.enemies[0].cd>998.9);assert.ok(g.sandyTrails.length>=6&&g.sandyTrails.length<=18);
});
test('pause freezes duration and trails; transition clears effect; revisits cannot reset allowance',()=>{
 const g=setup();g.hurt();advance(g,.3,{mx:1});const left=g.sandy.left,x=g.p.x,time=g.actionClock;g.mode='paused';advance(g,4,{mx:1});assert.equal(g.sandy.left,left);assert.equal(g.p.x,x);assert.equal(g.actionClock,time);g.mode='play';const id=g.roomId;g.enter(g.rooms.find(r=>r.exists&&r.id!==id&&r.type==='fight').id,'top');assert.equal(g.sandy,null);assert.equal(g.sandyTrails.length,0);g.enter(id,'top');g.p.inv=0;g.hurt();assert.ok(!sandyActive(g));
});
test('boss telegraph and hazard clock cannot jump forward during dilation or restoration',()=>{
 const g=setup();g.floor=4;const e=g.makeBoss('puppet',480,180);e.puppetCycle=3;g.room.enemies=[e];g.enemyAttack(e);e.cd=999;g.hurt();advance(g,1);assert.ok(e.puppetSkill.t<.3);assert.equal(g.enemyBullets.length,0);advance(g,2.04);assert.ok(!sandyActive(g));assert.ok(e.puppetSkill.t<1);advance(g,.5);assert.ok(g.enemyBullets.length>0);
});
test('zero elapsed time stays finite and clearing a room cannot recreate a split during an ongoing dash',()=>{
 const g=setup(['sandevistan','gojohalf']);g.hurt();assert.equal(chronoStep(g,0),1);assert.equal(g.sandy.left,3);g.p.dash=.2;g.room.clear=true;afterChronoStep(g,.02,{x:300,y:400});assert.ok(!g.gojo);
});
test('player homing steering uses real time during Sandevistan',()=>{
 const normal=setup(['homing']),fast=setup(['homing','sandevistan']);fast.hurt();normal.shoot(1,0);fast.shoot(1,0);normal.update(.02);fast.update(.02);assert.ok(Math.abs(normal.bullets[0].vx-fast.bullets[0].vx)<.0001);assert.ok(Math.abs(normal.bullets[0].vy-fast.bullets[0].vy)<.0001);
});
test('Sandevistan speeds up player attack cadence instead of slowing the shot cooldown with the world',()=>{
 const normal=setup([]),fast=setup();fast.hurt();let a=0,b=0;const shootA=normal.shoot.bind(normal),shootB=fast.shoot.bind(fast);normal.shoot=(...args)=>{a++;shootA(...args)};fast.shoot=(...args)=>{b++;shootB(...args)};advance(normal,1,{fire:true,ax:1});advance(fast,1,{fire:true,ax:1});assert.equal(a,4);assert.equal(b,10);
});