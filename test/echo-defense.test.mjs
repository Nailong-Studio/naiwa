import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
import {hitVoice} from '../dist/voice-builds.js';
import {updateMemeFollowers} from '../dist/meme-followers.js';
function setup(ids){const g=new Game(()=>.42);g.start();g.items=ids;g.room.type='fight';g.room.clear=false;g.room.obstacles=[];g.room.hazards=[];g.p.inv=999;return g}
test('penguin intercepts incoming threats up to the six-shot budget, leaving outgoing and tangential shots alone',()=>{
 const g=setup(['sweetpenguin']),p=g.p;
 const shot=(x,y,vx,vy)=>({x:p.x+x,y:p.y+y,vx,vy,r:6});
 const far=shot(120,0,-200,0),soon=shot(70,0,-200,0),urgent=shot(45,0,-200,0),away=shot(60,0,200,0),tangent=shot(80,80,-200,0);
 g.enemyBullets=[far,away,tangent,soon,urgent];updateMemeFollowers(g,0);const s=g.memePets.sweetpenguin;s.cd=0;updateMemeFollowers(g,.01);assert.equal(s.phase,'windup');
 updateMemeFollowers(g,.12);assert.equal(g.enemyBullets.length,5);updateMemeFollowers(g,.03);assert.deepEqual(g.enemyBullets,[away,tangent]);assert.equal(s.cd,2.5);assert.equal(g.effects.filter(f=>f.type==='voiceChain').length,3);
});
test('penguin does not spend its full cooldown when a predicted threat has already disappeared',()=>{
 const g=setup(['sweetpenguin']);g.enemyBullets=[{x:g.p.x+80,y:g.p.y,vx:-200,vy:0,r:6}];updateMemeFollowers(g,0);const s=g.memePets.sweetpenguin;s.cd=0;updateMemeFollowers(g,0);g.enemyBullets=[];updateMemeFollowers(g,.2);assert.equal(s.cd,.35);assert.equal(g.effects.length,0);
});
test('returning echo needs an outbound mark and shares one detonation across multi-shot and split children',()=>{
 const g=setup(['returnvoice','double','fanvoice','split']),e=g.spawn('turret',600,300),near=g.spawn('turret',650,300),far=g.spawn('turret',800,300);e.hp=near.hp=far.hp=100;g.room.enemies=[e,near,far];
 g.shoot(1,0);const b=g.bullets[0];hitVoice(g,near,{...b,returning:true});assert.equal(g.effects.filter(f=>f.type==='echoPulse').length,0);
 g.onBulletHit(e,b);assert.ok(e.echoUntil>g.elapsed);assert.equal(near.hp,100);const family=[...g.bullets];assert.ok(family.every(s=>s.echo===b.echo));
 for(const s of family)hitVoice(g,e,{...s,returning:true});assert.equal(g.effects.filter(f=>f.type==='echoPulse').length,1);assert.ok(Math.abs(near.hp-(100-b.damage*.5))<1e-9);assert.equal(e.hp,100);assert.equal(far.hp,100);assert.ok(Math.hypot(near.vx,near.vy)>0);
});
test('echo splash respects walls, airborne targets and bosses; old marks expire',()=>{
 const g=setup(['returnvoice']),e=g.spawn('turret',600,300),blocked=g.spawn('turret',660,300),air=g.spawn('turret',600,350),boss=g.makeBoss('collector',600,250);e.hp=blocked.hp=air.hp=boss.hp=100;air.airborne=true;g.room.enemies=[e,blocked,air,boss];g.room.obstacles=[{kind:'pillar',x:630,y:300,w:12,h:45,r:6}];
 g.shoot(1,0);const b=g.bullets[0];hitVoice(g,e,b);hitVoice(g,e,{...b,returning:true});assert.equal(blocked.hp,100);assert.equal(air.hp,100);assert.ok(boss.hp<100);assert.equal(boss.vx,0);assert.equal(boss.vy,0);
 g.shoot(1,0);const next=g.bullets.at(-1);hitVoice(g,e,next);g.elapsed=2.01;hitVoice(g,e,{...next,returning:true});assert.equal(g.effects.filter(f=>f.type==='echoPulse').length,1);
});
test('an actual outbound and returning shot produces splash damage in the combat loop',()=>{
 const g=setup(['returnvoice']);g.p.x=350;g.p.y=300;g.enemySpeed=()=>0;
 const e=g.spawn('turret',520,294),near=g.spawn('turret',565,330);e.hp=near.hp=100;e.cd=near.cd=999;g.room.enemies=[e,near];g.shoot(1,0);
 let sawMark=false,sawPulse=false;for(let i=0;i<80;i++){g.update(.02,{});sawMark ||= e.echoUntil>g.elapsed;sawPulse ||= g.effects.some(f=>f.type==='echoPulse')}
 assert.ok(sawMark&&sawPulse);assert.ok(Math.abs(e.hp-98.7)<1e-9);assert.ok(Math.abs(near.hp-(100-.65*.5))<1e-9);
});
test('dense crowds cannot take repeated splash from the same volley and each volley has three pulses at most',()=>{
 const g=setup(['returnvoice','double','split']);g.room.enemies=Array.from({length:5},(_,i)=>{const e=g.spawn('turret',600+i*5,300);e.hp=100;return e});g.shoot(1,0);const b=g.bullets[0];
 for(const e of g.room.enemies)hitVoice(g,e,b);for(const e of g.room.enemies)hitVoice(g,e,{...b,returning:true});
 assert.equal(g.effects.filter(f=>f.type==='echoPulse').length,3);for(const e of g.room.enemies)assert.ok(Math.abs(e.hp-(100-b.damage*.5))<1e-9);
});
