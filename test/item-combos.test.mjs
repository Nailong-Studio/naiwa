import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
import {COMBO_ITEMS,synergyText} from '../dist/item-combos.js';
import {milkPool,onMilk,updateGround} from '../dist/combat-content.js';
function fresh(items=[]){const g=new Game(()=>.15);g.start();g.items=items;g.room.obstacles=[];g.room.hazards=[];return g}
const step=(g,n)=>{for(let t=0;t<n-.00001;t+=.02)g.update(.02)};
test('all ten new items enter the ordinary pool and can be picked normally',()=>{
 const g=fresh();assert.equal(COMBO_ITEMS.length,10);for(const item of COMBO_ITEMS){assert.ok(g.drawItems(99).some(i=>i.id===item.id));g.mode='choice';g.choices=[item];assert.ok(g.choose(item.id));assert.ok(!g.drawItems(99).some(i=>i.id===item.id))}
});
test('mint and beat share a trigger across a volley, stack with voices, and do not count pets',()=>{
 const g=fresh(['mints','beatsticker','fanvoice','double']);assert.ok(Math.abs(g.attackInterval()-.28*1.15*.85)<1e-9);
 for(let i=1;i<=4;i++){g.bullets=[];g.shoot(1,0);assert.equal(g.bullets.length,6);assert.ok(g.bullets.every(b=>Math.abs(b.damage-.7*.95*(b.vy===0?1.15:.35)*(i===4?1.65:1))<1e-9));g.shoot(1,0,true);assert.equal(g.beatShots,i);assert.ok(!g.bullets.at(-1).beat)}
});
test('spring teeth stack bounce count, boost only once and combine with milkfoam',()=>{
 const g=fresh(['springteeth','bubble','milkfoam']);g.shoot(1,0);const b=g.bullets[0];assert.equal(b.bounce,3);g.onBulletBounce(b);assert.equal(b.damage,1.2);g.onBulletBounce(b);assert.equal(b.damage,1.2);assert.equal(g.effects.filter(f=>f.friendly).length,2);
});
test('star mark affects subsequent hits and expires with play time only',()=>{
 const g=fresh(['starbadge']);const e=g.spawn('brute',700,300);g.room.enemies=[e];g.shoot(1,0);const b=g.bullets[0];assert.equal(g.bulletDamage(e,b),1);g.onBulletHit(e,b);assert.equal(g.bulletDamage(e,b),1.2);g.mode='paused';step(g,3);assert.equal(e.starMark,2);g.mode='play';g.bullets=[];e.cd=999;step(g,2.1);assert.equal(g.bulletDamage(e,b),1);
});
test('chain and split share a finite budget; separate fan beams have their own budgets',()=>{
 const g=fresh(['papercup','split','fanvoice']);const e=g.spawn('brute',600,300),other=g.spawn('brute',680,300);e.hp=other.hp=100;g.room.enemies=[e,other];g.shoot(1,0);const b=g.bullets[0];assert.notEqual(b.chain,g.bullets[1].chain);b.hits.add(e);g.onBulletHit(e,b);const hp=other.hp;assert.ok(hp<100);const child=g.bullets[3];assert.equal(child.chain,b.chain);g.onBulletHit(e,child);assert.equal(other.hp,hp);assert.equal(g.effects.filter(f=>f.type==='voiceChain').length,1);
});
test('milkcap produces bounded pools in later chapters and activates the stronger filter',()=>{
 const g=fresh(['milkcap','milkfilter']);g.floor=4;for(let i=0;i<9;i++){const e=g.spawn('brute',480,300);g.damageEnemy(e,999)}assert.equal(g.effects.filter(f=>f.capMilk).length,6);assert.ok(onMilk(g,g.p));g.shoot(1,0);assert.equal(g.bullets.at(-1).damage,1.4);assert.ok(synergyText(g).includes('奶沫增伤'));
});
test('button protects once per floor, does not consume through shields and refreshes next floor',()=>{
 const g=fresh(['sparebutton']);g.p.hp=1;g.p.inv=0;g.p.shield=true;g.hurt();assert.equal(g.buttonFloor,undefined);g.p.inv=0;g.hurt();assert.equal(g.p.hp,1);assert.equal(g.mode,'play');assert.equal(g.p.inv,2);assert.equal(g.buttonFloor,1);assert.ok(!g.events.some(e=>e.type==='end'));g.p.inv=0;g.floor=2;g.hurt();assert.equal(g.buttonFloor,2);g.p.inv=0;g.hurt();assert.equal(g.mode,'dead');
});
test('mending credits actual damage, never overkill, and heals at most twice per floor',()=>{
 const g=fresh(['mending']);g.p.hp=2;let e=g.spawn('brute',700,300);e.hp=1;g.damageEnemy(e,999);assert.equal(g.mendDamage,1);e=g.spawn('brute',700,300);e.hp=500;g.damageEnemy(e,39);assert.equal(g.p.hp,3);g.damageEnemy(e,40);assert.equal(g.p.hp,4);g.damageEnemy(e,100);assert.equal(g.p.hp,4);g.floor=2;g.damageEnemy(e,40);assert.equal(g.p.hp,5);
});
test('coinpouch counts each combat clear once and does not farm revisits or safe rooms',()=>{
 const g=fresh(['coinpouch']);for(let i=0;i<4;i++){const room={type:'fight',clear:true,enemies:[],obstacles:[],loot:[]};g.random=()=>.1;g.onRoomCleared(room);g.onRoomCleared(room)}assert.equal(g.coins,2);g.onRoomCleared({type:'start',enemies:[],obstacles:[],loot:[]});assert.equal(g.pouchClears,4);
});
test('rattle knocks regular enemies with a cooldown and cannot shove bosses',()=>{
 const g=fresh(['rattle']);const e=g.spawn('brute',600,300),boss=g.makeBoss('collector',700,300),b={vx:490,vy:0};g.onBulletHit(e,b);assert.equal(e.vx,150);g.onBulletHit(e,b);assert.equal(e.vx,150);g.onBulletHit(boss,b);assert.equal(boss.vx,0);
});
test('rain boots cover later ground hazards and belts without granting projectile immunity',()=>{
 const g=fresh(['milkboots']);g.p.inv=0;g.hurtGround();assert.equal(g.p.hp,6);assert.equal(g.bootGuardCD,8);g.p.inv=0;g.hurtGround();assert.equal(g.p.hp,5);g.p.inv=0;g.hurt();assert.equal(g.p.hp,4);g.room.hazards=[{kind:'belt',x:480,y:300,w:300,h:200,dx:1,dy:0,power:100}];assert.equal(g.groundDrift(g.p).x,50);milkPool(g,480,300);g.p.inv=0;updateGround(g,.02);assert.equal(g.p.hp,4);g.mode='paused';step(g,1);assert.equal(g.bootGuardCD,8);g.mode='play';g.room.hazards=[];g.effects=[];step(g,8.1);g.p.inv=0;g.hurtGround();assert.equal(g.p.hp,4);
});
