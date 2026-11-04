import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
import {updateDeepseek,hitDeepseek,enterDeepseek,deepStats,resetDeepseek} from '../dist/deepseek-items.js';
function setup(ids){const g=new Game(()=>.42);g.start();g.items.push(...ids);g.room.type='fight';g.room.clear=false;g.room.obstacles=[];g.room.hazards=[];g.p.x=300;g.p.y=300;const e=g.spawn('turret',600,300);e.hp=999;e.cd=999;g.room.enemies=[e];return g}
test('whale winds up, fires from spoon, and consumes fed bonuses only for successful attacks',()=>{
 const g=setup(['ricewhale']);g.whaleFed=3;updateDeepseek(g,.6,.6,{});assert.equal(g.whale.phase,'windup');assert.equal(g.bullets.length,0);const {x,y}=g.whale;updateDeepseek(g,.33,.33,{});assert.equal(g.bullets.length,1);const b=g.bullets[0];assert.equal(b.x,x+26);assert.equal(b.y,y-18);assert.equal(b.fed,true);assert.equal(g.whaleFed,2);assert.ok(b.pet&&b.rice);g.whale.phase='windup';g.whale.t=0;g.whale.target.dead=true;updateDeepseek(g,.33,.33,{});assert.equal(g.whaleFed,2);assert.equal(g.bullets.length,1);
});
test('rice bowl is room-idempotent and capped per floor; full health gets coin instead of wasted healing',()=>{
 const g=setup(['ricebowl','ricewhale']);g.p.hp=4;for(let i=0;i<12;i++){g.room.clearRewarded=false;g.room.clear=true;g.onRoomCleared(g.room);g.onRoomCleared(g.room)}assert.equal(g.riceClears,12);assert.equal(g.p.hp,6);assert.equal(g.riceUses,2);assert.equal(g.whaleFed,3);g.floor++;g.riceClears=3;g.room.clearRewarded=false;const before=g.coins;g.onRoomCleared(g.room);assert.equal(g.coins,before+1);assert.equal(g.riceUses,1);
});
test('token counts a multi-shot volley only once, ignores companions, and has a per-room cap',()=>{
 const g=setup(['tokenbag','fanvoice','double','split']);for(let i=0;i<30;i++){g.bullets=[];g.shoot(1,0);for(const b of g.bullets)for(let n=0;n<4;n++)hitDeepseek(g,g.room.enemies[0],b)}assert.equal(g.activeCharge,12);assert.equal(g.room.tokenGrants,3);const g2=setup(['tokenbag']);hitDeepseek(g2,g2.room.enemies[0],{pet:true,deepVolley:{counted:false}});assert.equal(g2.room.tokenHits,undefined);
});
test('thinking charges during combat movement only, consumes exactly three volleys, and resets across rooms',()=>{
 const g=setup(['deepthink','double','fanvoice']);for(let i=0;i<75;i++)updateDeepseek(g,.04,.04,{mx:1});assert.equal(g.deepReady,true);g.shoot(1,0);assert.equal(g.bullets.length,6);assert.ok(g.bullets.every(b=>b.deepCharged&&b.pierce));assert.equal(g.deepReady,false);const damage=g.bullets[0].damage;for(let i=0;i<2;i++){g.bullets=[];g.shoot(1,0);assert.ok(g.bullets.every(b=>b.deepCharged));assert.equal(g.bullets[0].damage,damage)}g.bullets=[];g.shoot(1,0);assert.ok(!g.bullets[0].deepCharged);assert.ok(Math.abs(g.bullets[0].damage*2-damage)<.00001);resetDeepseek(g);g.room.clear=true;updateDeepseek(g,4,4,{});assert.equal(g.deepReady,false);
});
test('wrong-model alternates new combat rooms but revisits preserve mode and stats agree',()=>{
 const g=setup(['wrongmodel']);enterDeepseek(g);assert.equal(g.room.deepModel,'think');assert.equal(deepStats(g).damage,1.35);assert.equal(g.attackInterval(),g.p.rate*1.2);const first=g.roomId,second=g.rooms.find(r=>r.exists&&r.type==='fight'&&r.id!==first);g.enter(second.id,'top');assert.equal(g.room.deepModel,'fast');g.enter(first,'top');assert.equal(g.room.deepModel,'think');assert.equal(g.deepModelIndex,2);
});
test('pause freezes thinking and new run has no stale charge or companion',()=>{
 const g=setup(['deepthink','ricewhale']);g.update(.04,{});const t=g.deepThink;g.mode='paused';for(let i=0;i<100;i++)g.update(.04,{});assert.equal(g.deepThink,t);const fresh=new Game(()=>.4);assert.ok(!fresh.whale);assert.ok(!fresh.deepReady);
});
