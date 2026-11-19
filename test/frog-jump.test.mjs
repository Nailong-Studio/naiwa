import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
import {blocked,moveOnTerrain} from '../dist/terrain.js';
import {FROG_JUMP_SECONDS,FROG_JUMP_SPEED} from '../dist/frog-jump.js';
import {serializeRun,deserializeRun} from '../dist/run-save.js';

const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const obstacle=(kind,x=280,y=300,w=48,h=48)=>({kind,x,y,w,h,r:24,hp:3});
function fresh(obstacles=[]){
 const g=new Game(()=>.42);g.start();
 Object.assign(g.room,{obstacles,hazards:[],enemies:[],clear:false,type:'fight',loot:[]});
 Object.assign(g.p,{x:200,y:300,inv:999});
 return g;
}
function finish(g,dt=.02){let steps=0;while(g.p.dash>0&&steps++<100)g.update(dt,{});assert.equal(g.p.dash,0);return g}

test('walking stops at cover; a frog jump crosses each narrow obstacle without destroying it',()=>{
 for(const kind of ['rock','crate','pit','pillar','barrel']){
  const o=obstacle(kind),walk=fresh([o]);
  for(let i=0;i<20;i++)walk.update(.04,{mx:1});
  assert.ok(walk.p.x<235,kind);assert.equal(blocked(walk.room,walk.p.x,walk.p.y,walk.p.r),false);
  const g=fresh([o]);g.update(.04,{dash:true,mx:1});finish(g);
  near(g.p.x,200+FROG_JUMP_SPEED*FROG_JUMP_SECONDS);near(g.p.y,300);
  assert.equal(blocked(g.room,g.p.x,g.p.y,g.p.r),false,kind);assert.ok(g.room.obstacles.includes(o),kind);
 }
});

test('airborne position can pass over cover, while ground enemies still collide',()=>{
 const g=fresh([obstacle('rock')]);g.update(.04,{dash:true,mx:1});g.update(.04,{});g.update(.04,{});
 assert.ok(g.p.dash>0);assert.equal(blocked(g.room,g.p.x,g.p.y,g.p.r),true);
 const enemy={type:'runner',x:360,y:300,r:21};moveOnTerrain(g.room,enemy,200,300);
 assert.ok(enemy.x<235);finish(g);assert.equal(blocked(g.room,g.p.x,g.p.y,g.p.r),false);
});

test('landing checks the whole body, and a gap wider than jump range stops on the near bank',()=>{
 for(const o of [obstacle('rock',390),obstacle('pit',350,300,220)]){
  const g=fresh([o]);g.update(.02,{dash:true,mx:1});finish(g);
  assert.equal(blocked(g.room,g.p.x,g.p.y,g.p.r),false);
  assert.ok(g.p.x<=o.x-o.w/2-g.p.r);assert.ok(g.p.x>=200);
 }
});

test('two adjacent tiles can be crossed; a three-tile barrier does not extend jump range',()=>{
 for(const count of [2,3]){
  const obstacles=Array.from({length:count},(_,i)=>obstacle('crate',250+i*52));
  const g=fresh(obstacles);g.update(.02,{dash:true,mx:1});finish(g);
  assert.ok(g.p.x<=200+FROG_JUMP_SPEED*FROG_JUMP_SECONDS+.001);
  assert.equal(blocked(g.room,g.p.x,g.p.y,g.p.r),false);
  if(count===2)assert.ok(g.p.x>346);else assert.ok(g.p.x<=205);
 }
});

test('jump range is consistent at different frame rates, and diagonal input is normalized',()=>{
 for(const dt of [.04,.02,1/60,1/144]){
  for(const input of [{mx:1,my:0},{mx:1,my:1},{mx:.5,my:0}]){
   const g=fresh();g.update(dt,{...input,dash:true});finish(g,dt);
   near(Math.hypot(g.p.x-200,g.p.y-300),FROG_JUMP_SPEED*FROG_JUMP_SECONDS*Math.min(1,Math.hypot(input.mx,input.my)));
  }
 }
});

test('closed room boundaries and corners cannot be jumped out of',()=>{
 for(const [x,y,mx,my] of [[60,200,-1,0],[900,200,1,0],[300,60,0,-1],[300,540,0,1],[900,540,1,1]]){
  const g=fresh();g.p.x=x;g.p.y=y;g.update(.02,{mx,my,dash:true});finish(g);
  assert.ok(g.p.x>=49&&g.p.x<=911&&g.p.y>=49&&g.p.y<=551);
  assert.equal(g.p.frogJump,undefined);
 }
});

test('an obstacle created during flight is rechecked at landing',()=>{
 const g=fresh();g.update(.02,{dash:true,mx:1});g.room.obstacles.push(obstacle('rock',368));finish(g);
 assert.equal(blocked(g.room,g.p.x,g.p.y,g.p.r),false);assert.ok(g.p.x<=323);
});

test('an autosave above a pit resumes the same trajectory and lands safely',()=>{
 let g=fresh([obstacle('pit')]);g.update(.04,{dash:true,mx:1});g.update(.04,{});g.update(.04,{});
 assert.equal(blocked(g.room,g.p.x,g.p.y,g.p.r),true);
 const expected=g.p.frogJump.toX;g=deserializeRun(serializeRun(g)).game;finish(g);
 near(g.p.x,expected);assert.equal(blocked(g.room,g.p.x,g.p.y,g.p.r),false);
});

test('changing rooms or floors clears the airborne trajectory',()=>{
 const g=fresh();g.update(.02,{dash:true,mx:1});assert.ok(g.p.frogJump);
 const id=g.rooms.find(r=>r.exists&&r.type==='fight'&&r.id!==g.roomId).id;g.enter(id,'left');
 assert.equal(g.p.dash,0);assert.equal(g.p.frogJump,undefined);
 g.p.dashCD=0;g.update(.02,{dash:true,mx:1});assert.ok(g.p.frogJump);g.generate();
 assert.equal(g.p.dash,0);assert.equal(g.p.frogJump,undefined);
});

test('older mid-jump saves without a trajectory use only their remaining jump time',()=>{
 const g=fresh();Object.assign(g.p,{dash:.1,dx:1,dy:0,dashCD:1.8});
 finish(g);near(g.p.x,273);assert.equal(g.p.frogJump,undefined);
});

test('cooldown and landing protection still apply to a jumping player',()=>{
 const g=fresh();g.p.inv=0;const hp=g.p.hp;g.update(.02,{dash:true,mx:1});g.hurt();assert.equal(g.p.hp,hp);
 finish(g);g.hurt();assert.equal(g.p.hp,hp);assert.ok(g.p.dashCD>1);
 g.update(.02,{dash:true});assert.equal(g.p.dash,0);
 for(let i=0;i<10;i++)g.update(.02,{});g.hurt();assert.equal(g.p.hp,hp-1);
});
