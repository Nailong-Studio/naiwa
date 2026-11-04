import test from 'node:test';
import assert from 'node:assert/strict';
import {CHAPTER_LAYOUTS} from '../dist/chapter-content.js';
import {Game} from '../dist/campaign.js';
import {LAYOUTS,blocked,moveOnTerrain,steer,safeSpot,navigationSnapshot,spawnEncounter} from '../dist/terrain.js';
const roomFor=layout=>({layoutId:layout.id,obstacles:layout.build(),loot:[],type:'fight'});
const portals=[{x:95,y:300},{x:865,y:300},{x:480,y:90},{x:480,y:510}];
test('every authored layout connects doors and all walkable spaces without spending bombs',()=>{
 for(const layout of [...LAYOUTS,...CHAPTER_LAYOUTS.flat()]){const room=roomFor(layout),nodes=navigationSnapshot(room);
  assert.ok(nodes.filter(n=>n.free).every(n=>n.distance>=0),layout.id+' contains a stranded area');
  for(const p of portals)assert.equal(blocked(room,p.x,p.y,24),false,layout.id+' blocked entrance');
  const reward=safeSpot(room,480,320);assert.equal(blocked(room,reward.x,reward.y,24),false);
 }
});
test('ground pursuers route around each layout to all four exits instead of pushing into cover',()=>{
 for(const layout of [...LAYOUTS,...CHAPTER_LAYOUTS.flat()])for(const target of portals){
  const room=roomFor(layout),start=safeSpot(room,700,410),e={...start,r:23,type:'runner'};
  for(let i=0;i<900&&Math.hypot(e.x-target.x,e.y-target.y)>40;i++){
   const h=steer(room,e,target),x=e.x,y=e.y;e.x+=h.x*194*.04;e.y+=h.y*194*.04;moveOnTerrain(room,e,x,y);
  }
  assert.ok(Math.hypot(e.x-target.x,e.y-target.y)<45,`${layout.id} stuck at ${e.x},${e.y} to ${target.x},${target.y}`);
 }
});
test('encounter placements are reachable, separated and away from every entry point',()=>{
 const g=new Game();g.start();
 for(const floor of [1,3,5])for(const layout of [...LAYOUTS,...CHAPTER_LAYOUTS.flat()])for(const p of portals){const room=roomFor(layout);g.p={...g.p,...p};g.floor=floor;
  const enemies=spawnEncounter(g,room);assert.ok(enemies.filter(e=>e.type==='runner').length<=1);
  for(const e of enemies){assert.ok(!blocked(room,e.x,e.y,24));assert.ok(Math.hypot(e.x-p.x,e.y-p.y)>=150)}
  for(let i=0;i<enemies.length;i++)for(let j=i+1;j<enemies.length;j++)assert.ok(Math.hypot(enemies[i].x-enemies[j].x,enemies[i].y-enemies[j].y)>=60);
 }
});
test('pits stop walking and dash, permit flying monsters, and let projectiles cross',()=>{
 const g=new Game();g.start();g.p.x=200;g.p.y=300;g.room.obstacles=[{kind:'pit',x:260,y:300,w:48,h:48,r:24}];
 for(let i=0;i<7;i++)g.update(.04,{mx:1,dash:true});assert.ok(g.p.x<216);
 const fly={type:'hopper',x:330,y:300,r:19};moveOnTerrain(g.room,fly,200,300);assert.ok(Math.abs(fly.x-330)<.001);
 const bullet={x:260,y:300,r:9,damage:1};assert.equal(g.projectileBlocked(bullet,false),false);assert.equal(g.projectileBlocked(bullet,true),false);
});
test('crates absorb three basic shots; rocks need bombs; pillars and pits survive explosions',()=>{
 const g=new Game();g.start();g.p.x=100;g.p.y=100;
 const crate={kind:'crate',x:300,y:300,w:48,h:48,r:24,hp:3},rock={kind:'rock',x:352,y:300,w:48,h:48,r:24},pillar={kind:'pillar',x:404,y:300,w:48,h:48,r:24},pit={kind:'pit',x:456,y:300,w:48,h:48,r:24};
 g.room.obstacles=[crate,rock,pillar,pit];g.random=()=>.99;const shot={x:300,y:300,r:10,damage:1};
 for(let i=0;i<2;i++){assert.equal(g.projectileBlocked(shot,false),true);assert.ok(g.room.obstacles.includes(crate))}
 g.projectileBlocked(shot,false);assert.ok(!g.room.obstacles.includes(crate));
 for(let i=0;i<10;i++)g.projectileBlocked({...shot,x:352},false);assert.ok(g.room.obstacles.includes(rock));
 g.random=()=>.1;g.boom(352,300,150);assert.deepEqual(g.room.obstacles,[pillar,pit]);assert.ok(g.room.loot.length<=1);
});
test('destroying a sealed shortcut changes navigation and persists on returning',()=>{
 const g=new Game();g.start();const id=g.rooms.find(r=>r.exists&&r.type==='fight').id;g.enter(id,'top');const layout=LAYOUTS.find(l=>l.id==='shortcut');Object.assign(g.room,roomFor(layout));
 const crate=g.room.obstacles.find(o=>o.kind==='crate'&&o.y===300);assert.ok(blocked(g.room,crate.x,crate.y,21));navigationSnapshot(g.room);
 g.projectileBlocked({x:crate.x,y:crate.y,r:10,damage:3},false);assert.equal(blocked(g.room,crate.x,crate.y,21),false);assert.ok(navigationSnapshot(g.room).some(p=>p.x===480&&p.y===300&&p.free));
 const count=g.room.obstacles.length;g.enter(12,'top');g.enter(id,'top');assert.equal(g.room.obstacles.length,count);
});
test('each chapter draws from varied room templates and keeps special rooms open',()=>{
 for(let floor=1;floor<=5;floor++){const g=new Game();g.floor=floor;g.generate();const rooms=g.rooms.filter(r=>r.exists&&['fight','challenge'].includes(r.type));assert.equal(new Set(rooms.map(r=>r.layoutId)).size,Math.min(rooms.length,LAYOUTS.length+CHAPTER_LAYOUTS[floor-1].length));assert.ok(g.rooms.filter(r=>r.exists&&!['fight','challenge'].includes(r.type)).every(r=>r.obstacles.every(o=>r.type==='start'&&g.floor>=2&&o.wardrobe)))}
});

