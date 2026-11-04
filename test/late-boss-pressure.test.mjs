import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
import {drawContent} from '../dist/content-art.js';
import {terrainProjectile} from '../dist/terrain.js';
const step=(g,n,input={})=>{for(let t=0;t<n-.00001;t+=.02)g.update(.02,input)};
function setup(floor,rage=false){
 const g=new Game();g.start();g.floor=floor;g.generate();g.enter(g.rooms.find(r=>r.exists&&r.type==='boss').id,'top');
 for(const e of g.room.enemies){e.cd=999;if(rage)e.hp=e.maxHp*.4}
 g.p.x=620;g.p.y=400;g.p.inv=999;const e=g.room.enemies[0];e.x=220;e.y=150;return {g,e};
}
test('catcher follows with two or three smashes, each locking a new target with a full warning',()=>{
 for(const rage of [false,true]){const {g,e}=setup(3,rage);e.handCycle=1;g.enemyAttack(e);e.cd=999;
  const h=e.hands;assert.equal(h.total,rage?3:2);step(g,.85);g.p.x=780;g.p.y=480;step(g,.37);
  assert.equal(h.wave,1);assert.equal(h.x,780);assert.equal(h.y,480);const x=h.x;
  g.p.x=200;g.p.inv=0;const hp=g.p.hp;step(g,.74);assert.equal(h.placed,false);assert.equal(h.x,x);step(g,.1);assert.equal(g.p.hp,hp);
  step(g,rage?1.6:.4);assert.equal(e.hands,null);
 }
});
test('cargo shots persist after natural hand retraction but boss death clears them',()=>{
 const {g,e}=setup(3);e.x=480;e.y=110;g.p.x=480;g.p.y=490;e.handCycle=3;g.enemyAttack(e);e.cd=999;step(g,4.32);
 assert.equal(e.hands,null);assert.ok(g.enemyBullets.some(b=>b.catcherPressure===e));g.damageEnemy(e,999);step(g,.02);assert.ok(!g.enemyBullets.some(b=>b.catcherPressure===e));
});
test('rage cargo fires more volleys with wider fans while leaving one cargo lane open',()=>{
 const {g,e}=setup(3,true);e.handCycle=3;g.enemyAttack(e);e.cd=999;const h=e.hands;step(g,1.72);
 assert.equal(g.enemyBullets.filter(b=>b.catcherPressure===e).length,5);assert.ok(g.effects.filter(f=>f.type==='cargoWave').every(f=>f.y!==[180,300,420][h.safe]));step(g,3.2);assert.equal(h.pressureCount,4);
});
test('puppet combines a warned pod with the next stitch and never exceeds its summon budget',()=>{
 const {g,e}=setup(4,true);e.puppetCycle=2;g.enemyAttack(e);e.cd=999;step(g,1.32);
 const pod=g.effects.find(f=>f.type==='dollPod');assert.ok(pod&&pod.life>.9);assert.equal(g.room.enemies.length,1);assert.equal(e.puppetSkill.mode,'stitch');
 g.p.x=150;g.p.y=450;step(g,.32);assert.equal(e.puppetSkill.wave,1);assert.ok(g.effects.includes(pod));step(g,.7);assert.ok(g.room.enemies.some(m=>m.summoned));
 while(g.room.enemies.filter(m=>!m.dead&&m!==e).length<5)g.room.enemies.push(g.spawn('brute',800,150));step(g,1);
 assert.equal(g.effects.filter(f=>f.type==='dollPod'&&f.life>0&&!f.landed).length,0);assert.equal(g.room.enemies.filter(m=>!m.dead&&m!==e).length,5);
});
test('puppet death removes its needles even when summoned enemies keep the room in combat',()=>{
 const {g,e}=setup(4);g.room.enemies.push(g.spawn('brute',800,150));e.puppetCycle=1;g.enemyAttack(e);step(g,.72);assert.ok(g.enemyBullets.some(b=>b.puppetOwner===e));
 g.damageEnemy(e,999);step(g,.02);assert.equal(g.room.clear,false);assert.ok(!g.enemyBullets.some(b=>b.puppetOwner===e));
});
test('joint fight keeps bull charging three times, with a fresh warning on every path',()=>{
 const {g,e}=setup(5);g.room.finalFight={next:0,pending:false,combo:null};step(g,.02);const s=e.finalSkill;assert.equal(s.total,3);
 for(let wave=0;wave<3;wave++){assert.equal(s.wave,wave);const x=e.x,y=e.y;step(g,.98);assert.equal(e.x,x);assert.equal(e.y,y);g.p.x=wave%2?250:700;g.p.y=wave%2?400:200;step(g,.84)}
 assert.equal(e.finalSkill,null);assert.ok(g.room.finalFight.combo);assert.ok(g.room.finalFight.combo.gap-120>=60);step(g,.8);assert.equal(g.room.finalFight.combo,null);
});
test('final fan reacquires between bursts but cannot chase a player during its warning',()=>{
 const {g,e}=setup(5);e.finalCycle=2;g.enemyAttack(e);const s=e.finalSkill;step(g,.72);const first=s.aim;
 g.p.x=180;g.p.y=480;step(g,.16);assert.notEqual(s.aim,first);const locked=s.aim;g.p.x=800;step(g,.6);assert.equal(s.fired,1);assert.equal(s.aim,locked);
 step(g,.04);assert.equal(s.fired,2);const shot=g.enemyBullets.filter(b=>b.finalOwner===e).at(-3);assert.ok(Math.abs(Math.atan2(shot.vy,shot.vx)-locked)<1e-6);
});
test('bull falling debris pressures distant players but moving away avoids it',()=>{
 for(const dodge of [false,true]){const {g,e}=setup(5);e.finalCycle=1;g.p.x=800;g.p.y=450;g.p.inv=0;g.enemyAttack(e);step(g,.2);const rock=e.finalSkill.debris[0];assert.equal(rock.x,800);assert.equal(rock.y,450);
  step(g,.8,dodge?{mx:-1}:{});assert.equal(g.p.hp,6);step(g,.1,dodge?{mx:-1}:{});assert.equal(g.p.hp,dodge?6:5);
 }
});
test('rage mouse repeats traps at a new location and warns before the second activation',()=>{
 const {g}=setup(5,true),mouse=g.room.enemies[1];g.enemyAttack(mouse);const s=mouse.finalSkill;step(g,2.3);g.p.x=220;g.p.y=450;step(g,.22);
 assert.equal(s.wave,1);assert.equal(s.traps[0].x,220);g.p.inv=0;step(g,.9);assert.equal(g.p.hp,6);step(g,.12);assert.equal(g.p.hp,5);
});
test('new pursuit cues stay finite, freeze when paused and vanish on owner death',()=>{
 const labels=[],ctx=new Proxy({}, {get:(_,key)=>(...args)=>{for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a));if(key==='fillText')labels.push(args[0])},set:()=>true});
 for(const floor of [3,4,5]){const {g,e}=setup(floor,true);if(floor===3)e.handCycle=1;else if(floor===4)e.puppetCycle=2;else e.finalCycle=1;g.enemyAttack(e);step(g,.3);drawContent(ctx,g,0);const before=JSON.stringify([e.hands?.t,e.puppetSkill?.t,e.finalSkill?.t]);g.mode='paused';step(g,1);assert.equal(JSON.stringify([e.hands?.t,e.puppetSkill?.t,e.finalSkill?.t]),before);g.mode='play';g.damageEnemy(e,999);step(g,.02);drawContent(ctx,g,0)}
 assert.ok(labels.some(t=>t.includes('追击砸手')));assert.ok(labels.some(t=>t.includes('落石预警')));
});
test('catcher smash threatens all four distant corners but a warned move escapes',()=>{
 for(const [x,y] of [[70,75],[890,75],[70,525],[890,525]])for(const dodge of [false,true]){
  const {g,e}=setup(3);g.p.x=x;g.p.y=y;g.p.inv=0;e.handCycle=1;g.enemyAttack(e);e.cd=999;
  step(g,.78,dodge?{my:y<300?1:-1}:{});assert.equal(g.p.hp,6);
  step(g,.06);assert.equal(g.p.hp,dodge?6:5,`${x},${y}, dodge=${dodge}`);
 }
});
test('catcher sweep reaches top and bottom corners and preserves its central opening',()=>{
 for(const [x,y] of [[70,75],[890,75],[70,525],[890,525],[480,300]]){
  const {g,e}=setup(3);g.p.x=x;g.p.y=y;g.p.inv=0;e.handCycle=2;g.enemyAttack(e);e.cd=999;
  step(g,.86);assert.equal(g.p.hp,6);step(g,.08);assert.equal(g.p.hp,x===480?6:5);
 }
});
test('catcher aimed pressure reaches the opposite corner without vanishing at hand retraction',()=>{
 const {g,e}=setup(3);e.x=115;e.y=115;g.p.x=890;g.p.y=525;g.p.inv=0;e.handCycle=2;g.enemyAttack(e);e.cd=999;
 step(g,1.1);g.room.hazards=[]; // Isolate the aimed shot from hand and belt contact.
 g.p.inv=999;step(g,1.7);g.p.x=890;g.p.y=525;g.p.inv=0;const hp=g.p.hp;
 step(g,2.7);assert.ok(g.p.hp<hp);assert.equal(e.hands,null);
});
test('catcher bullets pass their own arms but other shots and walls retain collision',()=>{
 const {g,e}=setup(3),hand={kind:'hand',owner:e,x:400,y:300,w:62,h:174,r:32};g.room.obstacles=[hand];
 const b={x:400,y:300,r:6,vx:245,vy:0,life:4.5,catcherPressure:e};
 assert.equal(terrainProjectile(g,b,true),false);assert.equal(terrainProjectile(g,{...b,catcherPressure:null},true),true);
 assert.equal(terrainProjectile(g,b,false),true);g.room.obstacles=[{...hand,kind:'pillar'}];assert.equal(terrainProjectile(g,b,true),true);
});
