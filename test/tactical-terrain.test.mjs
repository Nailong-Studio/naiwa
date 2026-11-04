import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
import {TACTICAL_LAYOUTS,layoutAffinity} from '../dist/tactical-terrain.js';
import {LAYOUTS,blocked,navigationSnapshot,spawnEncounter,shotLaneOpen} from '../dist/terrain.js';
import {CHAPTER_LAYOUTS} from '../dist/chapter-content.js';
import {drawTerrain} from '../dist/terrain-art.js';
function seeded(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32}}
test('floors keep chapter mechanisms, guarantee a tactical room and avoid generic hazard spam',()=>{
 for(let floor=1;floor<=5;floor++)for(let seed=1;seed<=40;seed++){
  const g=new Game(seeded(seed));g.floor=floor;g.generate();const rooms=g.rooms.filter(r=>r.layoutId);
  assert.ok(rooms.some(r=>TACTICAL_LAYOUTS.some(l=>l.id===r.layoutId)));
  for(const layout of CHAPTER_LAYOUTS[floor-1])assert.ok(rooms.some(r=>r.layoutId===layout.id));
  assert.equal(new Set(rooms.map(r=>r.layoutId)).size,rooms.length);
  for(const room of rooms)if(LAYOUTS.some(l=>l.id===room.layoutId))assert.equal(room.hazards.length,0);
  assert.ok(rooms.filter(r=>layoutAffinity([...LAYOUTS,...CHAPTER_LAYOUTS[floor-1]].find(l=>l.id===r.layoutId),r.encounterProfile)).length>=rooms.length/2);
 }
});
test('bombing marked stones opens only their adjacent bridge slots and persists on return',()=>{
 const g=new Game(seeded(13));g.start();const room=g.rooms.find(r=>r.exists&&r.type==='fight'),layout=TACTICAL_LAYOUTS.find(l=>l.id==='bridge_choice');g.enter(room.id,'left');Object.assign(room,{layoutId:layout.id,obstacles:layout.build(),hazards:[],loot:[]});g.p.x=95;g.p.y=300;
 const stone=room.obstacles.find(o=>o.bridgeTo),slot=stone.bridgeTo;assert.ok(blocked(room,slot.x,slot.y,21));navigationSnapshot(room);
 const pits=room.obstacles.filter(o=>o.kind==='pit').length;
 for(let i=0;i<4;i++)g.projectileBlocked({x:stone.x,y:stone.y,r:8,damage:10},false);assert.ok(room.obstacles.includes(stone));
 g.boom(stone.x,stone.y,30);assert.equal(room.bridges.length,1);assert.equal(room.obstacles.filter(o=>o.kind==='pit').length,pits-1);assert.ok(!blocked(room,slot.x,slot.y,21));assert.ok(navigationSnapshot(room).filter(n=>n.free).every(n=>n.distance>=0));
 g.boom(stone.x,stone.y,30);assert.equal(room.bridges.length,1);g.enter(12,'top');g.enter(room.id,'left');assert.equal(room.bridges.length,1);assert.ok(!blocked(room,slot.x,slot.y,21));
});
test('shots pass pits, cover breaks sightlines, and ranged squads find usable firing lanes',()=>{
 const room={obstacles:[{x:480,y:300,w:48,h:48,r:24,kind:'pillar'}]},a={x:300,y:300},b={x:700,y:300};assert.equal(shotLaneOpen(room,a,b),false);room.obstacles[0].kind='pit';assert.equal(shotLaneOpen(room,a,b),true);
 const g=new Game(seeded(8));g.start();g.floor=2;g.p.x=95;g.p.y=300;const layout=TACTICAL_LAYOUTS.find(l=>l.id==='cover_exchange');Object.assign(room,{layoutId:layout.id,obstacles:layout.build(),hazards:[],seed:0,type:'fight',encounterProfile:1});
 const mobs=spawnEncounter(g,room);assert.ok(mobs.filter(e=>shotLaneOpen(room,e,g.p)).length>=4);for(const m of mobs)assert.ok(!blocked(room,m.x,m.y,24)&&Math.hypot(m.x-g.p.x,m.y-g.p.y)>=150);
});
test('bridge markings and filled ground render finite geometry in each chapter',()=>{
 const labels=[],ctx=new Proxy({}, {get:(_,key)=>(...args)=>{for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a));if(key==='fillText')labels.push(args[0])},set:()=>true});
 for(let floor=1;floor<=5;floor++)drawTerrain(ctx,{obstacles:TACTICAL_LAYOUTS[1].build(),bridges:[{x:376,y:248}]},floor);assert.ok(labels.includes('桥石'));
});
