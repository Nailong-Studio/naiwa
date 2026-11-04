import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
import {armBarrel,drawBarrel} from '../dist/environment-props.js';
import {encounterCount} from '../dist/encounter-budget.js';
const barrel=(x,y)=>({kind:'barrel',x,y,w:38,h:44,r:22,hp:2});
const step=(g,n)=>{for(let t=0;t<n-.0001;t+=.02)g.update(.02)};
function setup(){const g=new Game();g.start();g.room.obstacles=[];g.room.hazards=[];g.p.x=100;g.p.y=100;g.p.inv=0;g.random=()=>.99;return g}
test('barrels take two basic hits, warn for 0.85 seconds, then damage enemies and break cover',()=>{
 const g=setup(),o=barrel(480,300),crate={kind:'crate',x:535,y:300,w:48,h:48,r:24,hp:3},e=g.spawn('brute',550,330);e.hp=e.maxHp=30;e.cd=999;g.enemySpeed=()=>0;g.room.enemies=[e];g.room.obstacles=[o,crate];
 const b={x:480,y:300,r:8,damage:1};g.projectileBlocked(b,false);assert.equal(o.fuse,undefined);g.projectileBlocked(b,false);assert.equal(o.fuse,.85);step(g,.8);assert.equal(e.hp,30);assert.ok(g.room.obstacles.includes(o));step(g,.06);assert.equal(e.hp,18);assert.equal(g.room.obstacles.length,0);assert.equal(g.bombs,2);
});
test('explosions hurt nearby players while the warning lets them move out',()=>{
 for(const escape of [false,true]){const g=setup(),o=barrel(480,300);g.room.obstacles=[o];g.p.x=540;g.p.y=300;armBarrel(g,o);step(g,.8);assert.equal(g.p.hp,6);if(escape)g.p.x=650;step(g,.06);assert.equal(g.p.hp,escape?6:5)}
});
test('chain reactions give the second barrel a fresh warning and repeated hits cannot reset it',()=>{
 const g=setup(),a=barrel(450,300),b=barrel(550,300);g.room.obstacles=[a,b];armBarrel(g,a);step(g,.86);assert.ok(!g.room.obstacles.includes(a));assert.equal(b.fuse,.85);armBarrel(g,b);assert.equal(b.fuse,.85);step(g,.8);assert.ok(g.room.obstacles.includes(b));step(g,.06);assert.equal(g.room.obstacles.length,0);
});
test('hostile shots cannot unexpectedly ignite barrels; player bombs can, without an instant chain blast',()=>{
 const g=setup(),o=barrel(480,300);g.room.obstacles=[o];g.projectileBlocked({x:480,y:300,r:8,damage:20},true);assert.equal(o.hp,2);assert.equal(o.fuse,undefined);g.boom(480,300,130);assert.equal(o.fuse,.85);assert.ok(g.room.obstacles.includes(o));
});
test('fuses freeze while paused and destroyed barrels stay gone on revisits',()=>{
 const g=setup(),r=g.rooms.find(r=>r.exists&&r.type==='fight');g.enter(r.id,'left');r.enemies=[];r.clear=true;r.hazards=[];const o=barrel(480,300);r.obstacles=[o];armBarrel(g,o);g.mode='paused';step(g,1);assert.equal(o.fuse,.85);g.mode='play';step(g,.86);g.enter(12,'right');g.enter(r.id,'left');assert.equal(r.obstacles.length,0);
});
test('crowded geometry reduces only its own combat budget and does not change resource guards',()=>{
 for(let floor=1;floor<=5;floor++)for(const type of ['fight','challenge']){const r={type,seed:6};const open=encounterCount(r,floor);assert.equal(encounterCount({...r,crowdingPenalty:2},floor),open-2)}
 for(const type of ['vault','cache'])assert.equal(encounterCount({type,seed:6,crowdingPenalty:2},5),encounterCount({type,seed:6},5));
 const g=new Game(()=>.25);const rooms=g.rooms.filter(r=>r.layoutId);assert.ok(rooms.some(r=>r.crowdingPenalty>0));assert.ok(rooms.every(r=>r.crowdingPenalty>=0&&r.crowdingPenalty<=2));
});
test('the full blast radius and countdown render across all five chapter themes',()=>{
 const labels=[],radii=[],ctx=new Proxy({}, {get:(_,key)=>(...args)=>{for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a));if(key==='fillText')labels.push(args[0]);if(key==='arc')radii.push(args[2])},set:()=>true});for(let floor=1;floor<=5;floor++){const o=barrel(480,300);drawBarrel(ctx,o,floor);o.fuse=.8;drawBarrel(ctx,o,floor)}assert.ok(labels.includes('发酵奶桶')&&labels.includes('警戒电池')&&labels.includes('0.8秒'));assert.ok(radii.every(r=>r===105));
});
