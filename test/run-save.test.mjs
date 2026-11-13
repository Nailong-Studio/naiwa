import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
import {serializeRun,deserializeRun,createRunStore,RUN_SAVE_KEY} from '../dist/run-save.js';
import {beginRevive,finishRevive,advanceRevive} from '../dist/revive.js';
import {triggerSandy} from '../dist/chrono-items.js';
import {startRescue} from '../dist/rescue.js';
import {startCraneGate} from '../dist/crane-gates.js';
const fresh=()=>{const g=new Game();g.start();return g};
const roundtrip=g=>deserializeRun(serializeRun(g)).game;
const storage=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)}};

test('resume restores the actual room, player stats, resources, enemies and map without generating a new floor',()=>{
 const g=fresh();g.floor=4;g.generate();g.enter(g.rooms.find(r=>r.exists&&r.type==='fight').id,'left');
 g.items=['belly','feet','tissue','phoebe'];g.p.damage=1.35;g.p.speed=275;g.p.rate=.28/1.35;g.p.hp=3;g.coins=17;g.keys=4;g.bombs=7;g.activeCharge=24;g.elapsed=123.45;
 g.room.enemies[0].hp=1;g.room.loot.push({type:'coin',x:300,y:300,amount:2});g.room.obstacles.pop();
 const text=serializeRun(g,{costume:'deepseek',now:1234}),s=deserializeRun(text),r=s.game;
 assert.equal(s.costume,'deepseek');assert.equal(s.savedAt,1234);assert.equal(r.floor,4);assert.equal(r.roomId,g.roomId);
 assert.deepEqual(r.p,g.p);assert.deepEqual(r.rooms,g.rooms);assert.equal(r.coins,17);assert.equal(r.keys,4);assert.equal(r.activeCharge,24);assert.equal(r.elapsed,123.45);
 assert.deepEqual(r.items,g.items);assert.equal(r.room.enemies[0].hp,1);assert.equal(r.events.length,0);assert.ok(r instanceof Game);r.update(.02,{});
});
test('piercing hit history and attack owner retain identity, so resume neither re-hits nor detaches attacks',()=>{
 const g=fresh(),e=g.spawn('brute',600,300);g.room.enemies=[e];g.room.clear=false;g.items=['tongue'];g.shoot(1,0);
 const b=g.bullets[0];b.hits.add(e);b.x=e.x;b.y=e.y;b.vx=b.vy=0;
 g.effects.push({type:'milkBottle',owner:e,x:200,y:200,life:.6,max:1,radius:50});
 g.followerStates={dog:{target:e,hits:new Map([[e,.5]])}};
 const r=roundtrip(g),enemy=r.room.enemies[0],hp=enemy.hp;
 assert.ok(r.bullets[0].hits.has(enemy));assert.equal(r.effects[0].owner,enemy);assert.equal(r.followerStates.dog.target,enemy);assert.equal(r.followerStates.dog.hits.get(enemy),.5);
 r.update(.01,{});assert.equal(enemy.hp,hp);
});
test('permanent wires, active cooldowns and shared shot counters survive repeated saves',()=>{
 const g=fresh();g.phoebeWires=[{points:[{x:100,y:100},{x:300,y:100}],until:Infinity,source:'player',width:9}];
 g.room.sandyUsed=true;g.gojoReadyAt=88;g.p.dashCD=1.4;g.reviveUsed=true;
 g.shoot(1,0);g.shoot(1,0);const group={counted:true};for(const b of g.bullets)b.group=group;
 const r=roundtrip(roundtrip(g));assert.equal(r.phoebeWires[0].until,Infinity);assert.equal(r.bullets[0].group,r.bullets[1].group);assert.equal(r.bullets[0].group.counted,true);assert.equal(r.p.dashCD,1.4);assert.equal(r.gojoReadyAt,88);assert.equal(r.reviveUsed,true);assert.equal(r.room.sandyUsed,true);
});
test('reload does not restock bought items, reset services or refill exchange quotas',()=>{
 let g=fresh();g.coins=100;g.keys=20;g.p.x=480;g.p.y=260;g.interact();assert.ok(g.choose('trade_key_bomb'));
 const shop=g.rooms.find(r=>r.exists&&r.type==='shop');g.enter(shop.id,'top');g.offer('shop');const item=g.choices[0];assert.ok(g.choose(item.id));g.offer('shop');assert.ok(g.choose('service_reroll'));
 const stock=g.room.shopStock.map(i=>i.id),coins=g.coins;g=roundtrip(g);
 assert.equal(g.coins,coins);assert.deepEqual(g.room.shopStock.map(i=>i.id),stock);assert.equal(g.room.shopSold[0].id,item.id);assert.equal(g.room.serviceUses.service_reroll,1);
 assert.equal(g.room.shopStock,g.floorEconomy[g.floor].stock);assert.equal(g.rooms[12].exchanges,g.floorEconomy[g.floor].exchanges);
 g.enter(12,'left');g.p.x=480;g.p.y=260;g.interact();assert.equal(g.choose('trade_key_bomb'),false);assert.equal(g.room.exchanges.trade_key_bomb,1);g.leaveChoice();
 g=roundtrip(g);assert.equal(g.room.exchanges.trade_key_bomb,1);g.enter(shop.id,'top');g.offer('shop');assert.deepEqual(g.room.shopStock.map(i=>i.id),stock);
});
test('a saved selection resumes the same offered item and applies its stat change only once',()=>{
 const g=fresh();g.enter(g.rooms.find(r=>r.exists&&r.type==='treasure').id,'top');const ids=g.choices.map(i=>i.id);
 const r=roundtrip(g);assert.equal(r.mode,'choice');assert.deepEqual(r.choices.map(i=>i.id),ids);assert.ok(r.choose(ids[0]));const p={...r.p};
 const again=roundtrip(r);assert.deepEqual(again.p,p);assert.equal(again.choose(ids[0]),false);assert.equal(again.items.filter(id=>id===ids[0]).length,1);
});
test('death persists as death; interrupted revival requires a new watch; used resurrection cannot be restored',()=>{
 const g=fresh();g.p.hp=1;g.p.inv=0;g.hurt();const store=createRunStore(storage());assert.ok(store.write(g));let r=store.read().game;assert.equal(r.mode,'dead');assert.equal(r.p.hp,0);
 assert.ok(beginRevive(r));advanceRevive(r,.25);r=roundtrip(r);assert.equal(r.mode,'dead');assert.equal(r.reviveWatch,null);
 beginRevive(r);for(let i=0;i<40;i++)advanceRevive(r,.25);assert.ok(finishRevive(r));r=roundtrip(r);assert.equal(r.p.hp,3);assert.equal(r.reviveUsed,true);
 r.p.hp=1;r.p.inv=0;r.hurt();assert.ok(store.write(r));assert.equal(store.read().status,'empty');
});
test('rescue presses and animation progress resume, victory clears the active save',()=>{
 const g=fresh();g.floor=5;startRescue(g);g.rescue.presses=17;g.rescue.t=5;
 const r=roundtrip(g);assert.equal(r.mode,'rescue');assert.equal(r.rescue.presses,17);assert.equal(r.rescue.t,5);
 const store=createRunStore(storage());store.write(r);r.mode='win';assert.ok(store.write(r));assert.equal(store.read().status,'empty');
});
test('all chapter bosses can serialize mid-attack and keep updating after resume',()=>{
 for(let floor=1;floor<=5;floor++){
  let g=fresh();g.floor=floor;g.generate();g.enter(g.rooms.find(r=>r.exists&&r.type==='boss').id,'top');g.p.hp=g.p.maxHp=500;g.items=['sandevistan','phoebe','phoebewire','dog','gojohalf'];
  if(floor===3)startCraneGate(g,g.room.enemies[0]);
  for(let n=0;n<160;n++){
   g.update(.04,{mx:Math.cos(n*.1),my:Math.sin(n*.1),fire:true,ax:1,dash:n%60===0});
   if(n===30)triggerSandy(g);
   if(n%20===0)g=roundtrip(g);
  }
  assert.ok(Number.isFinite(g.p.hp));assert.equal(g.floor,floor);
 }
});
test('bad or newer saves and storage errors are recoverable and cannot overwrite the last good save',()=>{
 const mem=storage(),store=createRunStore(mem),g=fresh();assert.equal(store.read().status,'empty');store.write(g);const good=mem.getItem(RUN_SAVE_KEY);
 mem.setItem=()=>{throw Error('quota')};g.coins=88;assert.equal(store.write(g),false);assert.equal(mem.getItem(RUN_SAVE_KEY),good);assert.equal(store.read().game.coins,0);
 assert.throws(()=>deserializeRun('{'));const bad=JSON.parse(good);bad.version=99;assert.throws(()=>deserializeRun(JSON.stringify(bad)));
 assert.equal(createRunStore({getItem(){throw Error('disabled')}}).read().status,'error');
 const polluted=JSON.parse(good);polluted.graph.nodes[0].data.push(['__proto__',{ref:0}]);assert.throws(()=>deserializeRun(JSON.stringify(polluted)));assert.equal({}.polluted,undefined);
});
