import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
function fixture(type='fight'){
 const g=new Game();g.start();g.enter(g.rooms.find(r=>r.exists&&r.type===type).id,'top');
 g.p.x=100;g.p.y=100;g.room.enemies=[];return g;
}
function clearAgain(g,roll){g.mode='play';g.room.clear=false;g.room.clearRewarded=false;g.room.loot=[];g.random=()=>roll;g.update(.02)}

test('ordinary clearing has empty rooms and at most one small reward, with no extra guaranteed heart',()=>{
 const g=fixture(),counts={none:0,coin:0,key:0,bomb:0,heart:0};
 for(let i=0;i<100;i++){
  clearAgain(g,(i+.5)/100);
  assert.equal(g.mode,'play');assert.equal(g.pickup,null);assert.ok(g.room.loot.length<=1);
  const loot=g.room.loot[0];counts[loot?.type||'none']++;
  if(loot)assert.ok(loot.amount>=1&&loot.amount<=(loot.type==='coin'?2:1));
 }
 assert.deepEqual(counts,{none:40,coin:35,key:10,bomb:8,heart:7});
});

test('key drought protection substitutes one reward and does not duplicate a key left on the floor',()=>{
 const g=fixture();g.keys=0;
 clearAgain(g,.1);assert.equal(g.room.loot.length,0);clearAgain(g,.1);assert.equal(g.room.loot.length,0);
 clearAgain(g,.1);assert.deepEqual(g.room.loot.map(l=>l.type),['key']);
 const cleared=g.room,originalClears=g.clears;g.update(.02);assert.equal(g.clears,originalClears);assert.equal(cleared.loot.length,1);
 g.enter(12,'top');g.enter(cleared.id,'top');assert.equal(g.room.loot.length,1);assert.equal(g.clears,originalClears);
 const next=g.rooms.find(r=>r.exists&&r.type==='fight'&&r.id!==cleared.id);g.enter(next.id,'top');g.room.enemies=[];g.p.x=100;g.p.y=100;
 for(let i=0;i<4;i++){clearAgain(g,.1);assert.equal(g.room.loot.length,0)}
});

test('challenge gives a chest OR an item selection, never both or bonus resources',()=>{
 for(const roll of [.2,.8]){
  const g=fixture('challenge');g.random=()=>roll;g.update(.02);assert.equal(g.pickup,null);
  if(roll<.5){assert.deepEqual(g.room.loot.map(l=>l.type),['chest']);assert.equal(g.mode,'play')}
  else{assert.equal(g.room.loot.length,0);assert.equal(g.mode,'choice');assert.equal(g.choices.length,3);assert.ok(g.choose(g.choices[0].id));assert.equal(g.items.length,1)}
 }
});

test('empty clears do not charge the active ability but still trigger the purchased lunch effect',()=>{
 const g=fixture();g.items.push('lunch');g.p.hp=3;g.activeCharge=0;
 for(let i=0;i<3;i++)clearAgain(g,.1);
 assert.equal(g.activeCharge,0);assert.equal(g.p.hp,4);assert.equal(g.room.loot.length,0);
 g.keyDryRooms=2;g.floor++;g.generate();assert.equal(g.keyDryRooms,0);
});
