import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
import {mobAttack,updateMobs,mobSpeed} from '../dist/chapter-mobs.js';
import {beginBeat,conductSquad,updateSoundMobs,drawSoundMobs} from '../dist/sound-mobs.js';
function setup(type='beatling'){
 const g=new Game();g.start();g.floor=2;g.generate();g.room.clear=false;g.room.obstacles=[];g.room.hazards=[];
 g.p.x=800;g.p.y=200;g.p.inv=999;const e=g.spawn(type,250,200);e.cd=999;g.room.enemies=[e];return {g,e};
}
const step=(g,n)=>{for(let t=0;t<n-.00001;t+=.02)g.update(.02)};
test('beat rush has a stationary warning, locked heading and stationary recovery',()=>{
 const {g,e}=setup();beginBeat(g,e);step(g,.6);assert.equal(e.x,250);assert.equal(mobSpeed(g,e),0);
 g.p.y=450;step(g,.2);assert.ok(e.x>275);assert.equal(e.y,200);
 step(g,.2);const x=e.x;step(g,.3);assert.equal(e.x,x);assert.ok(e.beat);step(g,.12);assert.equal(e.beat,null);
});
test('beat rush respects solid obstacles',()=>{
 const {g,e}=setup();g.room.obstacles=[{kind:'pillar',x:320,y:200,w:40,h:250,r:20}];beginBeat(g,e);step(g,1);
 assert.ok(e.x>250&&e.x<=300-e.r+.01);assert.equal(e.y,200);
});
test('repelling a drummer interrupts its charge without erasing knockback',()=>{
 const {g,e}=setup();beginBeat(g,e);e.repelled=.4;e.vx=-200;e.vy=80;updateSoundMobs(g,.1);
 assert.equal(e.beat,null);assert.equal(e.vx,-200);assert.equal(e.vy,80);assert.equal(e.beatDelay,1.1);
});
test('conductor orders at most three fresh attacks and leaves a full rush warning',()=>{
 const {g,e}=setup('conductor');const allies=Array.from({length:4},(_,i)=>g.spawn('beatling',280+i*20,200));g.room.enemies.push(...allies);
 conductSquad(g,e);assert.equal(allies.filter(m=>m.beat).length,3);assert.ok(allies.every(m=>m.rallied===2));
 updateSoundMobs(g,.5);assert.ok(allies.slice(0,3).every(m=>m.vx===0&&m.beat.t===.5));
 e.dead=true;updateSoundMobs(g,.1);assert.ok(allies.slice(0,3).every(m=>!m.beat&&m.rallied===0));
});
test('conductor accelerates idle sound casters but respects range, bosses and active casts',()=>{
 const {g,e}=setup('conductor');const bell=g.spawn('echoBell',300,200),busy=g.spawn('echoBell',310,200),far=g.spawn('beatling',700,200),boss=g.makeBoss('collector',300,220);
 bell.cd=9;busy.cd=7;busy.mobCast={kind:'echo'};g.room.enemies.push(bell,busy,far,boss);conductSquad(g,e);
 assert.equal(bell.cd,.35);assert.equal(busy.cd,7);assert.ok(!far.beat);assert.ok(!boss.rallied);assert.ok(!bell.mobCast);
});
test('echo volley pauses visibly and reverses along its original trajectory',()=>{
 const {g,e}=setup('echoBell');mobAttack(g,e);updateMobs(g,.66);const b=g.enemyBullets[0];const vx=b.vx,vy=b.vy;
 assert.equal(g.enemyBullets.length,1);assert.equal(b.echoOwner,e);g.p.y=450;
 updateSoundMobs(g,1.4);assert.equal(b.vx,0);assert.equal(b.vy,0);assert.ok(b.echoTurning);
 updateSoundMobs(g,.3);assert.equal(b.vx,-vx);assert.equal(b.vy,-vy);assert.ok(b.echoReturned);assert.equal(b.echoTurning,false);
 e.dead=true;updateSoundMobs(g,.1);assert.equal(b.life,0);
});
test('sound warnings and returning bullets render finite geometry and distinct cues',()=>{
 const {g,e}=setup();beginBeat(g,e);const calls=[];const ctx=new Proxy({}, {get:(_,key)=>(...args)=>{args.filter(a=>typeof a==='number').forEach(a=>assert.ok(Number.isFinite(a)));calls.push([key,...args])},set:()=>true});
 drawSoundMobs(ctx,g);e.beat.t=1;g.enemyBullets.push({echoOwner:e,life:2,x:400,y:200,r:7,echoTurning:true});drawSoundMobs(ctx,g);
 assert.ok(calls.some(c=>c[0]==='fillText'&&c[1].includes('侧移')));assert.ok(calls.some(c=>c[0]==='fillText'&&c[1].includes('破绽')));assert.ok(calls.some(c=>c[0]==='fillText'&&c[1]==='返'));
});
