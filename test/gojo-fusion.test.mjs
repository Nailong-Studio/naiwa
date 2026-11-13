import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
import {GOJO,updateGojoFusion} from '../dist/gojo-fusion.js';
import {BOMB_DAMAGE} from '../dist/combat-values.js';
import {serializeRun,deserializeRun} from '../dist/run-save.js';
import {drawGojo} from '../dist/gojo-art.js';
import {drawPixelEffect} from '../dist/pixel-effects.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function game(){const g=new Game(()=>0);g.start();g.items=['gojohalf'];g.room.type='fight';g.room.clear=false;g.room.obstacles=[];g.room.hazards=[];g.enemySpeed=()=>0;const e=g.spawn('turret',800,120);e.cd=999;e.hp=1000;g.room.enemies=[e];g.p.x=220;g.p.y=330;g.p.inv=0;return g}
const step=(g,n)=>{for(let i=0;i<n;i++)g.update(.02,{})};
function until(g,phase){for(let i=0;i<250&&g.gojo?.phase!==phase;i++)g.update(.02,{});assert.equal(g.gojo?.phase,phase)}
test('upper half stays at takeoff, lower half appears only at landing; Red stops before Blue is launched',()=>{
 const g=game();g.update(.02,{dash:true,mx:1});const s=g.gojo;assert.equal(s.x,220);assert.equal(s.feet,null);assert.equal(s.phase,'takeoff');until(g,'redWindup');const landing={x:g.p.x,y:g.p.y};assert.deepEqual(s.feet,{...landing,face:g.p.face});g.p.x+=100;step(g,2);assert.equal(s.feet.x,landing.x);until(g,'redFlight');assert.equal(s.blue,null);assert.equal(s.red.dx,1);assert.equal(s.red.dy,0);until(g,'redHold');const stopped={x:s.red.x,y:s.red.y};assert.equal(s.blue,null);step(g,5);near(s.red.x,stopped.x);until(g,'blueFlight');assert.ok(s.blue);assert.equal(s.x,220);until(g,'fusion');assert.equal(s.red,null);assert.equal(s.blue,null);near(s.purple.x,stopped.x);near(s.purple.y,stopped.y);
});
test('Purple warns first, deals exactly double bomb damage once, and also hits its owner once',()=>{
 const g=game();g.p.damage=100;g.items.push('double','man','deepthink');g.manReady=g.deepReady=true;g.update(.02,{dash:true,mx:1});until(g,'fusion');const s=g.gojo,p=s.purple,e=g.room.enemies[0];e.x=p.x;e.y=p.y;e.hp=1000;g.p.x=p.x;g.p.y=p.y;g.p.inv=0;
 updateGojoFusion(g,.8,g.p);assert.equal(e.hp,1000);assert.equal(g.p.hp,6);updateGojoFusion(g,.06,g.p);assert.equal(GOJO.purpleDamage,BOMB_DAMAGE*2);assert.equal(e.hp,960);assert.equal(g.p.hp,5);assert.equal(g.activeCharge,0);assert.ok(g.manReady&&g.deepReady);updateGojoFusion(g,.02,g.p);assert.equal(e.hp,960);assert.equal(g.p.hp,5);
});
test('leaving the blast, dashing, shields and solid cover protect the owner; warning and hit radius agree',()=>{
 for(const guard of ['outside','dash','shield','wall']){const g=game();g.update(.02,{dash:true,mx:1});until(g,'fusion');const p=g.gojo.purple;g.p.x=p.x+50;g.p.y=p.y;g.p.inv=0;
  if(guard==='outside')g.p.x=p.x+GOJO.radius+g.p.r+1;
  if(guard==='dash')g.p.dash=.2;
  if(guard==='shield')g.p.shield=true;
  if(guard==='wall')g.room.obstacles=[{kind:'pillar',x:p.x+25,y:p.y,w:12,h:100,r:6}];
  updateGojoFusion(g,.86,g.p);assert.equal(g.p.hp,6,guard);if(guard==='shield')assert.equal(g.p.shield,false);
 }
});
test('Red and Blue each deal one hit per enemy, and do not displace bosses',()=>{
 const g=game();g.p.dash=.2;updateGojoFusion(g,0,g.p);g.p.dash=0;updateGojoFusion(g,0,g.p);updateGojoFusion(g,.21,g.p);const s=g.gojo,e=g.makeBoss('puppet',s.red.x,s.red.y);e.hp=1000;g.room.enemies=[e];
 updateGojoFusion(g,0,g.p);assert.equal(e.hp,994);updateGojoFusion(g,0,g.p);assert.equal(e.hp,994);assert.equal(e.vx,0);
 s.phase='blueFlight';s.blue={x:e.x,y:e.y,hits:new Set()};s.red.x=e.x+100;s.red.y=e.y;updateGojoFusion(g,0,g.p);assert.equal(e.hp,990);updateGojoFusion(g,0,g.p);assert.equal(e.hp,990);assert.equal(e.vx,0);
});
test('red stops at walls; blue can reach it but cannot hit through cover; room transitions cancel every phase',()=>{
 const g=game();g.update(.02,{dash:true,mx:1});until(g,'redFlight');const r=g.gojo.red;g.room.obstacles=[{kind:'pillar',x:r.x+30,y:r.y,w:12,h:110,r:6}];until(g,'redHold');assert.ok(g.gojo.red.x<g.room.obstacles[0].x);until(g,'fusion');g.enter(g.rooms.find(r=>r.exists&&r.type==='fight'&&r.id!==g.roomId).id,'top');assert.equal(g.gojo,null);g.p.dashCD=0;g.update(.02,{dash:true,mx:1});assert.equal(g.gojo,null,'cooldown persists across rooms');
});
test('saving a stopped Red preserves both fixed halves and resumes the collision sequence',()=>{
 const g=game();g.update(.02,{dash:true,mx:1});until(g,'redHold');const r=deserializeRun(serializeRun(g)).game;assert.deepEqual(r.gojo,g.gojo);r.enemySpeed=()=>0;until(r,'fusion');assert.ok(r.gojo.purple);r.mode='paused';const t=r.gojo.purple.t;step(r,30);assert.equal(r.gojo.purple.t,t);
});
test('legacy summon state expires safely; all new spell visuals use finite coordinates and do not mutate combat',()=>{
 const g=game();g.gojo={left:3,cast:{dx:1}};updateGojoFusion(g,.02,g.p);assert.equal(g.gojo,null);
 const calls=[],c=new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:(...args)=>{for(const x of args)if(typeof x==='number')assert.ok(Number.isFinite(x),k);calls.push(k)},set:(o,k,v)=>(o[k]=v,true)});
 g.update(.02,{dash:true,mx:1});for(const phase of ['redFlight','blueFlight','fusion']){until(g,phase);const before=serializeRun(g);drawGojo(c,g);assert.equal(serializeRun(g,{now:1}),JSON.stringify({...JSON.parse(before),savedAt:1}));}
 assert.ok(drawPixelEffect(c,{type:'gojoBlast',x:300,y:300,radius:130,life:.4,max:.55}));assert.ok(calls.includes('fillRect'));
});
