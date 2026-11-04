import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
import {offerExchange,roomNeighbors,claimResourceRoom,suspiciousWalls,blastResourceDoors} from '../dist/resource-scenes.js';
import {blocked} from '../dist/terrain.js';
import {drawResources} from '../dist/resource-art.js';
const start=()=>{const g=new Game();g.start();return g};
const step=(g,n)=>{for(let t=0;t<n;t+=.02)g.update(.02)};
test('resource rooms exist in every chapter and never lock the resource-free main route',()=>{
 for(let i=0;i<300;i++){const g=start();g.floor=i%5+1;g.generate();const seen=new Set([12]),todo=[12];while(todo.length)for(const n of g.neighbors(todo.shift()))if(g.rooms[n].exists&&!g.rooms[n].locked&&!g.rooms[n].bombLocked&&!seen.has(n)){seen.add(n);todo.push(n)}
  for(const type of ['vault','cache'])assert.equal(g.rooms.filter(r=>r.exists&&r.type===type).length,1);
  for(const r of g.rooms.filter(r=>r.exists&&!r.locked&&!r.bombLocked))assert.ok(seen.has(r.id));
 }
});
test('vault spends a key once, has finite loot, and never grants a second batch on re-entry',()=>{
 const g=start(),r=g.rooms.find(r=>r.exists&&r.type==='vault');g.keys=0;g.enter(r.id,'top');assert.equal(g.roomId,12);assert.equal(r.resourceClaimed,false);g.keys=1;g.enter(r.id,'top');assert.equal(g.keys,0);assert.equal(r.loot.length,0);assert.ok(r.enemies.length>=4&&r.enemies.length<=6);g.random=()=>.8;for(const e of r.enemies)g.damageEnemy(e,999);g.update(.02);assert.equal(r.loot.length,2);
 const coins=g.coins,bombs=g.bombs;for(const l of [...r.loot]){g.p.x=l.x;g.p.y=l.y;g.update(.02)}assert.equal(g.coins,coins+3);assert.equal(g.bombs,bombs+2);
 g.enter(12,'top');g.enter(r.id,'top');assert.equal(g.keys,0);assert.equal(r.loot.length,0);
});
test('only a nearby bomb explosion opens a sealed room, and the real bomb consumes inventory once',()=>{
 const g=start(),r=g.rooms.find(r=>r.exists&&r.type==='cache'),parent=g.neighbors(r.id).find(n=>g.rooms[n].exists&&!g.rooms[n].locked&&!g.rooms[n].bombLocked);
 g.enter(parent,'top');g.mode='play';g.room.clear=true;g.room.enemies=[];g.pickup=null;const door=roomNeighbors(g).find(d=>d.id===r.id);g.enter(r.id,'top');assert.equal(g.roomId,parent);g.boom(480,300,40);assert.equal(r.bombLocked,true);
 g.p.x=door.x;g.p.y=door.y;g.p.inv=99;g.bombs=1;g.update(.02,{bomb:true});g.update(.02,{bomb:true});assert.equal(g.bombs,0);step(g,1.4);assert.equal(r.bombLocked,false);g.enter(r.id,'top');assert.equal(r.loot.length,0);g.p.inv=999;g.random=()=>.6;for(const e of r.enemies)g.damageEnemy(e,999);step(g,5);assert.equal(r.clear,false);assert.equal(r.loot.length,0);step(g,8);assert.equal(r.clear,true);assert.equal(r.loot.find(l=>l.type==='key').amount,2);assert.equal(r.loot.find(l=>l.type==='bomb').amount,1);
 g.enter(parent,'top');g.enter(r.id,'top');assert.equal(r.loot.length,2);
});
test('barter validates funds, offers bounded swaps and sales, and cannot be repeated with stale choices',()=>{
 const g=start();g.keys=0;offerExchange(g);assert.equal(g.choose('trade_key_bomb'),false);assert.equal(g.bombs,2);g.keys=1;assert.equal(g.choose('trade_key_bomb'),false);assert.equal(g.keys,1);g.keys=2;assert.equal(g.choose('trade_key_bomb'),true);assert.equal(g.keys,0);assert.equal(g.bombs,3);assert.equal(g.choose('trade_key_bomb'),false);
 offerExchange(g);assert.ok(!g.choices.some(i=>i.id==='trade_key_bomb'));assert.equal(g.choose('trade_bomb_key'),true);assert.equal(g.keys,1);assert.equal(g.bombs,1);g.bombs=2;
 for(let i=0;i<2;i++){offerExchange(g);assert.ok(g.choose('trade_bomb_coin'))}assert.equal(g.coins,4);offerExchange(g);assert.equal(g.choose('trade_bomb_coin'),false);g.leaveChoice();assert.equal(g.room.pendingItem,undefined);
 g.enter(g.rooms.find(r=>r.exists&&r.type==='shop').id,'top');g.offer('shop');assert.equal(g.choose('trade_key_coin'),false);
});
test('barter stock persists on revisit but refreshes on the next chapter',()=>{
 const g=start();g.keys=2;offerExchange(g);g.choose('trade_key_bomb');g.enter(g.rooms.find(r=>r.exists&&r.type==='shop').id,'top');g.enter(12,'top');offerExchange(g);assert.ok(!g.choices.some(c=>c.id==='trade_key_bomb'));g.leaveChoice();g.floor++;g.generate();offerExchange(g);assert.ok(g.choices.some(c=>c.id==='trade_key_bomb'));
});
test('resource swaps require two units, reject short inventory and never multiply resources',()=>{
 const g=start();g.bombs=1;offerExchange(g);assert.equal(g.choose('trade_bomb_key'),false);assert.equal(g.bombs,1);assert.equal(g.keys,1);assert.ok(g.events.some(e=>e.text==='需要 2 枚炸弹。'));
 g.bombs=2;assert.ok(g.choose('trade_bomb_key'));assert.equal(g.bombs,0);assert.equal(g.keys,2);offerExchange(g);assert.ok(g.choose('trade_key_bomb'));assert.equal(g.keys,0);assert.equal(g.bombs,1);
});
test('resource rooms, counter and locked door hints render without invalid geometry',()=>{
 const labels=[];const ctx=new Proxy({}, {get:(_,key)=>(...args)=>{for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a));if(key==='fillText')labels.push(args[0])},set:()=>true});const g=start();drawResources(ctx,g);
 for(const type of ['vault','cache']){const r=g.rooms.find(r=>r.exists&&r.type===type),parent=g.neighbors(r.id).find(n=>g.rooms[n].exists&&!g.rooms[n].locked&&!g.rooms[n].bombLocked);g.enter(parent,'top');g.room.clear=true;r.revealed=true;drawResources(ctx,g);r.locked=false;r.bombLocked=false;g.enter(r.id,'top');drawResources(ctx,g)}
 assert.ok(labels.includes('豆包的资源回收台'));assert.ok(labels.includes('B 炸墙 · 25% 空'));assert.ok(labels.includes('1 钥匙 · 25% 空'));
});

