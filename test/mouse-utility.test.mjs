import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
import {resetFollowers,updateFollowers} from '../dist/follower-combat.js';
import {serializeRun,deserializeRun} from '../dist/run-save.js';
import {drawPixelEffect} from '../dist/pixel-effects.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function arena(g,id=g.roomId){
 g.mode='play';g.roomId=id;const r=g.room;
 Object.assign(r,{exists:true,type:'fight',clear:false,obstacles:[],hazards:[],loot:[],enteredAt:g.elapsed});
 g.p.x=480;g.p.y=300;g.p.inv=999;g.bullets=[];g.enemyBullets=[];g.enemySpeed=()=>0;resetFollowers(g);
 const e=g.spawn('turret',620,300);e.hp=e.maxHp=1000;e.cd=999;r.enemies=[e];return e;
}
function game(){const g=new Game(()=>.42);g.start();g.items=['mouse'];arena(g);return g}
function step(g,seconds){for(let i=0;i<Math.ceil(seconds/.02);i++)g.update(.02,{})}
function bite(g){const e=g.room.enemies[0],hp=e.hp;for(let i=0;i<160&&e.hp===hp;i++)g.update(.02,{});assert.ok(e.hp<hp,'mouse must physically reach and bite');return hp-e.hp}

test('mouse deals only 1.5 base damage, reaches its target physically and never consumes empowered shots',()=>{
 for(const damage of [1,100]){
  const g=game(),e=g.room.enemies[0];g.p.damage=damage;g.items.push('man','deepthink','double');g.manReady=true;g.deepReady=true;
  g.update(.02,{});assert.equal(e.hp,1000);assert.equal(g.followerStates.mouse.phase,'windup');
  close(bite(g),1.5);const s=g.followerStates.mouse;assert.ok(Math.hypot(s.x-e.x,s.y-e.y)<e.r+12);close(s.cd,3.2);
  step(g,2.8);close(e.hp,998.5);assert.ok(g.manReady&&g.deepReady);assert.equal(g.bullets.length,0);
 }
});

test('mouse bites a grounded boss without interrupting its skill and does not target flying enemies',()=>{
 const g=game(),boss=g.makeBoss('puppet',620,300);boss.hp=boss.maxHp=1000;boss.cd=999;g.room.enemies=[boss];
 const skill={mode:'needle',t:.2};boss.puppetSkill=skill;const shot={x:100,y:100,vx:30,vy:0,r:5};g.enemyBullets=[shot];
 for(let i=0;i<160&&boss.hp===1000;i++)updateFollowers(g,.02);close(boss.hp,998.5);assert.deepEqual(boss.puppetSkill,{mode:'needle',t:.2});assert.equal(boss.puppetSkill,skill);assert.deepEqual(g.enemyBullets,[shot]);assert.equal(boss.vx,0);assert.equal(boss.vy,0);
 for(const kind of ['hopper','airborne']){const h=game(),e=h.room.enemies[0];if(kind==='hopper')e.type='hopper';else e.airborne=true;step(h,2);assert.equal(e.hp,1000);assert.equal(h.room.mouseSupplied,undefined)}
});

test('one useful supply per room prioritizes missing keys, then bombs, then two coins',()=>{
 for(const [keys,bombs,expected] of [[0,0,'key'],[1,0,'bomb'],[1,2,'coin']]){
  const g=game();g.keys=keys;g.bombs=bombs;bite(g);step(g,.6);
  assert.equal(g.keys,keys+(expected==='key'?1:0));assert.equal(g.bombs,bombs+(expected==='bomb'?1:0));assert.equal(g.coins,expected==='coin'?2:0);
  assert.equal(g.room.mouseSupplied,true);const before=[g.keys,g.bombs,g.coins];step(g,10);assert.deepEqual([g.keys,g.bombs,g.coins],before);
 }
 const g=game();g.keys=0;const other=g.rooms.find(r=>r.id!==g.roomId);other.loot.push({type:'key',x:400,y:300,amount:1});bite(g);step(g,.6);assert.equal(g.keys,0);assert.equal(g.coins,2);
});

test('room revisits and saves preserve theft limits; at most three supplies per floor',()=>{
 let g=game();const first=g.roomId;bite(g);step(g,.6);g=deserializeRun(serializeRun(g)).game;arena(g,first);bite(g);step(g,.6);assert.equal(g.coins,2);
 const ids=g.rooms.filter(r=>r.id!==first).slice(0,3).map(r=>r.id);
 for(const id of ids){arena(g,id);bite(g);step(g,.6)}assert.equal(g.coins,6);assert.equal(g.rooms.filter(r=>r.mouseSupplied).length,3);
 g.floor=2;g.generate();arena(g);bite(g);step(g,.6);assert.equal(g.coins,8);assert.equal(g.rooms.filter(r=>r.mouseSupplied).length,1);
});

test('saving during an approach retains the target and does not duplicate the bite or resource',()=>{
 let g=game();g.update(.02,{});const text=serializeRun(g);g=deserializeRun(text).game;assert.equal(g.followerStates.mouse.target,g.room.enemies[0]);close(bite(g),1.5);step(g,.6);assert.equal(g.coins,2);
 g=deserializeRun(serializeRun(g)).game;step(g,1);close(g.room.enemies[0].hp,998.5);assert.equal(g.coins,2);
});

test('mouse cannot bite or steal through a solid wall or an impassable pit',()=>{
 for(const kind of ['pillar','pit']){const g=game();g.room.obstacles=[{kind,x:550,y:300,w:50,h:520,r:25}];step(g,5);assert.equal(g.room.enemies[0].hp,1000);assert.equal(g.room.mouseSupplied,undefined);assert.equal(g.coins,0);assert.ok(g.followerStates.mouse.x<525)}
});

test('safe and cleared rooms never yield stolen supplies; the pickup effect only renders',()=>{
 for(const [type,clear] of [['shop',false],['start',true],['fight',true]]){const g=game();g.room.type=type;g.room.clear=clear;step(g,2);assert.equal(g.room.enemies[0].hp,1000);assert.equal(g.room.mouseSupplied,undefined)}
 const effect={type:'mouseSteal',x:500,y:280,resource:'key',amount:1,life:.7,max:.9},before={...effect};
 const ctx=new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:(...args)=>{for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a))},set:(o,k,v)=>{o[k]=v;return true}});
 assert.equal(drawPixelEffect(ctx,effect),true);assert.deepEqual(effect,before);
});
