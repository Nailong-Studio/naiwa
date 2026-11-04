import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
function encounter(){const g=new Game();g.start();g.enter(g.rooms.find(r=>r.exists&&r.type==='boss').id,'top');const e=g.room.enemies[0];e.x=200;e.y=150;e.attack=100;e.chargeCD=100;e.cd=0;g.p.x=650;g.p.y=400;g.p.inv=0;g.update(.02);e.cd=100;return {g,e,fx:g.effects.find(f=>f.type==='milkBottle')}}
const advance=(g,n=60)=>{for(let i=0;i<n;i++)g.update(.02)};

test('collector throws at a fixed marked position instead of firing generic radial bullets',()=>{
 const {g,fx}=encounter();assert.ok(fx);assert.equal(g.enemyBullets.length,0);assert.equal(fx.radius,110);
 const target={x:fx.x,y:fx.y};g.p.x+=80;advance(g,40);
 assert.equal(g.p.hp,6);assert.equal(fx.x,target.x);assert.equal(fx.y,target.y);
 advance(g,20);assert.equal(g.p.hp,5); // Hits away from the bottle centre: area damage.
 g.p.inv=0;g.p.x=850;g.p.y=500;advance(g,20);assert.equal(g.p.hp,5); // Splash artwork does not deal repeated damage.
});
test('escaping the blast circle avoids damage',()=>{
 const {g,fx}=encounter();g.p.x=fx.x+fx.radius+g.p.r+2;advance(g);assert.equal(g.p.hp,6);
});
test('shield and active dash block the blast',()=>{
 const shield=encounter();shield.g.p.shield=true;advance(shield.g);assert.equal(shield.g.p.hp,6);assert.equal(shield.g.p.shield,false);
 const dash=encounter();advance(dash.g,47);dash.g.update(.02,{dash:true,mx:1});advance(dash.g,8);assert.equal(dash.g.p.hp,6);
});
test('paused bottles freeze and dead bosses cannot leave delayed damage',()=>{
 const {g,e,fx}=encounter();g.mode='paused';const life=fx.life;advance(g);assert.equal(fx.life,life);assert.equal(g.p.hp,6);
 g.mode='play';g.damageEnemy(e,999);g.update(.02);assert.equal(g.p.hp,6);assert.ok(!g.effects.some(f=>f.type==='milkBottle'));
});
test('every third collector attack increases radius; other bosses still fire their own attacks',()=>{
 const {g,e}=encounter();g.effects=[];e.bottleCount=2;e.cd=0;g.update(.02);assert.equal(g.effects.find(f=>f.type==='milkBottle').radius,135);
 const other=new Game();other.start();other.floor=2;other.generate();other.enter(other.rooms.find(r=>r.exists&&r.type==='boss').id,'top');other.room.enemies[0].cd=0;other.update(.02);assert.equal(other.enemyBullets.length,0);advance(other,40);assert.ok(other.enemyBullets.length>0);assert.ok(!other.effects.some(f=>f.type==='milkBottle'));
});