test('empty resource rooms consume entry costs, roll once and cannot be rerolled by revisiting',()=>{
 for(const roll of [.1,.249,.25,.8]){const g=start(),r=g.rooms.find(r=>r.exists&&r.type==='vault');g.enter(r.id,'top');assert.equal(g.keys,0);g.random=()=>roll;for(const e of r.enemies)g.damageEnemy(e,999);g.update(.02);assert.equal(r.resourceOutcome,roll<.25?'empty':'supplies');assert.equal(r.loot.length,roll<.25?0:2);g.enter(12,'top');g.random=()=>.99;g.enter(r.id,'top');assert.equal(r.loot.length,roll<.25?0:2);assert.equal(r.enemies.filter(e=>!e.dead).length,0)}
});
test('blood exchange spends actual health, ignores shielding, cannot kill, and is limited',()=>{
 const g=start();g.p.hp=2;g.p.shield=true;offerExchange(g);assert.equal(g.choose('trade_blood'),false);assert.equal(g.coins,0);g.p.hp=3;assert.equal(g.choose('trade_blood'),true);assert.equal(g.p.hp,1);assert.equal(g.p.shield,true);assert.equal(g.coins,3);offerExchange(g);assert.equal(g.choose('trade_blood'),false);
});
test('hidden caches roll different reward categories once, including empty and item outcomes',()=>{
 for(const [roll,kind,types] of [[.1,'empty',[]],[.3,'coins',['coin']],[.6,'tools',['key','bomb']],[.8,'healing',['heart','coin']],[.95,'item',[]]]){
  const g=start(),r=g.rooms.find(r=>r.exists&&r.type==='cache');r.bombLocked=false;g.enter(r.id,'top');g.random=()=>roll;claimResourceRoom(g);assert.equal(r.resourceOutcome,kind);assert.deepEqual(r.loot.map(l=>l.type),types);if(kind==='item'){assert.equal(g.mode,'choice');assert.equal(g.choices.length,1)}g.random=()=>.99;claimResourceRoom(g);assert.equal(r.resourceOutcome,kind);assert.equal(r.loot.length,types.length);
 }
});
test('hidden doors stay off the map while free wall clues allow discovery without intel',()=>{
 const g=start(),r=g.rooms.find(r=>r.exists&&r.type==='cache'),parent=g.neighbors(r.id).find(n=>g.rooms[n].exists&&!g.rooms[n].locked&&!g.rooms[n].bombLocked);g.enter(parent,'top');g.room.clear=true;const door=roomNeighbors(g).find(d=>d.id===r.id);assert.equal(g.doors()[door.side],false);r.revealed=true;assert.equal(g.doors()[door.side],true);assert.equal(r.bombLocked,true);r.revealed=false;g.boom(door.x,door.y,60);assert.equal(r.hidden,false);assert.equal(r.revealed,true);assert.equal(r.bombLocked,false);assert.equal(g.doors()[door.side],true);
});

