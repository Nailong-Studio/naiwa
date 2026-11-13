import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,ITEMS} from '../dist/campaign.js';
import {updatePhoebe,touchesPhoebeWire,PHOEBE_ITEMS} from '../dist/phoebe-items.js';
import {updateMemeFollowers} from '../dist/meme-followers.js';
import {memeDamage,updateMeme} from '../dist/meme-items.js';
const advance=(g,t,input={})=>{for(let n=0;n<Math.ceil(t/.02);n++)g.update(.02,input)};
function setup(ids=[]){const g=new Game(()=>.42);g.start();g.items=ids;g.room.type='fight';g.room.clear=false;g.room.obstacles=[];g.room.hazards=[];g.p.x=300;g.p.y=300;g.p.inv=999;g.enemySpeed=()=>0;const e=g.spawn('turret',550,348);e.hp=100;e.cd=999;g.room.enemies=[e];return g}
test('Phoebe physically winds up and unrolls a plug before creating a live wire, never fires generic bullets',()=>{
 const g=setup(['phoebe']);updatePhoebe(g,.7,.7,g.p);const s=g.phoebe;assert.equal(s.phase,'windup');assert.equal(g.phoebeWires.length,0);
 updatePhoebe(g,.36,.36,g.p);assert.equal(s.phase,'unroll');assert.equal(g.phoebeWires.length,0);assert.equal(g.bullets.length,0);
 updatePhoebe(g,.2,.2,g.p);assert.equal(g.room.enemies[0].hp,100);updatePhoebe(g,.21,.21,g.p);assert.equal(g.phoebeWires.length,1);assert.ok(touchesPhoebeWire(g,g.room.enemies[0]));updatePhoebe(g,.02,.02,g.p);assert.ok(Math.abs(g.room.enemies[0].hp-98.5)<1e-9);assert.equal(g.bullets.length,0);
});
test('dash wires follow movement, persist in the room, have bounded count and cannot stack damage or hit flying enemies',()=>{
 const g=setup(['phoebewire']);advance(g,.02,{dash:true,mx:1});advance(g,.3,{});assert.equal(g.phoebeWires.length,1);const w=g.phoebeWires[0];assert.ok(w.points.length>1);
 const e=g.room.enemies[0];e.x=w.points[1].x;e.y=w.points[1].y;g.phoebeWires.push({...w});updatePhoebe(g,.02,.02,g.p);assert.ok(Math.abs(e.hp-98)<1e-9);updatePhoebe(g,.02,.02,g.p);assert.ok(Math.abs(e.hp-98)<1e-9);e.airborne=true;assert.equal(touchesPhoebeWire(g,e),false);e.airborne=false;g.elapsed=1000;updatePhoebe(g,.02,.02,g.p);assert.equal(g.phoebeWires.length,2);g.enter(g.rooms.find(r=>r.exists&&r.id!==g.roomId).id,'top');assert.equal(g.phoebeWires.length,0);
});
test('plug applies speed and range once to all normal volley beams but leaves companions unchanged',()=>{
 const g=setup(['phoebeplug','double','fanvoice']);g.shoot(1,0);assert.equal(g.bullets.length,6);assert.ok(g.bullets.every(b=>Math.abs(Math.hypot(b.vx,b.vy)-490*1.15)<1e-9));assert.ok(g.bullets.every(b=>Math.abs(b.life-(b.vy===0?1.35:.42)*1.2/1.15)<1e-9));g.shoot(1,0,true);assert.equal(Math.hypot(g.bullets.at(-1).vx,g.bullets.at(-1).vy),490);
});
test('soot protection is once per combat room, does not block contact and cannot refresh on revisits',()=>{
 const g=setup(['phoebesoot']);g.p.inv=0;g.hurtGround();assert.equal(g.p.hp,6);assert.equal(g.phoebeBoost,1.5);assert.equal(g.room.phoebeSootUsed,true);g.p.inv=0;g.hurtGround();assert.equal(g.p.hp,5);g.p.inv=0;g.hurt();assert.equal(g.p.hp,4);
 const id=g.roomId;g.enter(g.rooms.find(r=>r.exists&&r.type==='fight'&&r.id!==id).id,'top');g.enter(id,'top');g.p.inv=0;g.hurtGround();assert.equal(g.p.hp,3);
 const safe=setup(['phoebesoot']);safe.room.clear=true;safe.p.inv=0;safe.hurtGround();assert.equal(safe.p.hp,5);assert.ok(!safe.room.phoebeSootUsed);
});
test('boots are used before soot protection and pause freezes all new timers',()=>{
 const g=setup(['phoebesoot','milkboots','phoebe']);g.p.inv=0;g.hurtGround();assert.equal(g.bootGuardCD,8);assert.ok(!g.room.phoebeSootUsed);g.p.inv=0;g.hurtGround();assert.equal(g.room.phoebeSootUsed,true);g.mode='paused';const t=g.phoebeBoost;advance(g,2);assert.equal(g.phoebeBoost,t);assert.equal(g.phoebe,null);
});
test('tempura drops finite physical supplies, buffs only after landing and pickup, and cannot farm revisits',()=>{
 const g=setup(['tempura']);updateMemeFollowers(g,0);let s=g.memePets.tempura;s.cd=0;updateMemeFollowers(g,0);updateMemeFollowers(g,.4);assert.equal(g.bullets.length,0);assert.equal(g.shrimpMeals.length,1);const meal=g.shrimpMeals[0];g.p.x=meal.x;g.p.y=meal.y;updateMemeFollowers(g,.2);assert.ok(!g.tempuraBuff);updateMemeFollowers(g,.16);assert.equal(g.tempuraBuff,10);assert.equal(memeDamage(g),1.45);assert.equal(g.shrimpMeals.length,0);
 updateMemeFollowers(g,9);updateMemeFollowers(g,0);updateMemeFollowers(g,.4);assert.equal(g.room.tempuraServings,2);g.shrimpMeals=[];s.phase='idle';s.cd=0;updateMemeFollowers(g,0);assert.equal(s.phase,'idle');const id=g.roomId;g.enter(g.rooms.find(r=>r.exists&&r.type==='fight'&&r.id!==id).id,'top');g.enter(id,'top');assert.equal(g.room.tempuraServings,2);assert.equal(g.tempuraBuff,0);
});
test('phone interrupts ordinary ranged windup and damages bosses without cancelling their attacks',()=>{
 const g=setup(['sun','politesuit']),e=g.room.enemies[0];e.x=400;e.y=300;e.mobCast={kind:'cross',t:0,wind:.8};g.enemyBullets=[{x:100,y:100,vx:50,vy:0,r:5,life:2}];updateMemeFollowers(g,0);const s=g.memePets.sun;s.cd=0;updateMemeFollowers(g,0);updateMemeFollowers(g,.4);assert.equal(e.mobCast,null);assert.equal(e.phoneMutedUntil,3.2);assert.equal(g.bullets.length,0);assert.equal(g.enemyBullets.length,1);g.enemyAttack(e);assert.equal(g.enemyBullets.length,1);
 const boss=g.makeBoss('collector',400,300);g.room.enemies=[boss];s.cd=0;s.phase='idle';const hp=boss.hp;updateMemeFollowers(g,0);assert.equal(s.phase,'windup');updateMemeFollowers(g,.4);assert.ok(boss.hp<hp);assert.equal(boss.phoneMutedUntil,undefined);
});
test('rolling stones bounce but fall in pits, skip flyers and stop after three ground hits even in a cluster',()=>{
 const g=setup(['penguin']);updateMemeFollowers(g,0);const s=g.memePets.penguin;s.cd=0;updateMemeFollowers(g,0);updateMemeFollowers(g,.4);const b=g.bullets[0];assert.ok(b.rollingRock&&b.pierce&&b.bounce===1);const fly=g.spawn('hopper',b.x,b.y);assert.equal(g.canBulletHit(fly,b),false);
 g.room.obstacles=[{kind:'pit',x:b.x,y:b.y,w:40,h:40,r:20}];assert.equal(g.projectileBlocked(b,false),true);g.room.obstacles=[];
 g.room.enemies=Array.from({length:5},()=>{const e=g.spawn('turret',500,300);e.hp=100;e.cd=999;return e});b.x=500;b.y=300;b.vx=b.vy=0;b.life=2;g.update(.02);assert.equal(g.room.enemies.filter(e=>e.hp<100).length,3);assert.equal(g.bullets.length,0);
});
test('all four Phoebe items are obtainable and every role remains separate',()=>{const g=setup();for(const item of PHOEBE_ITEMS){assert.ok(ITEMS.some(i=>i.id===item.id));g.choices=[item];g.mode='choice';assert.ok(g.choose(item.id))}assert.equal(new Set(PHOEBE_ITEMS.map(i=>i.id)).size,4);});

