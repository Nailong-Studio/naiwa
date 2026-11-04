import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
import {CHAPTER_MOBS,mobAttack,updateMobs} from '../dist/chapter-mobs.js';
import {MECHANIC_LAYOUTS} from '../dist/mechanic-layouts.js';
import {hazardEnabled,updateDevices} from '../dist/chapter-mechanics.js';
import {spawnEncounter,terrainProjectile} from '../dist/terrain.js';
import {drawMob,drawMobCues} from '../dist/mob-art.js';
import {drawContent} from '../dist/content-art.js';
import {drawTerrain} from '../dist/terrain-art.js';
const step=(g,n)=>{for(let t=0;t<n-.00001;t+=.02)g.update(.02)};
function setup(type){const g=new Game();g.start();g.room.clear=false;g.p.x=800;g.p.y=450;g.p.inv=999;const e=g.spawn(type,250,200);e.cd=99;g.room.enemies=[e];return {g,e}}
function mechanic(floor,index=0){const g=new Game();g.start();g.floor=floor;g.generate();const r=g.rooms.find(r=>r.layoutId===MECHANIC_LAYOUTS[floor-1][index].id);g.enter(r.id,'top');const layout=MECHANIC_LAYOUTS[floor-1][index];r.obstacles=layout.build();r.hazards=layout.hazards?.()||[];g.p.inv=999;for(const e of r.enemies)e.cd=999;return g}

test('every chapter includes its species across the eight encounter profiles',()=>{
 for(let f=1;f<=5;f++){const g=new Game();g.floor=f;g.generate();const r=g.rooms.find(r=>r.type==='fight'&&r.exists),types=new Set();for(let variant=0;variant<8;variant++){r.seed=0;r.crowdingPenalty=0;r.encounterProfile=variant;const mobs=spawnEncounter(g,r);assert.equal(mobs.length,5+f);mobs.forEach(e=>types.add(e.type))}for(const [id,d] of Object.entries(CHAPTER_MOBS))if(d.chapter===f)assert.ok(types.has(id))}
});
test('curdling death has a warning before milk, and milk skaters accelerate only on milk',()=>{
 const {g,e}=setup('curdling');g.room.enemies.push(g.spawn('turret',200,450));g.damageEnemy(e,99);step(g,.5);assert.equal(g.effects.filter(f=>f.type==='milkPool').length,0);step(g,.25);assert.ok(g.effects.some(f=>f.type==='milkPool'));
 const skate=g.spawn('milkSkater',e.x,e.y);assert.equal(g.enemySpeed(skate)*g.moveScale(skate),205);skate.x=800;assert.equal(g.enemySpeed(skate),145);
});
test('echo shots lock their heading, wait for warning, and stop if the caster dies',()=>{
 const {g,e}=setup('echoBell');mobAttack(g,e);const aim=e.mobCast.aim;g.p.x=100;g.p.y=400;step(g,.6);assert.equal(g.enemyBullets.length,0);step(g,.1);assert.equal(g.enemyBullets.length,1);assert.ok(Math.abs(Math.atan2(g.enemyBullets[0].vy,g.enemyBullets[0].vx)-aim)<1e-9);g.damageEnemy(e,99);updateMobs(g,.4);assert.equal(e.mobCast,null);
});
test('conductor buffs only nearby ordinary allies, and the buff expires',()=>{
 const {g,e}=setup('conductor'),near=g.spawn('brute',300,200),far=g.spawn('brute',800,200),boss=g.makeBoss('collector',300,220);g.room.enemies.push(near,far,boss);mobAttack(g,e);updateMobs(g,.8);assert.equal(near.rallied,2);assert.ok(!far.rallied);assert.ok(!boss.rallied);assert.equal(g.moveScale(near),1.3);updateMobs(g,2.1);assert.equal(g.moveScale(near),1);
});
test('parcel impact warns and hurts in an area; killing its owner cancels it',()=>{
 for(const kill of [false,true]){const {g,e}=setup('parcelThrower');g.p.inv=0;mobAttack(g,e);if(kill)g.damageEnemy(e,99);step(g,.8);assert.equal(g.p.hp,6);step(g,.3);assert.equal(g.p.hp,kill?6:5)}
});
test('forklift locks its rush and cannot pass through a solid wall',()=>{
 const {g,e}=setup('forklift');g.p.x=800;g.p.y=200;g.room.obstacles=[{kind:'pillar',x:400,y:200,w:48,h:300,r:24}];mobAttack(g,e);step(g,.7);assert.equal(e.x,250);g.p.y=450;step(g,.5);assert.ok(e.x>300&&e.x<360);assert.ok(Math.abs(e.y-200)<10);
});
test('medic heals only after channel and killing it interrupts; scrap explosions can be prevented',()=>{
 for(const kill of [false,true]){const {g,e}=setup('stitchMedic'),m=g.spawn('turret',300,200);m.hp=1;m.cd=999;g.room.enemies.push(m);mobAttack(g,e);step(g,.8);assert.equal(m.hp,1);if(kill)g.damageEnemy(e,99);step(g,.2);assert.equal(m.hp,kill?1:3)}
 for(const kill of [false,true]){const {g,e}=setup('scrapMine');g.p.x=330;g.p.y=200;g.p.inv=0;step(g,.1);assert.equal(g.p.hp,6);if(kill)g.damageEnemy(e,99);step(g,.3);assert.equal(g.p.hp,kill?6:5);assert.ok(e.dead);assert.equal(g.effects.some(f=>f.type==='bombBlast'),!kill)}
});

