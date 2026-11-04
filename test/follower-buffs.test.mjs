import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
import {updateFollowers} from '../dist/follower-combat.js';
import {updateMemeFollowers} from '../dist/meme-followers.js';
import {updateDeepseek} from '../dist/deepseek-items.js';
import {updatePhoebe} from '../dist/phoebe-items.js';
import {updateActive} from '../dist/combat-content.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function game(ids=[]){const g=new Game(()=>.42);g.start();g.items=ids;g.room.type='fight';g.room.clear=false;g.room.obstacles=[];g.room.hazards=[];g.room.loot=[];g.p.inv=999;g.enemySpeed=()=>0;const e=g.spawn('turret',650,330);e.hp=e.maxHp=1000;e.cd=999;g.room.enemies=[e];return g}
test('attacking companions gain bounded scaling without inheriting player multishot or periodic bonuses',()=>{
 for(const damage of [1,100])for(const [id,base,cap,cd] of [['kobe',2.6,5,2.1],['penguin',2.25,4.5,2.7],['ricewhale',1.85,4.8,1.8],['egg',1.8,4,1.65]]){
  const g=game([id,'double','fanvoice','man','deepthink']);g.p.damage=damage;g.manReady=g.deepReady=true;
  let state;if(id==='egg'){updateFollowers(g,0);state=g.followerStates.egg;updateFollowers(g,.26)}else if(id==='ricewhale'){updateDeepseek(g,.6,.6,{});state=g.whale;updateDeepseek(g,.33,.33,{})}else{updateMemeFollowers(g,0);state=g.memePets[id];state.cd=0;updateMemeFollowers(g,0);updateMemeFollowers(g,.4)}
  assert.equal(g.bullets.length,1,id);const b=g.bullets[0];assert.ok(b.pet);close(b.damage,damage===1?base:cap);close(state.cd,cd);assert.ok(g.manReady&&g.deepReady,id+' does not consume player readiness');
 }
});
test('dog keeps physical contact and cover requirements while scaling damage and recovering sooner',()=>{
 for(const damage of [1,100]){const g=game(['dog']);g.p.damage=damage;updateFollowers(g,0);const s=g.followerStates.dog,e=g.room.enemies[0];s.target=e;s.phase='lunge';s.clock=0;s.x=e.x;s.y=e.y;updateFollowers(g,.01);close(e.hp,1000-(damage===1?3.25:6));close(s.cd,.85);assert.equal(s.phase,'recover');updateFollowers(g,.02);close(e.hp,1000-(damage===1?3.25:6))}
 const g=game(['dog']);updateFollowers(g,0);const s=g.followerStates.dog,e=g.room.enemies[0];s.phase='lunge';s.target=e;s.clock=0;s.x=e.x-30;s.y=e.y;g.room.obstacles=[{kind:'rock',x:e.x-15,y:e.y,w:8,h:80,r:4}];updateFollowers(g,.01);assert.equal(e.hp,1000);
});
test('rabbit reaches beyond active laugh radius, cannot hit through walls or refill the skill',()=>{
 const g=game(['rabbit']);const e=(x,y)=>{const e=g.spawn('turret',x,y);e.hp=100;return e};const outer=e(480,530),blocked=e(680,300),far=e(800,300);g.room.enemies=[outer,blocked,far];g.room.obstacles=[{kind:'rock',x:580,y:300,w:30,h:60,r:20}];g.activeCharge=g.activeCost();updateActive(g,.02,{active:true});assert.equal(outer.hp,100);
 for(let i=0;i<60;i++)updateFollowers(g,.02);close(outer.hp,97.2);assert.equal(blocked.hp,100);assert.equal(far.hp,100);assert.equal(g.activeCharge,0);assert.equal(g.rabbitWave,null);
});
test('mouse travels to and collects bombs beyond the previous pickup radius',()=>{
 const g=game(['mouse']),before=g.bombs;g.drop('bomb',g.p.x+230,g.p.y,2);for(let i=0;i<120;i++)g.update(.02,{});assert.equal(g.bombs,before+2);assert.equal(g.room.loot.length,0);
});
test('turtle keeps its exact orbit and continuous block; sweet penguin reaches farther with its own cooldown',()=>{
 const g=game(['turtle']);g.elapsed=.5;updateFollowers(g,0);const s=g.followerStates.turtle;close(s.x,g.p.x+Math.cos(1)*56);close(s.y,g.p.y+Math.sin(1)*56);
 for(let i=0;i<2;i++){g.enemyBullets=[{x:s.x+37,y:s.y,r:6}];updateFollowers(g,0);assert.equal(g.enemyBullets.length,0)}
 const h=game(['sweetpenguin']);h.enemyBullets=[{x:h.p.x+170,y:h.p.y,vx:-250,vy:0,r:6}];updateMemeFollowers(h,0);h.memePets.sweetpenguin.cd=0;updateMemeFollowers(h,0);updateMemeFollowers(h,.19);assert.equal(h.enemyBullets.length,0);assert.equal(h.memePets.sweetpenguin.cd,3);
});
test('Phoebe reaches the extended target and her overlapping wires still damage only once per tick',()=>{
 const g=game(['phoebe']),e=g.room.enemies[0];e.x=g.p.x+340;e.y=g.p.y+48;updatePhoebe(g,.7,.7,g.p);updatePhoebe(g,.36,.36,g.p);updatePhoebe(g,.41,.41,g.p);assert.equal(g.phoebeWires.length,1);const w=g.phoebeWires[0];assert.ok(Math.hypot(w.points[1].x-w.points[0].x,w.points[1].y-w.points[0].y)>220);assert.equal(g.phoebe.cd,3.8);assert.equal(w.until,Infinity);
 g.phoebeWires.push({...w});updatePhoebe(g,.02,.02,g.p);close(e.hp,998.5);updatePhoebe(g,.02,.02,g.p);close(e.hp,998.5);
});
test('tempura supplies arrive earlier, last longer and retain the two-serving per-room limit',()=>{
 const g=game(['tempura']);for(let i=0;i<96;i++)updateMemeFollowers(g,.02);assert.equal(g.shrimpMeals.length,1);assert.equal(g.room.tempuraServings,1);const m=g.shrimpMeals[0];g.p.x=m.x;g.p.y=m.y;updateMemeFollowers(g,.36);assert.equal(g.tempuraBuff,10);assert.equal(g.shrimpMeals.length,0);
 const s=g.memePets.tempura;g.room.tempuraServings=2;s.phase='idle';s.cd=0;updateMemeFollowers(g,0);assert.equal(s.phase,'idle');assert.equal(g.shrimpMeals.length,0);
});
test('starter tadpole scales modestly while retaining fast single-target fire',()=>{
 for(const damage of [1,100]){const g=game(['tadpole']);g.p.damage=damage;g.update(.02,{});assert.equal(g.bullets.length,1);close(g.bullets[0].damage,damage===1?.8:1.6);close(g.p.petCD,.55)}
});