function seeded(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32}}
test('true caches prefer enclosed map gaps while false clues are bounded and rejectable from the map',()=>{
 let enclosed=0,decoys=0;
 for(let seed=1;seed<=250;seed++){
  const g=new Game(seeded(seed));g.floor=seed%5+1;g.generate();const cache=g.rooms.find(r=>r.exists&&r.type==='cache');assert.ok(cache);
  const adjacent=g.neighbors(cache.id).filter(n=>g.rooms[n].exists);assert.ok(adjacent.length>0);if(adjacent.length>=2)enclosed++;
  assert.ok(adjacent.every(n=>g.rooms[n].type!=='boss'&&!g.rooms[n].locked&&!g.rooms[n].bombLocked));
  for(const n of adjacent){g.roomId=n;const d=roomNeighbors(g).find(d=>d.id===cache.id),x=d.side==='left'?80:d.side==='right'?880:480,y=d.side==='top'?80:d.side==='bottom'?520:300;assert.equal(blocked(g.rooms[n],x,y,21),false)}
  g.roomId=12;
  const alternatives=g.rooms.filter(r=>!r.exists&&g.neighbors(r.id).some(n=>g.rooms[n].exists)&&g.neighbors(r.id).filter(n=>g.rooms[n].exists).every(n=>g.rooms[n].type!=='boss'&&!g.rooms[n].locked&&!g.rooms[n].bombLocked));
  assert.ok(alternatives.every(r=>g.neighbors(r.id).filter(n=>g.rooms[n].exists).length<=adjacent.length));
  const clues=g.rooms.flatMap(r=>r.wallDecoys||[]);assert.ok(clues.length<=2);decoys+=clues.length;
  for(const d of clues){assert.equal(g.rooms[d.id].exists,false);assert.ok(g.neighbors(d.id).some(n=>g.rooms[n].exists&&g.rooms[n].type==='boss'))}
 }
 assert.ok(enclosed>200);assert.ok(decoys>0);
});
test('unpaid clues appear after clearing, show observation text nearby, and never reveal the map by themselves',()=>{
 const g=new Game(seeded(17));g.start();const cache=g.rooms.find(r=>r.exists&&r.type==='cache'),parent=g.neighbors(cache.id).find(n=>g.rooms[n].exists);g.enter(parent,'top');
 const door=roomNeighbors(g).find(d=>d.id===cache.id);g.room.clear=false;assert.deepEqual(suspiciousWalls(g),[]);g.room.clear=true;assert.ok(suspiciousWalls(g).some(d=>d.id===cache.id));
 g.p.x=door.x;g.p.y=door.y;const labels=[];const ctx=new Proxy({}, {get:(_,key)=>(...args)=>{if(key==='fillText')labels.push(args[0])},set:()=>true});drawResources(ctx,g);
 assert.ok(labels.some(s=>s.includes('墙灰松动')));assert.equal(cache.revealed,false);assert.equal(g.doors()[door.side],false);assert.equal(g.coins,0);
 blastResourceDoors(g,door.x,door.y,60);assert.equal(cache.bombLocked,false);assert.equal(cache.revealed,true);assert.equal(g.coins,0);assert.ok(!suspiciousWalls(g).some(d=>d.id===cache.id));
});
test('a real bomb spent on a false crack reveals solid wall once without creating a room or loot',()=>{
 let g,parent,decoy;
 for(let seed=1;seed<=20&&!decoy;seed++){g=new Game(seeded(seed));g.start();parent=g.rooms.find(r=>r.wallDecoys?.length);decoy=parent?.wallDecoys[0]}
 assert.ok(decoy);g.enter(parent.id,'top');g.room.enemies=[];g.room.clear=true;g.pickup=null;g.p.x=decoy.x;g.p.y=decoy.y;g.p.inv=99;g.bombs=1;
 const cache=g.rooms.find(r=>r.exists&&r.type==='cache'),rooms=g.rooms.filter(r=>r.exists).length,coins=g.coins,keys=g.keys;
 g.update(.02,{bomb:true});step(g,1.4);
 assert.equal(g.bombs,0);assert.equal(g.coins,coins);assert.equal(g.keys,keys);assert.equal(decoy.spent,true);assert.equal(g.rooms[decoy.id].exists,false);assert.equal(g.rooms.filter(r=>r.exists).length,rooms);assert.equal(cache.bombLocked,true);assert.ok(!suspiciousWalls(g).includes(decoy));
 const notices=g.events.filter(e=>e.type==='toast'&&e.text.includes('实墙')).length;assert.equal(notices,1);blastResourceDoors(g,decoy.x,decoy.y,60);assert.equal(g.events.filter(e=>e.type==='toast'&&e.text.includes('实墙')).length,1);
 g.enter(12,'top');g.enter(parent.id,'top');assert.equal(decoy.spent,true);assert.equal(g.doors()[decoy.side],false);
});
