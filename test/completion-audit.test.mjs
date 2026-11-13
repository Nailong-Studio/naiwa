import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
import {updateActive} from '../dist/combat-content.js';
import {updateMemeFollowers} from '../dist/meme-followers.js';
import {drawEnhancedShot,drawItemEffect,hitItemVfx,wireItemVfx} from '../dist/item-vfx.js';
const fresh=(items=[])=>{const g=new Game(()=>.42);g.start();g.items=items;g.room.type='fight';g.room.clear=false;g.room.obstacles=[];g.room.hazards=[];g.p.x=300;g.p.y=300;g.p.inv=999;g.enemySpeed=()=>0;g.room.enemies=[];return g};
const enemy=(g,type,x,y)=>{const e=g.spawn(type,x,y);e.hp=e.maxHp=100;e.cd=99;g.room.enemies.push(e);return e};
test('property card works without machinery, cancels pending ranged attacks but not existing shots, bosses or occluded enemies',()=>{
 const g=fresh(['propertycard']),open=enemy(g,'turret',400,300),blocked=enemy(g,'turret',300,420),far=enemy(g,'turret',700,300),melee=enemy(g,'brute',240,300),boss=g.makeBoss('puppet',220,300);g.room.enemies.push(boss);
 g.room.obstacles=[{kind:'pillar',x:300,y:360,w:40,h:20,r:20}];open.gunCast={t:0};boss.puppetSkill={mode:'needle',t:0};g.effects=[{type:'milkBottle',owner:open,life:1},{type:'mobZone',owner:open,triggered:true,life:1}];g.enemyBullets=[{x:700,y:250,vx:10,vy:0,r:5,life:3}];g.activeCharge=g.activeCost();
 updateActive(g,.02,{active:true});assert.equal(open.phoneMutedUntil,1.5);assert.equal(open.gunCast,null);assert.ok(!g.effects.some(f=>f.type==='milkBottle'));assert.ok(g.effects.some(f=>f.type==='mobZone'));assert.equal(g.enemyBullets.length,1);assert.equal(boss.puppetSkill.mode,'needle');
 for(const e of [blocked,far,melee,boss])assert.equal(e.phoneMutedUntil,undefined);
 g.enemyAttack(open);assert.equal(g.enemyBullets.length,1);g.elapsed=1.51;g.enemyAttack(open);assert.equal(g.enemyBullets.length,2);
});
test('property card speeds the companion ranged interrupt to 2.6 seconds without weakening an existing longer mute',()=>{
 const g=fresh(['sun','propertycard']),e=enemy(g,'turret',400,300);updateMemeFollowers(g,0);const s=g.memePets.sun;s.cd=0;updateMemeFollowers(g,0);e.phoneMutedUntil=8;updateMemeFollowers(g,.4);assert.equal(s.cd,2.6);assert.equal(e.phoneMutedUntil,8);
});
test('companion impacts stay cosmetic, include fed rice, and remain inside the common effect budget',()=>{
 const g=fresh(),e=enemy(g,'turret',500,300),variants=[['rice',{rice:true}],['fedRice',{rice:true,fed:true}],['basketball',{memePet:'kobe'}],['stone',{rollingRock:true}],['egg',{eggShot:true}]];
 for(const [variant,flags] of variants){const b={pet:true,x:500,y:300,vx:200,vy:0,r:7,damage:2,hits:new Set(),...flags};g.onBulletHit(e,b);assert.equal(g.effects.at(-1).variant,variant);assert.equal(e.hp,100);assert.equal(b.damage,2)}
 for(let i=0;i<50;i++)wireItemVfx(g,e);assert.equal(g.effects.length,24);assert.equal(g.effects.at(-1).variant,'wire');
 const count=g.effects.length;hitItemVfx(g,e,{pet:true,vx:0,vy:0,r:8});assert.equal(g.effects.length,count);
});
test('plug and wood/ghost combinations render distinct finite shapes and cosmetic effects pause, expire and clear on room change',()=>{
 const calls=[],c=new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:(...args)=>{for(const n of args)if(typeof n==='number')assert.ok(Number.isFinite(n));calls.push([k,...args])},set:(o,k,v)=>(o[k]=v,true)});
 const b={x:200,y:200,r:12,vx:400,vy:0,wood:true};drawEnhancedShot(c,b);const wood=JSON.stringify(calls);calls.length=0;drawEnhancedShot(c,{...b,ghost:true,phoebePlug:true});assert.notEqual(JSON.stringify(calls),wood);
 for(const variant of ['plug','wire','rice','fedRice','basketball','stone','egg'])assert.ok(drawItemEffect(c,{type:'itemImpact',variant,x:200,y:200,radius:20,life:.1,max:.24}));
 const g=fresh(['phoebeplug']);enemy(g,'turret',850,450);g.shoot(1,0);assert.equal(g.effects[0].variant,'plug');assert.ok(drawEnhancedShot(c,g.bullets[0]));g.mode='paused';g.update(.04);assert.equal(g.effects[0].life,.18);g.mode='play';for(let i=0;i<10;i++)g.update(.04);assert.ok(!g.effects.some(f=>f.type==='itemCast'));
 wireItemVfx(g,g.p);g.enter(g.rooms.find(r=>r.exists&&r.type==='fight'&&r.id!==g.roomId).id,'top');assert.ok(!g.effects.some(f=>f.type==='itemImpact'));
});
