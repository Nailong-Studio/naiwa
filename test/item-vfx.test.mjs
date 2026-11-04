import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
import {drawEnhancedShot,drawItemEffect,drawItemReadiness,hitItemVfx} from '../dist/item-vfx.js';
import {drawPuppetAttack} from '../dist/puppet.js';
const fresh=ids=>{const g=new Game(()=>.42);g.start();g.items=ids;g.room.clear=false;g.room.obstacles=[];g.room.hazards=[];g.events=[];return g};
test('empowered volley visuals reflect actual triggers, are shared by pellets, and consume readiness once',()=>{
 const g=fresh(['man','fadeaway','double','fanvoice','oyeye','beatsticker']);g.manReady=true;g.fadeUntil=2;g.memeVolley=3;g.beatShots=3;
 g.shoot(0,0);assert.equal(g.effects.length,0);assert.equal(g.manReady,true);
 g.shoot(1,0);assert.equal(g.effects.filter(e=>e.type==='itemCast').length,1);assert.ok(g.bullets.every(b=>b.manBoost&&!b.fadeBoost&&b.rhythm&&b.beat));assert.equal(new Set(g.bullets.map(b=>b.vfxVolley)).size,1);
 const n=g.bullets.length;g.shoot(1,0);assert.ok(g.bullets.slice(n).every(b=>b.manBoost&&!b.fadeBoost&&!b.rhythm&&!b.beat));
});
test('deep-think and ghost visuals require activation, and pets do not inherit player cast effects',()=>{
 const g=fresh(['deepthink','voidframe']);g.shoot(1,0);assert.equal(g.effects.length,0);g.deepReady=true;g.memeVolley=2;g.shoot(1,0);assert.ok(g.bullets.at(-1).deepCharged&&g.bullets.at(-1).ghost);assert.equal(g.effects.length,1);
 g.shoot(1,0,true);assert.equal(g.effects.length,1);
});
test('impact effects are bounded for spread/pierce/split builds without changing damage or unrelated effects',()=>{
 const g=fresh(['man','double','fanvoice','split']);g.manReady=true;g.shoot(1,0);const enemy={x:700,y:300},damage=g.bullets.map(b=>b.damage);g.effects.push({type:'milkPool',life:3});
 for(let frame=0;frame<100;frame++){g.elapsed=frame*.1;for(const b of g.bullets)hitItemVfx(g,enemy,b)}
 assert.equal(g.effects.filter(e=>e.type==='itemImpact'||e.type==='itemCast').length,24);assert.ok(g.effects.some(e=>e.type==='milkPool'));assert.deepEqual(g.bullets.map(b=>b.damage),damage);
});
function context(){const calls=[];const c=new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:(...args)=>{for(const n of args)if(typeof n==='number')assert.ok(Number.isFinite(n));calls.push([k,...args])},set:(o,k,v)=>(o[k]=v,true)});return {c,calls}}
test('all item effects render finite geometry with distinct signatures and never mutate projectile/game state',()=>{
 const {c,calls}=context(),signatures=new Set();
 for(const flag of ['manBoost','deepCharged','ghost','rhythm','gugu','fadeBoost','wood','heavy','ironBoost','milkBoost','poison','returnVoice']){
  calls.length=0;const b={x:250,y:300,vx:490,vy:0,r:10,[flag]:true},before=JSON.stringify(b);assert.ok(drawEnhancedShot(c,b));assert.equal(JSON.stringify(b),before);signatures.add(JSON.stringify(calls));
 }
 assert.equal(signatures.size,12);
 for(const variant of ['man','deep','ghost','rhythm','gugu','fade','wood','heavy','rebound','milk','poison','echo','elbow'])for(const life of [.01,.12,.24])assert.ok(drawItemEffect(c,{type:'itemImpact',variant,x:100,y:150,radius:24,life,max:.24}));
 const g=fresh(['man','fadeaway']);g.manReady=true;g.fadeUntil=2;const before=JSON.stringify(g);drawItemReadiness(c,g);assert.equal(JSON.stringify(g),before);
});
test('puppet loom draw always shows the safe corridor and cannot fire, summon, advance or finish the skill',()=>{
 const {c,calls}=context();const g=fresh([]),e=g.makeBoss('puppet',400,150);g.room.enemies=[e];
 for(const t of [.2,1.4,5]){e.puppetSkill={mode:'loom',t,age:t,x:480,y:300,fired:0,rage:false};const before=JSON.stringify(g);calls.length=0;drawPuppetAttack(c,g);assert.equal(JSON.stringify(g),before);assert.ok(calls.some(a=>a[0]==='strokeRect'&&a[1]===380&&a[3]===200),'visible corridor matches bullet gap')}
});
