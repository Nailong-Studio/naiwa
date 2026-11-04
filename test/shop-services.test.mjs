import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
function shop(){const g=new Game();g.start();g.enter(g.rooms.find(r=>r.exists&&r.type==='shop').id,'top');g.coins=30;g.offer('shop');return g}
test('paid rerolls replace remaining stock, charge once and cannot restock sold slots',()=>{
 const g=shop(),first=g.room.shopStock.map(i=>i.id);assert.ok(g.choose(first[0]));g.offer('shop');const old=g.room.shopStock.map(i=>i.id);assert.ok(g.choose('service_reroll'));assert.equal(g.coins,16);assert.equal(g.room.shopStock.length,2);assert.ok(g.room.shopStock.every(i=>!old.includes(i.id)&&!g.has(i.id)));assert.equal(g.choose('service_reroll'),false);g.offer('shop');assert.ok(g.choose('service_reroll'));g.offer('shop');assert.ok(!g.choices.some(c=>c.id==='service_reroll'));
});
test('shield service gives one hit of protection and rejects existing shields without charge',()=>{
 const g=shop();g.p.shield=true;assert.equal(g.choose('service_shield'),false);assert.equal(g.coins,30);g.p.shield=false;assert.ok(g.choose('service_shield'));assert.equal(g.coins,25);const hp=g.p.hp;g.p.inv=0;g.hurt();assert.equal(g.p.hp,hp);assert.equal(g.p.shield,false);g.offer('shop');assert.equal(g.choose('service_shield'),false);
});
test('charging respects battery capacity and rejects full charge or insufficient money',()=>{
 for(const battery of [false,true]){const g=shop();if(battery)g.items.push('battery');g.activeCharge=g.activeCost();assert.equal(g.choose('service_charge'),false);assert.equal(g.coins,30);g.activeCharge=0;g.coins=3;assert.equal(g.choose('service_charge'),false);g.coins=4;assert.ok(g.choose('service_charge'));assert.equal(g.activeCharge,g.activeCost());assert.equal(g.coins,0)}
});
test('intel reveals only the hidden room, without visiting it or opening its resource lock',()=>{
 const g=shop(),visited=g.rooms.filter(r=>r.visited).length,locked=g.rooms.filter(r=>r.exists&&(r.locked||r.bombLocked)).map(r=>r.id);assert.ok(g.choose('service_map'));assert.equal(g.coins,27);assert.ok(g.rooms.find(r=>r.exists&&r.type==='cache').revealed);assert.ok(g.rooms.some(r=>r.exists&&!r.seen));assert.equal(g.rooms.filter(r=>r.visited).length,visited);assert.ok(locked.every(id=>g.rooms[id].locked||g.rooms[id].bombLocked));g.offer('shop');assert.equal(g.choose('service_map'),false);
});
test('unavailable services do not spend money and purchased limits persist on revisit',()=>{
 const g=shop(),id=g.roomId;g.room.shopStock=[];assert.equal(g.choose('service_reroll'),false);assert.equal(g.coins,30);for(const r of g.rooms)if(r.type==='cache')r.revealed=true;assert.equal(g.choose('service_map'),false);assert.equal(g.coins,30);g.choose('service_shield');g.enter(12,'top');g.enter(id,'top');g.offer('shop');assert.ok(!g.choices.some(c=>c.id==='service_shield'));
});
