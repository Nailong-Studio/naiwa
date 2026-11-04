import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
import {spawnEncounter,LAYOUTS,blocked} from '../dist/terrain.js';
import {CHAPTER_LAYOUTS} from '../dist/chapter-content.js';
function room(floor,type){const g=new Game();g.start();g.floor=floor;g.generate();const r=g.rooms.find(r=>r.exists&&r.type===type);r.locked=false;r.bombLocked=false;g.enter(r.id,'top');return g}
test('ordinary, challenge and resource rooms have larger mixed groups without duplicated runners or medics',()=>{
 for(let f=1;f<=5;f++)for(const type of ['fight','challenge']){const g=room(f,type);const counts=new Set();for(let v=0;v<9;v++){g.room.seed=v;g.room.encounterProfile=v%8;const mobs=spawnEncounter(g,g.room);counts.add(mobs.length);assert.equal(mobs.length,5+f+Math.floor(v/3)+(type==='challenge'?1:0)-(g.room.crowdingPenalty||0));for(const t of ['runner','stitchMedic','conductor'])assert.ok(mobs.filter(e=>e.type===t).length<=1)}assert.equal(counts.size,3)}
 for(const type of ['vault','cache']){const g=room(1,type),min=type==='vault'?4:3;assert.ok(g.room.enemies.length>=min&&g.room.enemies.length<=min+2)}
});
test('frontline health improves while runners and support units keep their old health',()=>{
 const g=room(3,'fight');for(const [type,extra] of Object.entries({brute:2,forklift:3,stitchling:2,warden:2,loader:1,runner:0,conductor:0,stitchMedic:0})){const e=g.spawn(type,200,200),base=(type==='brute'?4:type==='runner'?2:3)+3;assert.equal(e.hp,base+extra);assert.equal(e.hp,e.maxHp)}
});
test('non-boss fights move faster and shoot sooner without shortening visible wind-ups',()=>{
 for(const type of ['fight','challenge','vault','cache']){const g=room(2,type),e=g.spawn('echoBell',200,200);g.enemyAttack(e);assert.equal(e.cd,2.8*.85);assert.equal(e.mobCast.wind,.65);assert.equal(g.moveScale(e),1.1)}
 const g=room(2,'boss'),e=g.spawn('echoBell',200,200);g.enemyAttack(e);assert.equal(e.cd,2.8);assert.equal(g.moveScale(e),1);
});
test('even thirteen-monster groups fit every layout with safe entry space',()=>{
 const g=new Game();g.start();g.floor=5;
 for(const layout of [...LAYOUTS,...CHAPTER_LAYOUTS.flat()])for(const [x,y] of [[95,300],[865,300],[480,90],[480,510]]){
  g.p.x=x;g.p.y=y;const r={layoutId:layout.id,obstacles:layout.build(),hazards:[],type:'challenge',seed:8};const mobs=spawnEncounter(g,r);assert.equal(mobs.length,13);
  for(let i=0;i<mobs.length;i++){const e=mobs[i];assert.ok(!blocked(r,e.x,e.y,e.r));assert.ok(Math.hypot(e.x-x,e.y-y)>=150);for(const other of mobs.slice(0,i))assert.ok(Math.hypot(e.x-other.x,e.y-other.y)>=60)}
 }
});
test('resource guards also leave room to move at every entrance',()=>{
 for(const type of ['vault','cache'])for(const side of ['left','right','top','bottom']){const g=new Game();g.start();const r=g.rooms.find(r=>r.exists&&r.type===type);r.seed=8;r.locked=false;r.bombLocked=false;g.enter(r.id,side);assert.equal(r.enemies.length,type==='vault'?6:5);assert.ok(r.enemies.every(e=>Math.hypot(e.x-g.p.x,e.y-g.p.y)>=160))}
});
