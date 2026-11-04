import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,ITEMS} from '../dist/campaign.js';
import {updateDeepseek} from '../dist/deepseek-items.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function setup(ids=[]){const g=new Game(()=>.42);g.start();g.items=ids;g.room.type='fight';g.room.clear=false;g.room.obstacles=[];g.room.hazards=[];g.room.enemies=[g.spawn('turret',820,480)];g.room.enemies[0].hp=10000;g.room.enemies[0].cd=999;g.p.inv=999;g.events=[];return g}
test('successful dash fires exactly eight radial shots, failed cooldown presses and landing do not fire again',()=>{
 const g=setup(['fadeaway']);g.update(.02,{dash:true,mx:1});assert.equal(g.bullets.length,8);const angles=g.bullets.map(b=>Math.atan2(b.vy,b.vx));assert.equal(new Set(angles).size,8);for(const b of g.bullets){close(Math.hypot(b.vx,b.vy),520);assert.equal(b.damage,2.5);assert.ok(b.pierce);assert.ok(b.fadeBoost&&b.dashShot)}
 g.bullets=[];for(let i=0;i<20;i++)g.update(.02,{dash:true});assert.equal(g.bullets.length,0);g.p.dashCD=0;g.update(.02,{dash:true});assert.equal(g.bullets.length,8);
 const plain=setup();plain.update(.02,{dash:true});assert.equal(plain.bullets.length,0);
});
test('dash volley inherits poison, penetration and bounces, stays eight shots and cannot consume or charge other empowerment',()=>{
 const g=setup(['fadeaway','man','deepthink','double','fanvoice','split','gugucharm','eye','tongue','bubble','springteeth']);g.manReady=true;g.deepReady=true;g.p.damage=20;
 g.update(.02,{dash:true});assert.equal(g.bullets.length,8);assert.ok(g.manReady&&g.deepReady);assert.equal(g.memeVolley,undefined);
 for(const b of [...g.bullets]){assert.equal(b.damage,8);assert.ok(b.poison&&b.pierce);assert.equal(b.bounce,3);assert.ok(!b.split&&!b.memeGroup&&!b.deepVolley);g.onBulletHit(g.room.enemies[0],b)}assert.equal(g.manHits,undefined);
});
test('crossing a doorway during a dash cannot spawn a second radial volley',()=>{
 const g=setup(['fadeaway']);g.update(.02,{dash:true});const next=g.rooms.find(r=>r.exists&&r.type==='fight'&&r.id!==g.roomId);g.enter(next.id,'top');g.update(.02,{});assert.equal(g.bullets.filter(b=>b.dashShot).length,0);
});
test('Man gives two enlarged empowered volleys after five hits, plays one quote and cannot self-charge',()=>{
 const g=setup(['man','double','fanvoice','split']),e=g.room.enemies[0];
 for(let i=0;i<5;i++){g.bullets=[];g.shoot(1,0);for(const b of [...g.bullets])g.onBulletHit(e,b)}assert.ok(g.manReady);
 for(let i=0;i<2;i++){g.bullets=[];g.shoot(1,0);assert.ok(g.bullets.every(b=>b.manBoost));for(const b of [...g.bullets])g.onBulletHit(e,b);assert.equal(g.manHits,0)}
 assert.equal(g.events.filter(e=>e.type==='itemVoice'&&e.key==='man').length,1);g.bullets=[];g.shoot(1,0);assert.ok(g.bullets.every(b=>!b.manBoost));
});
test('three thinking volleys cannot be replenished by idle time until consumed; room change clears them',()=>{
 const g=setup(['deepthink']);updateDeepseek(g,3,3,{});g.shoot(1,0);assert.equal(g.deepBurst,2);updateDeepseek(g,5,5,{});assert.equal(g.deepBurst,2);assert.equal(g.deepReady,false);
 g.mode='paused';g.update(.04,{fire:true,ax:1});assert.equal(g.deepBurst,2);g.mode='play';g.enter(g.rooms.find(r=>r.exists&&r.id!==g.roomId&&r.type==='fight').id,'top');assert.equal(g.deepBurst,0);
});
test('voidframe fires every third volley through interior cover without destroying it; normal and hostile shots still collide',()=>{
 const g=setup(['voidframe']);for(let i=1;i<=3;i++){g.bullets=[];g.shoot(1,0);const b=g.bullets[0];assert.equal(!!b.ghost,i===3);if(i===3){close(b.damage,1.6);g.room.obstacles=[{x:b.x,y:b.y,r:30,w:60,h:60,kind:'rock'}];assert.equal(g.projectileBlocked(b,false),false);assert.equal(g.projectileBlocked({...b,ghost:false},false),true);assert.equal(g.projectileBlocked(b,true),true);assert.equal(g.room.obstacles.length,1)}}
});
test('rhythm splash only hits neighbors once per volley and respects cover, with no recursive split procs',()=>{
 const g=setup(['oyeye','double','split']);g.memeVolley=3;g.shoot(1,0);const primary=g.spawn('brute',400,300),open=g.spawn('brute',400,350),blocked=g.spawn('brute',460,300);for(const e of [primary,open,blocked])e.hp=100;
 g.room.enemies=[primary,open,blocked];g.room.obstacles=[{kind:'rock',x:430,y:300,w:18,h:30,r:10}];const b=g.bullets[0];g.onBulletHit(primary,b);const hp=open.hp;close(hp,100-b.damage*.4);assert.equal(blocked.hp,100);assert.equal(primary.hp,100);
 for(const shot of [...g.bullets])g.onBulletHit(primary,shot);assert.equal(open.hp,hp);assert.equal(g.effects.filter(e=>e.variant==='rhythm'&&e.radius===80).length,1);
});
test('beat knockback helps against ordinary mobs, has a per-target interval and never displaces a boss',()=>{
 const g=setup(['beatsticker']);g.beatShots=3;g.shoot(1,0);const b=g.bullets[0];close(b.damage,1.65);const e=g.room.enemies[0],boss=g.makeBoss('puppet',600,300);g.onBulletHit(e,b);assert.equal(e.vx,220);g.onBulletHit(e,b);assert.equal(e.vx,220);g.onBulletHit(boss,b);assert.equal(boss.vx,0);
});
test('combined periodic bonuses are capped but permanent builds and tighter gugu pellet weights are preserved',()=>{
 const ids=['man','deepthink','voidframe','beatsticker','oyeye','gugucharm','heavyvoice','double','fanvoice'];const g=setup(ids);g.manReady=true;g.deepReady=true;g.memeVolley=11;g.beatShots=3;g.shoot(1,0);assert.equal(g.bullets.length,18);assert.ok(g.bullets.every(b=>b.empowerScale===3));close(g.bullets.reduce((n,b)=>n+b.damage,0),.7*2*1.85*2.2*3*1.8);
 const single=setup(['gugucharm']);single.memeVolley=3;single.shoot(1,0);assert.equal(single.bullets.length,3);close(single.bullets.reduce((n,b)=>n+b.damage,0),1.8);close(Math.atan2(single.bullets[0].vy,single.bullets[0].vx),-.08);
 for(const id of ['fadeaway','man','deepthink','voidframe','gugucharm','oyeye','beatsticker'])assert.ok(ITEMS.find(i=>i.id===id)?.desc);
});