test('wire ticks every 0.4 seconds per enemy and overlapping lines cannot double the tick',()=>{
 const g=setup(['phoebe','phoebewire']),e=g.room.enemies[0];
 g.phoebeWires=[{points:[{x:e.x-50,y:e.y},{x:e.x+50,y:e.y}],until:Infinity,width:9,damage:2.4},{points:[{x:e.x,y:e.y-50},{x:e.x,y:e.y+50}],until:Infinity,width:9,damage:1.5}];
 const hp=e.hp;updatePhoebe(g,0,0,g.p);assert.ok(Math.abs(hp-e.hp-2.4)<1e-9);
 g.elapsed=.399;updatePhoebe(g,0,0,g.p);assert.ok(Math.abs(hp-e.hp-2.4)<1e-9);
 g.elapsed=.4;updatePhoebe(g,0,0,g.p);assert.ok(Math.abs(hp-e.hp-4.8)<1e-9);
 updatePhoebe(g,0,0,g.p);assert.ok(Math.abs(hp-e.hp-4.8)<1e-9);
 g.elapsed=.8;updatePhoebe(g,0,0,g.p);assert.ok(Math.abs(hp-e.hp-7.2)<1e-9);
});

test('existing player wire updates from current attack and temporary buffs without consuming empowered shots',()=>{
 const g=setup(['phoebewire']),e=g.room.enemies[0];
 g.phoebeWasDash=true;g.phoebeTrace=[{x:500,y:348},{x:600,y:348}];g.p.x=600;g.p.y=348;
 updatePhoebe(g,0,0,g.p);const wire=g.phoebeWires[0];assert.equal(wire.source,'player');assert.equal(e.hp,98);
 g.p.damage=10;g.elapsed=.4;updatePhoebe(g,0,0,g.p);assert.ok(Math.abs(e.hp-90.6)<1e-9);assert.ok(Math.abs(wire.damage-7.4)<1e-9);
 g.items.push('phoebe','man','deepthink');g.tempuraBuff=10;g.manReady=true;g.deepReady=true;
 g.elapsed=.8;updatePhoebe(g,0,0,g.p);assert.ok(Math.abs(wire.damage-(1.4+10*1.45*.6)*1.2)<1e-9);
 assert.equal(g.manReady,true);assert.equal(g.deepReady,true);assert.equal(g.bullets.length,0);
 g.tempuraBuff=0;g.elapsed=1.2;updatePhoebe(g,0,0,g.p);assert.ok(Math.abs(wire.damage-7.4*1.2)<1e-9);
});

