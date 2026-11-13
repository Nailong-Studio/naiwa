import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {Game,ITEMS} from '../dist/campaign.js';
import {memeInterval,updateMeme,hurtMeme,clearMeme} from '../dist/meme-items.js';
import {updateMemeFollowers} from '../dist/meme-followers.js';
import {updateFollowers} from '../dist/follower-combat.js';
import {roomNeighbors} from '../dist/resource-scenes.js';
import {itemTexture} from '../dist/item-icons.js';
function game(ids=[]){const g=new Game(()=>.42);g.start();g.items.push(...ids);g.room.obstacles=[];g.room.hazards=[];return g}
const advance=(g,t)=>{for(let i=0;i<t/.02;i++)g.update(.02)};
test('ghost idol requires real damage, has cooldown, leaves bullets and enemy health intact, attracts only melee',()=>{
 const g=game(['ghostbuddha']);g.p.x=300;g.p.y=300;g.p.inv=0;g.p.shield=true;g.hurt();assert.equal(g.ghostDecoy,undefined);g.p.inv=0;g.hurt();assert.ok(g.ghostDecoy);assert.equal(g.ghostDecoy.until,3);g.p.x=700;
 const melee=g.spawn('brute',480,300),range=g.spawn('shooter',480,300),boss=g.makeBoss('puppet',480,300);g.room.enemies=[melee,range,boss];g.enemyBullets=[{x:500,y:300}];const hp=melee.hp;
 assert.ok(g.enemyHeading(melee).x<0);assert.ok(g.enemyHeading(range).x>0);assert.ok(g.enemyHeading(boss).x>0);assert.equal(melee.hp,hp);assert.equal(g.enemyBullets.length,1);
 g.elapsed=2;g.p.inv=0;g.hurt();assert.equal(g.ghostDecoy.x,300);g.elapsed=3.01;updateMeme(g,.02);assert.equal(g.ghostDecoy,null);assert.ok(g.enemyHeading(melee).x>0);g.elapsed=12;hurtMeme(g);assert.equal(g.ghostDecoy.x,700);
});
test('Man counts one effective hit per volley across fan, double, split and returning; consumes once',()=>{
 const g=game(['man','double','fanvoice','split','returnvoice']),e=g.spawn('brute',600,300);for(let n=0;n<5;n++){g.bullets=[];g.shoot(1,0);const shots=[...g.bullets];for(const b of shots)g.onBulletHit(e,b);for(const b of g.bullets)g.onBulletHit(e,b);assert.equal(g.manHits,(n+1)%5)}assert.ok(g.manReady);g.bullets=[];g.shoot(1,0);assert.ok(Math.abs(g.bullets[0].damage-.7*.35*.65*2)<1e-9);assert.equal(g.manReady,false);
});
test('combined beat and rebound multipliers are capped, haste waits for entry grace and ends',()=>{
 const g=game(['oyeye','beatsticker','springteeth','ironrim','fouram']);for(let n=0;n<4;n++){g.bullets=[];g.shoot(1,0)}const b=g.bullets[0];assert.ok(Math.abs(b.damage-2.4)<1e-9);g.onBulletBounce(b);g.onBulletBounce(b);assert.ok(Math.abs(b.damage-2.4*1.5)<1e-9);
 g.room.warmStart=2;g.room.warmUntil=7;g.elapsed=1;assert.equal(memeInterval(g),1);g.elapsed=2;assert.equal(memeInterval(g),.85);g.elapsed=7;assert.equal(memeInterval(g),1);
});
test('elbow hits once per dash, cannot push bosses, foot zone expires and cannot slow bosses',()=>{
 const g=game(['elbow','mambaout','shrimpfeet','oyeye']),e=g.spawn('brute',495,300),boss=g.makeBoss('puppet',500,300);e.hp=100;g.room.enemies=[e,boss];const hp=boss.hp;g.p.dash=.2;g.p.dashCD=2;updateMeme(g,.02);updateMeme(g,.02);assert.equal(e.hp,95);assert.equal(boss.hp,hp-5);assert.equal(boss.vx,0);assert.ok(e.vx>0);assert.equal(g.p.dashCD,1.55);g.p.dash=0;updateMeme(g,.02);assert.equal(g.footZones.length,1);assert.equal(g.moveScale(e),.55);assert.equal(g.moveScale(boss),1);g.elapsed=3.01;updateMeme(g,.02);assert.equal(g.footZones.length,0);
});
test('new attacking companions wind up and launch recognizable projectiles from their own positions',()=>{
 for(const id of ['penguin','kobe']){const g=game([id]);g.room.enemies=[g.spawn('brute',700,300)];updateMemeFollowers(g,.02);const s=g.memePets[id];s.cd=0;updateMemeFollowers(g,.02);assert.equal(s.phase,'windup');updateMemeFollowers(g,.3);assert.equal(g.bullets.length,0);updateMemeFollowers(g,.09);assert.equal(g.bullets.length,1);const b=g.bullets[0];assert.equal(b.memePet,id);assert.ok(Math.hypot(b.x-s.x,b.y-s.y)<50);assert.equal(s.cd,id==='kobe'?1.65:2.2)}
});
test('sweet penguin visibly connects interception to its location and shares no stink-penguin cooldown',()=>{
 const g=game(['penguin','sweetpenguin']);g.enemyBullets=[{x:g.p.x+100,y:g.p.y,vx:-200,vy:0,r:6}];updateMemeFollowers(g,.02);const s=g.memePets.sweetpenguin;s.cd=0;updateMemeFollowers(g,.02);assert.equal(g.enemyBullets.length,1);updateMemeFollowers(g,.4);assert.equal(g.enemyBullets.length,0);assert.ok(g.effects.some(f=>f.type==='voiceChain'&&f.x===s.x));assert.equal(s.cd,2.5);assert.notEqual(g.memePets.penguin.cd,s.cd);
});
test('mouse locates a true adjacent hidden entrance, ignoring decoy walls without opening it',()=>{
 const g=game(['mouse']),hidden=g.rooms.find(r=>r.exists&&r.hidden);assert.ok(hidden);const from=g.neighbors(hidden.id).find(id=>g.rooms[id].exists&&!g.rooms[id].hidden);g.enter(from,'top');g.room.clear=true;g.room.enemies=[];g.room.loot=[];g.room.obstacles=[];g.room.decoyWalls=[{side:'top'}];for(let i=0;i<200;i++)updateFollowers(g,.02);const mouse=g.followerStates.mouse;assert.equal(mouse.secretDoor.id,hidden.id);assert.equal(hidden.revealed,false);assert.ok(hidden.bombLocked);const d=roomNeighbors(g).find(d=>d.id===hidden.id);assert.ok(Math.hypot(mouse.x-Math.max(78,Math.min(882,d.x)),mouse.y-Math.max(78,Math.min(522,d.y)))<30);
});
test('new room grace prevents immediate damage and delays shots, warm-up cannot refresh on revisit',()=>{
 const g=game(['fouram']);const room=g.rooms.find(r=>r.exists&&r.type==='fight');g.enter(room.id,'top');const until=room.warmUntil;assert.equal(g.p.inv,2);assert.ok(room.enemies.every(e=>e.cd>=1.5));const hp=g.p.hp;g.hurt();assert.equal(g.p.hp,hp);g.elapsed=10;g.enter(12,'top');g.enter(room.id,'top');assert.equal(room.warmUntil,until);
});
test('every collectible item has an existing image texture with a valid atlas cell',()=>{
 for(const item of ITEMS){const t=itemTexture(item.id);assert.ok(t,item.id);assert.ok(t.index>=0&&t.index<t.cols*t.rows,item.id);assert.ok(existsSync(new URL('../dist/assets/'+t.file,import.meta.url)),item.id)}
});