test('pursuers replan after the player changes sides and after a shortcut is destroyed',()=>{
 for(const layout of [...LAYOUTS,...CHAPTER_LAYOUTS.flat()]){const room=roomFor(layout),start=safeSpot(room,700,410),e={...start,r:23,type:'runner'};
  const targets=[{x:95,y:300},{x:480,y:90},{x:865,y:300},safeSpot(room,300,400)];
  for(const [j,target] of targets.entries()){
   if(j===2)room.obstacles=room.obstacles.filter(o=>o.kind!=='crate');
   for(let i=0;i<(j===targets.length-1?750:35)&&Math.hypot(e.x-target.x,e.y-target.y)>30;i++){
    const h=steer(room,e,target),x=e.x,y=e.y;e.x+=h.x*194*.04;e.y+=h.y*194*.04;moveOnTerrain(room,e,x,y);
    assert.ok(!blocked(room,e.x,e.y,e.r),layout.id+' clipped into cover');
   }
   if(j===targets.length-1)assert.ok(Math.hypot(e.x-target.x,e.y-target.y)<35,layout.id+' failed to replan');
  }
 }
});

test('crates roll one small pickup at 15 percent, without rerolls after shooting or bombing',()=>{
 const g=new Game();g.start();g.p.x=100;g.p.y=100;g.burst=()=>{};let drops=0;
 for(let i=0;i<100;i++){
  g.room.loot=[];const crate={kind:'crate',x:300,y:300,w:48,h:48,r:24,hp:3};g.room.obstacles=[crate];g.random=()=>(i+.5)/100;
  g.projectileBlocked({x:300,y:300,r:8,damage:3},false);drops+=g.room.loot.length;assert.ok(g.room.loot.length<=1);
  const count=g.room.loot.length;g.projectileBlocked({x:300,y:300,r:8,damage:3},false);g.boom(300,300);assert.equal(g.room.loot.length,count);
 }
 assert.equal(drops,15);
 for(const [roll,type] of [[.1,'coin'],[.6,'key'],[.8,'bomb'],[.95,'heart']]){
  g.room.loot=[];g.room.obstacles=[{kind:'crate',x:300,y:300,w:48,h:48,r:24,hp:3}];const random=[.1,roll];g.random=()=>random.shift()??.99;g.boom(300,300);
  assert.deepEqual(g.room.loot.map(l=>[l.type,l.amount]),[[type,1]]);
 }
});

test('each floor has one visible stash stone which yields a reward only once',()=>{
 for(let floor=1;floor<=5;floor++){const g=new Game();g.start();g.floor=floor;g.generate();const rooms=g.rooms.filter(r=>r.obstacles.some(o=>o.stash));assert.equal(rooms.length,1);
  const r=rooms[0],stone=r.obstacles.find(o=>o.stash);assert.equal(stone.kind,'rock');g.roomId=r.id;r.enemies=[];g.p.x=95;g.p.y=300;g.random=()=>.9;
  g.boom(stone.x,stone.y,30);assert.deepEqual(r.loot.map(l=>l.type),['bomb']);const count=r.loot.length;g.boom(stone.x,stone.y,30);assert.equal(r.loot.length,count);
 }
});
