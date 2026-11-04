import {updateFollowers} from '../dist/follower-combat.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
import {updateActive} from '../dist/combat-content.js';
const fresh=()=>{const g=new Game();g.start();return g};
test('actual enemy health loss charges the skill, without overkill or airborne damage credit',()=>{
 const g=fresh(),e=g.spawn('brute',600,300);e.hp=e.maxHp=10;g.damageEnemy(e,3);assert.equal(g.activeCharge,3);g.damageEnemy(e,999);assert.equal(g.activeCharge,10);g.damageEnemy(e,999);assert.equal(g.activeCharge,10);
 const air=g.makeBoss('speaker',300,200);air.airborne=true;g.damageEnemy(air,10);assert.equal(g.activeCharge,10);air.airborne=false;g.damageEnemy(air,50);assert.equal(g.activeCharge,45);
});
test('near bullets are pushed outward intact while far bullets keep their trajectory',()=>{
 const g=fresh();g.activeCharge=g.activeCost();g.enemyBullets=[{x:530,y:300,vx:-180,vy:0,r:7,life:3},{x:800,y:300,vx:-180,vy:0,r:7,life:3},{x:480,y:300,vx:0,vy:100,r:7,life:3}];updateActive(g,.02,{active:true});assert.equal(g.enemyBullets.length,3);assert.ok(g.enemyBullets[0].vx>0);assert.equal(g.enemyBullets[1].vx,-180);assert.ok(g.enemyBullets[2].x>g.p.x+g.p.r);assert.ok(g.enemyBullets.every(b=>Number.isFinite(b.vx)&&Number.isFinite(b.vy)));
});
test('laugh pushes enemies away, does not refill itself, and works with the rabbit follower',()=>{
 const g=fresh(),e=g.spawn('brute',600,300);e.hp=e.maxHp=50;g.room.enemies=[e];g.activeCharge=g.activeCost();updateActive(g,.02,{active:true});assert.equal(e.hp,46);assert.ok(e.vx>0);assert.equal(g.activeCharge,0);g.activeLatch=false;g.items.push('rabbit');g.activeCharge=g.activeCost();updateActive(g,.02,{active:true});assert.equal(e.hp,42);for(let i=0;i<55;i++)updateFollowers(g,.02);assert.equal(e.hp,39.2);assert.equal(g.activeCharge,0);
});
test('normal shots still fire while Shift is held and releasing Shift creates no extra shot',()=>{
 const g=fresh();g.update(.02,{charge:true,fire:true,ax:1});assert.equal(g.bullets.length,1);assert.equal(g.bullets[0].damage,1);g.update(.02,{charge:false,ax:1});assert.equal(g.bullets.length,1);
});
test('battery lowers the threshold and enemy self-destruction gives no damage credit',()=>{
 const g=fresh();g.items.push('battery');assert.equal(g.activeCost(),30);const e=g.spawn('brute',600,300);e.hp=100;g.damageEnemy(e,35);assert.equal(g.activeCharge,30);g.activeCharge=0;g.damageEnemy(e,e.hp,false);assert.equal(g.activeCharge,0);
});
