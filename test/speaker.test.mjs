import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
import {updateSpeaker,drawSpeakerAttack} from '../dist/speaker.js';
function setup(cycle=0,rage=false){const g=new Game();g.start();g.floor=2;g.generate();g.enter(g.rooms.find(r=>r.exists&&r.type==='boss').id,'top');const e=g.room.enemies[0];e.x=300;e.y=300;e.soundCycle=cycle;if(rage)e.hp=e.maxHp*.4;g.p.x=800;g.p.y=500;g.p.inv=0;g.enemyAttack(e);return {g,e}}
function tick(g,e,seconds){for(let t=0;t<seconds-1e-8;t+=.02)updateSpeaker(g,e,.02)}

test('ring telegraphs without instant damage and absorbs only during its wind-up',()=>{
 const {g,e}=setup();g.bullets=[{x:310,y:300},{x:600,y:300}];tick(g,e,.6);
 assert.equal(g.enemyBullets.length,0);assert.equal(g.bullets.length,1);assert.ok(e.muted);
 tick(g,e,.08);assert.equal(g.enemyBullets.length,10);assert.equal(e.muted,false);assert.ok(g.enemyBullets.every(b=>b.sound==='ring'));
});
test('fan fires three spaced volleys along a locked heading; low health adds a fourth',()=>{
 for(const rage of [false,true]){const {g,e}=setup(1,rage);const aim=e.sound.aim;g.p.x=150;g.p.y=100;
 tick(g,e,.68);assert.equal(g.enemyBullets.length,0);tick(g,e,.04);assert.equal(g.enemyBullets.length,rage?7:5);assert.equal(e.sound.aim,aim);
 tick(g,e,1.2);assert.equal(g.enemyBullets.length,rage?28:15);assert.ok(g.enemyBullets.every(b=>b.sound==='fan'));
 }
 const {g,e}=setup(0,true);tick(g,e,1.2);assert.equal(g.enemyBullets.length,28);
});
test('bass wave hits only its expanding band, only once, and can be dodged',()=>{
 const hit=setup(2);hit.g.p.x=500;hit.g.p.y=300;tick(hit.g,hit.e,.88);assert.equal(hit.g.p.hp,6);
 tick(hit.g,hit.e,.7);assert.equal(hit.g.p.hp,5);hit.g.p.inv=0;tick(hit.g,hit.e,.9);assert.equal(hit.g.p.hp,5);
 const far=setup(2);tick(far.g,far.e,2.5);assert.equal(far.g.p.hp,6);
 const dodge=setup(2);dodge.g.p.x=500;dodge.g.p.y=300;dodge.g.p.dash=.2;tick(dodge.g,dodge.e,1.6);dodge.g.p.dash=0;tick(dodge.g,dodge.e,.9);assert.equal(dodge.g.p.hp,6);
});
test('the real combat loop rotates all three attacks and freezes while paused',()=>{
 const {g,e}=setup();g.p.inv=999;g.events=[];const x=e.x;g.update(.04);assert.equal(e.x,x);
 g.mode='paused';const t=e.sound.t;g.update(.04);assert.equal(e.sound.t,t);g.mode='play';
 for(let i=0;i<700;i++)g.update(.02);
 assert.deepEqual(g.events.filter(x=>x.type==='bossSound').slice(0,3).map(x=>x.kind),['fan','bass','ring']);
 g.damageEnemy(e,999);g.update(.02);assert.equal(e.sound,null);assert.equal(g.enemyBullets.length,0);
});
test('all three attack cues draw during warning and active states',()=>{
 const calls=[];const ctx=new Proxy({}, {get:(_,key)=>(...args)=>{calls.push([key,...args])},set:()=>true});
 for(const cycle of [0,1,2]){const {g,e}=setup(cycle);drawSpeakerAttack(ctx,e);tick(g,e,.76);drawSpeakerAttack(ctx,e);}
 assert.ok(calls.some(c=>c[0]==='fillText'&&c[1].includes('低音震荡')));assert.ok(calls.some(c=>c[0]==='fillText'&&c[1].includes('扇形连发')));
 assert.ok(calls.filter(c=>c[0]==='arc').every(c=>Number.isFinite(c[3])&&c[3]>=0));
});
