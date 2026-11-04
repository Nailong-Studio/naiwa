import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
import {ENCOUNTERS,ENCOUNTER_PROFILES,encounterRoster} from '../dist/encounter-profiles.js';
import {CHAPTER_MOBS} from '../dist/mob-catalog.js';
import {CHAPTER_LAYOUTS} from '../dist/chapter-content.js';
import {LAYOUTS,spawnEncounter,blocked,navigationSnapshot} from '../dist/terrain.js';
function random(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32}}
const fixed=new Set(['turret','milkspitter','soundTurret','dollTurret','warden','echoBell','prismEye']);
test('each floor offers eight distinct focused squads, with safe limits on special units',()=>{
 for(let floor=1;floor<=5;floor++){
  const signatures=new Set();
  for(let encounterProfile=0;encounterProfile<8;encounterProfile++){
   const roster=encounterRoster({seed:0,encounterProfile},floor,13),counts={};
   assert.equal(roster.length,13);for(const type of roster){counts[type]=(counts[type]||0)+1;assert.ok(ENCOUNTERS[floor-1][encounterProfile].includes(type));if(CHAPTER_MOBS[type])assert.equal(CHAPTER_MOBS[type].chapter,floor)}
   assert.ok(Object.keys(counts).length<=3,'rooms should have a focused roster');
   for(const type of ['runner','conductor','stitchMedic'])assert.ok((counts[type]||0)<=1);
   assert.ok(roster.filter(t=>fixed.has(t)).length<=3);
   if(encounterProfile===0)assert.equal(roster.filter(t=>fixed.has(t)).length,0);
   if(encounterProfile===1){assert.equal(roster.filter(t=>fixed.has(t)).length,3);assert.ok(!roster.includes('runner'))}
   if(encounterProfile===5)assert.ok(counts.hopper>=4);
   signatures.add(JSON.stringify(Object.entries(counts).sort()));
  }
  assert.equal(signatures.size,8,'changing the name must actually change the squad');
 }
});
test('seeded floors distribute profiles without repeating neighboring or consecutive rooms',()=>{
 for(let seed=1;seed<=60;seed++)for(let floor=1;floor<=5;floor++){
  const g=new Game(random(seed));g.floor=floor;g.generate();const rooms=g.rooms.filter(r=>r.exists&&['fight','challenge'].includes(r.type));
  assert.equal(new Set(rooms.map(r=>r.encounterProfile)).size,Math.min(8,rooms.length));
  for(let i=0;i<rooms.length;i++){
   const room=rooms[i];assert.ok(room.encounterName&&room.encounterHint);
   if(i)assert.notEqual(room.encounterProfile,rooms[i-1].encounterProfile);
   for(const id of g.neighbors(room.id)){const neighbor=g.rooms[id];if(neighbor.exists&&['fight','challenge'].includes(neighbor.type))assert.notEqual(room.encounterProfile,neighbor.encounterProfile)}
  }
 }
});
test('all eight formations fit new and chapter layouts from every entrance without trapped or stacked monsters',()=>{
 const g=new Game(random(42));g.start();
 for(let floor=1;floor<=5;floor++){
  g.floor=floor;
  for(const layout of [...LAYOUTS.slice(-4),...CHAPTER_LAYOUTS[floor-1]])for(let variant=0;variant<ENCOUNTER_PROFILES.length;variant++)for(const [x,y] of [[95,300],[865,300],[480,95],[480,505]]){
   const room={type:'challenge',seed:8,encounterProfile:variant,layoutId:layout.id,obstacles:layout.build(),hazards:layout.hazards?.()||[]};g.p.x=x;g.p.y=y;
   const mobs=spawnEncounter(g,room),reachable=navigationSnapshot(room);
   assert.equal(mobs.length,8+floor);
   for(let i=0;i<mobs.length;i++){
    const e=mobs[i],context=`${floor}/${layout.id}/${variant}/${x},${y}`;
    assert.ok(!blocked(room,e.x,e.y,e.r),context);assert.ok(Math.hypot(e.x-x,e.y-y)>=150,context);
    assert.ok(reachable.some(p=>p.distance>=0&&p.x===e.x&&p.y===e.y),context);
    for(let j=0;j<i;j++)assert.ok(Math.hypot(e.x-mobs[j].x,e.y-mobs[j].y)>=60,context);
   }
  }
 }
});
test('room identity and surviving enemies persist on revisits',()=>{
 const g=new Game(random(19));g.start();const room=g.rooms.find(r=>r.exists&&r.type==='fight'),profile=room.encounterProfile,name=room.encounterName;
 g.enter(room.id,'left');const enemies=room.enemies;enemies[0].hp=1;g.enter(12,'right');g.enter(room.id,'left');
 assert.equal(room.encounterProfile,profile);assert.equal(room.encounterName,name);assert.equal(room.enemies,enemies);assert.equal(room.enemies[0].hp,1);
});
test('locked resource room guards also vary, while entry costs and room types remain unchanged',()=>{
 for(const type of ['vault','cache']){
  const signatures=new Set();
  for(let seed=0;seed<5;seed++){
   const g=new Game(random(25));g.start();g.floor=4;g.generate();const r=g.rooms.find(r=>r.exists&&r.type===type);r.seed=seed;r.locked=false;r.bombLocked=false;g.enter(r.id,'left');
   signatures.add(r.enemies.map(e=>e.type).sort().join(','));assert.equal(r.type,type);assert.ok(r.enemies.filter(e=>e.type==='stitchMedic').length<=1);
  }
  assert.equal(signatures.size,5);
 }
});
