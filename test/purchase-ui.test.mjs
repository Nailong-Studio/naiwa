import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
import {createPurchaseSelection,purchaseQuote} from '../dist/purchase-ui.js';
function shop(){const g=new Game(()=>.42);g.start();g.coins=30;g.enter(g.rooms.find(r=>r.exists&&r.type==='shop').id,'top');g.offer('商店');return g}
test('selecting, tapping twice or switching products never spends; explicit confirmation buys selected product once',()=>{
 const g=shop(),selection=createPurchaseSelection(g),first=g.choices[0];
 selection.select(first.id);selection.select(first.id);assert.equal(g.coins,30);assert.equal(g.items.length,0);
 selection.select('supply_key');const keys=g.keys;
 assert.equal(selection.confirm(),true);assert.equal(g.coins,27);assert.equal(g.keys,keys+1);assert.equal(g.items.length,0);
 assert.equal(selection.confirm(),false);assert.equal(g.coins,27);
});
test('insufficient funds and leaving the store cannot spend via stale selection',()=>{
 const g=shop(),selection=createPurchaseSelection(g);g.coins=0;selection.select('supply_key');assert.equal(selection.quote().reason,'资源不足');assert.equal(selection.confirm(),false);assert.equal(g.coins,0);
 g.coins=30;selection.select('supply_key');g.leaveChoice();assert.equal(selection.confirm(),false);assert.equal(g.coins,30);
});
test('discount price, supplies, services and full-health rejection match actual transaction rules',()=>{
 const g=shop();g.items.push('bargain');assert.equal(purchaseQuote(g,g.choices[0]).cost,7);
 assert.equal(purchaseQuote(g,g.choices.find(i=>i.id==='supply_key')).cost,3);
 assert.equal(purchaseQuote(g,g.choices.find(i=>i.id==='service_shield')).cost,5);
 assert.equal(purchaseQuote(g,g.choices.find(i=>i.id==='supply_heart')).reason,'生命已满');
});
test('resource exchange previews exact resources and requires confirmation; blood trade cannot be lethal',()=>{
 const g=new Game(()=>.42);g.start();g.keys=2;g.p.x=480;g.p.y=260;g.interact();const selection=createPurchaseSelection(g);
 selection.select('trade_key_bomb');assert.deepEqual(selection.quote(),{cost:2,available:2,unit:'把钥匙',remaining:0,reason:'',verb:'兑换'});assert.equal(g.keys,2);
 assert.ok(selection.confirm());assert.equal(g.keys,0);assert.equal(g.bombs,3);
 g.interact();g.p.hp=2;selection.select('trade_blood');assert.ok(selection.quote().reason);assert.equal(selection.confirm(),false);assert.equal(g.p.hp,2);
});
