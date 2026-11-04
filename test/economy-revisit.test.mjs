import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
import {EXCHANGES,roomSides} from '../dist/resource-scenes.js';
import {createPurchaseSelection} from '../dist/purchase-ui.js';
const snapshot=g=>({coins:g.coins,keys:g.keys,bombs:g.bombs,hp:g.p.hp,items:[...g.items]});
function revisitThroughDoors(g){
 const home=g.roomId,door=roomSides(g).find(d=>{const r=g.rooms[d.id];return r?.exists&&!r.locked&&!r.bombLocked&&!r.hidden});assert.ok(door);
 const next=g.rooms[door.id];next.clear=true;next.enemies=[];g.pickup=null;g.p.x=door.x;g.p.y=door.y;g.update(.02);assert.equal(g.roomId,next.id);
 const back=roomSides(g).find(d=>d.id===home);g.pickup=null;g.p.x=back.x;g.p.y=back.y;g.update(.02);assert.equal(g.roomId,home);
 g.p.x=480;g.p.y=260;
}
function init(floor=1){const g=new Game();g.start();g.floor=floor;g.generate();g.keys=g.bombs=g.coins=100;g.p.hp=g.p.maxHp=100;return g}
test('all five floors retain every exchange quota through real doorway transitions and repeated confirmations',()=>{
 for(let floor=1;floor<=5;floor++){
  const g=init(floor);
  for(const t of EXCHANGES){
   for(let n=0;n<t.limit;n++){g.p.x=480;g.p.y=260;g.interact();const s=createPurchaseSelection(g);s.select(t.id);assert.ok(s.confirm());assert.equal(s.confirm(),false);revisitThroughDoors(g)}
   g.interact();assert.ok(!g.choices.some(c=>c.id===t.id));const before=snapshot(g);assert.equal(g.choose(t.id),false);assert.deepEqual(snapshot(g),before);g.leaveChoice();
  }
  for(let i=0;i<3;i++){revisitThroughDoors(g);g.interact();assert.equal(g.choices.length,0);g.leaveChoice()}
 }
});
test('buying one or all shop items never rerolls survivors or refills sold slots after actual doorway revisits',()=>{
 for(let floor=1;floor<=5;floor++){
  const g=init(floor);g.enter(g.rooms.find(r=>r.exists&&r.type==='shop').id,'top');g.offer('shop');const original=[...g.room.shopStock];
  for(let i=0;i<original.length;i++){
   const s=createPurchaseSelection(g);s.select(original[i].id);assert.ok(s.confirm());const before=snapshot(g);revisitThroughDoors(g);g.interact();
   assert.deepEqual(g.room.shopStock.map(i=>i.id),original.slice(i+1).map(i=>i.id));assert.deepEqual(snapshot(g),before);assert.equal(g.room.shopSold.length,i+1);
   assert.ok(!g.choices.some(c=>c.id===original[i].id));
  }
  g.leaveChoice();revisitThroughDoors(g);g.interact();assert.equal(g.room.shopStock.length,0);assert.equal(g.choose('service_reroll'),false);
 }
});
test('shop service limits and paid rerolled stock survive revisits and reset only on another floor or run',()=>{
 const g=init();g.enter(g.rooms.find(r=>r.exists&&r.type==='shop').id,'top');g.offer('shop');assert.ok(g.choose('service_reroll'));const stock=g.room.shopStock.map(i=>i.id);
 revisitThroughDoors(g);g.interact();assert.deepEqual(g.room.shopStock.map(i=>i.id),stock);assert.ok(g.choose('service_reroll'));revisitThroughDoors(g);g.interact();assert.equal(g.choose('service_reroll'),false);
 for(const id of ['service_shield','service_charge','service_map']){assert.ok(g.choose(id));revisitThroughDoors(g);g.p.shield=false;g.activeCharge=0;g.interact();assert.equal(g.choose(id),false)}
 g.leaveChoice();g.floor++;g.generate();g.enter(g.rooms.find(r=>r.exists&&r.type==='shop').id,'top');g.offer('shop');assert.equal(g.room.shopStock.length,3);assert.deepEqual(g.room.serviceUses,{});assert.deepEqual(init().rooms[12].exchanges,{});
});
test('floor accounting survives room reconstruction and stale sold-item choices cannot charge or grant items',()=>{
 const g=init();g.p.x=480;g.p.y=260;g.interact();assert.ok(g.choose('trade_key_bomb'));g.enter(g.rooms.find(r=>r.exists&&r.type==='shop').id,'top');g.offer('shop');const item=g.choices[0];assert.ok(g.choose(item.id));
 g.offer('shop');g.choices.push(item);const before=snapshot(g);assert.equal(g.choose(item.id),false);assert.deepEqual(snapshot(g),before);g.leaveChoice();const remaining=g.room.shopStock.map(i=>i.id);
 g.generate();assert.equal(g.room.exchanges.trade_key_bomb,1);g.enter(g.rooms.find(r=>r.exists&&r.type==='shop').id,'top');g.offer('shop');assert.deepEqual(g.room.shopStock.map(i=>i.id),remaining);
});
test('a pending purchase from a closed dialog cannot confirm against a newly opened shelf',()=>{
 const g=init();g.enter(g.rooms.find(r=>r.exists&&r.type==='shop').id,'top');g.offer('shop');const old=createPurchaseSelection(g);old.select('supply_key');g.leaveChoice();revisitThroughDoors(g);g.interact();const before=snapshot(g);assert.equal(old.confirm(),false);assert.deepEqual(snapshot(g),before);
});