test('scrap mine detonates on the movement frame that makes contact, with one damage application',()=>{
 const {g,e}=setup('scrapMine');g.room.obstacles=[];g.room.hazards=[];g.p.x=e.x+e.r+g.p.r-5+4;g.p.y=e.y;g.p.inv=0;
 const charge=g.activeCharge;let calls=0;const hurt=g.hurt.bind(g);g.hurt=()=>{calls++;hurt()};g.update(.04);
 assert.ok(e.dead);assert.equal(g.p.hp,5);assert.equal(calls,1);assert.equal(g.activeCharge,charge);assert.equal(g.effects.filter(f=>f.type==='bombBlast').length,1);
 step(g,.2);assert.equal(calls,1);assert.equal(g.kills,1);
});

test('scrap contact still explodes against shield or invulnerability without a second contact hit',()=>{
 for(const protection of ['shield','inv']){const {g,e}=setup('scrapMine');g.p.x=e.x;g.p.y=e.y;g.p.inv=protection==='inv'?1:0;g.p.shield=protection==='shield';g.update(.02);assert.ok(e.dead);assert.equal(g.p.hp,6);assert.equal(g.p.shield,false);assert.equal(g.effects.filter(f=>f.type==='bombBlast').length,1)}
});

test('scrap mines keep chasing inside the former fuse radius and do not detonate across a pillar',()=>{
 const {g,e}=setup('scrapMine');g.p.x=365;g.p.y=200;const x=e.x;step(g,.1);assert.ok(e.x>x+18);assert.ok(!e.mobCast);assert.ok(!e.dead);
 e.x=250;e.y=200;g.p.x=320;g.p.y=200;g.room.obstacles=[{kind:'pillar',x:285,y:200,w:30,h:300,r:15}];g.p.inv=0;step(g,.3);assert.ok(!e.dead);assert.equal(g.p.hp,6);
});
test('prison sentry leaves a temporary hazard and prism eye rotates a four-shot cross',()=>{
 const {g,e}=setup('lockSentry');g.p.inv=0;mobAttack(g,e);step(g,.7);assert.equal(g.p.hp,6);step(g,.2);assert.equal(g.p.hp,5);step(g,1.5);assert.equal(g.effects.filter(f=>f.type==='mobZone').length,0);
 const eye=g.spawn('prismEye',250,200);g.room.enemies=[eye];mobAttack(g,eye);const a=eye.mobCast.aim;updateMobs(g,.81);assert.equal(g.enemyBullets.length,4);mobAttack(g,eye);assert.notEqual(eye.mobCast.aim,a);
});
test('linked sound and prison hazards shut off when shot, recover, and can also be bombed',()=>{
 for(const floor of [2,5]){const g=mechanic(floor),o=g.room.obstacles.find(o=>o.device),h=g.room.hazards.find(h=>h.channel===o.channel);assert.ok(hazardEnabled(g,h));for(let i=0;i<4;i++)terrainProjectile(g,{x:o.x,y:o.y,r:5,damage:1},false);assert.equal(hazardEnabled(g,h),false);updateDevices(g,3.9);assert.equal(hazardEnabled(g,h),false);updateDevices(g,.2);assert.ok(hazardEnabled(g,h));g.boom(o.x,o.y,60);assert.equal(hazardEnabled(g,h),false);assert.ok(g.room.obstacles.includes(o))}
});
test('conveyors push vertically and reverse direction after four seconds',()=>{
 const g=mechanic(3,1),h=g.room.hazards[0];g.p.x=h.x;g.p.y=h.y;g.elapsed=g.room.enteredAt+1;const a=g.groundDrift(g.p);assert.equal(a.x,0);assert.equal(a.y,110);g.elapsed+=4;assert.equal(g.groundDrift(g.p).y,-110);
});
test('assembly devices respect population and production limits and stay destroyed on revisit',()=>{
 const g=mechanic(4),id=g.roomId,o=g.room.obstacles.find(o=>o.kind==='assembler');g.room.enemies=g.room.enemies.slice(0,6);for(let i=0;i<5;i++)updateDevices(g,7);assert.equal(g.room.enemies.filter(e=>!e.dead).length,8);assert.equal(o.spawned,2);g.room.enemies[0].dead=true;updateDevices(g,7);assert.equal(o.spawned,3);g.room.enemies[1].dead=true;updateDevices(g,7);assert.equal(o.spawned,3);g.hitDevice(o,6);assert.ok(!g.room.obstacles.includes(o));g.enter(12,'top');g.enter(id,'top');assert.ok(!g.room.obstacles.some(o=>o.kind==='assembler'));
});
test('milk valves clear hostile pools and leave friendly milk, with no repeated activation',()=>{
 const g=mechanic(1),o=g.room.obstacles.find(o=>o.kind==='milkValve');g.effects.push({type:'milkPool',x:o.x,y:o.y,radius:30,life:4,max:4,friendly:false});g.hitDevice(o,4);assert.ok(g.effects.every(f=>f.type!=='milkPool'||f.friendly));assert.ok(!g.room.obstacles.includes(o));
});
test('new enemies, cues and all mechanic layouts render finite canvas geometry',()=>{
 const calls=[];const ctx=new Proxy({}, {get:(_,key)=>(...args)=>{for(const arg of args)if(typeof arg==='number')assert.ok(Number.isFinite(arg));calls.push([key,...args])},set:()=>true});
 for(const type of Object.keys(CHAPTER_MOBS)){const {g,e}=setup(type);mobAttack(g,e);updateMobs(g,.1);drawMob(ctx,e);drawMobCues(ctx,g)}
 for(let f=1;f<=5;f++)for(let i=0;i<2;i++){const g=mechanic(f,i);drawTerrain(ctx,g.room,f);drawContent(ctx,g,0)}
 assert.ok(calls.some(c=>c[0]==='fillText'&&String(c[1]).includes('供电柱')));assert.ok(calls.some(c=>c[0]==='fillText'&&String(c[1]).includes('换向')));
});