test('wire attack matches unempowered player damage across attribute combinations; follower wires cap their scaling',()=>{
 for(const ids of [['heavyvoice','double','scarf','mints'],['rollwood','politesuit','fanvoice','wrongmodel'],['returnvoice','milkfilter']]){
  const g=setup(['phoebewire',...ids]),e=g.room.enemies[0];g.p.damage=4;g.p.hp=2;g.tempuraBuff=3;g.room.deepModel='think';
  g.shoot(1,0);const attack=Math.max(...g.bullets.map(b=>b.damage));
  g.phoebeWasDash=true;g.phoebeTrace=[{x:500,y:348},{x:600,y:348}];g.p.x=600;g.p.y=348;
  updatePhoebe(g,0,0,g.p);assert.ok(Math.abs(g.phoebeWires[0].damage-(1.4+attack*.6))<1e-9);
 }
 const g=setup(['phoebe']),e=g.room.enemies[0];g.p.damage=100;g.tempuraBuff=10;
 g.phoebeWires=[{points:[{x:500,y:348},{x:600,y:348}],until:Infinity,width:5}];
 updatePhoebe(g,0,0,g.p);assert.equal(e.hp,96.8);
});


test('Phoebe-owned wires update existing damage, cap at 3.2 and fall back when buffs expire',()=>{
 const g=setup(['phoebe']),e=g.room.enemies[0];
 updatePhoebe(g,.7,.7,g.p);updatePhoebe(g,.36,.36,g.p);updatePhoebe(g,.41,.41,g.p);
 const w=g.phoebeWires[0];assert.equal(w.source,'phoebe');assert.equal(w.damage,1.5);
 g.p.damage=3;updatePhoebe(g,0,0,g.p);assert.ok(Math.abs(w.damage-2.7)<1e-9);
 g.tempuraBuff=10;g.elapsed=.4;const hp=e.hp;updatePhoebe(g,0,0,g.p);assert.equal(w.damage,3.2);assert.ok(Math.abs(hp-e.hp-3.2)<1e-9);
 g.phoebeWires.push({...w});g.elapsed=.8;const hp2=e.hp;updatePhoebe(g,0,0,g.p);assert.ok(Math.abs(hp2-e.hp-3.2)<1e-9);
 g.tempuraBuff=0;g.elapsed=1.2;updatePhoebe(g,0,0,g.p);assert.ok(Math.abs(w.damage-2.7)<1e-9);
 g.p.damage=100;g.elapsed=1.6;updatePhoebe(g,0,0,g.p);assert.equal(w.damage,3.2);
});
