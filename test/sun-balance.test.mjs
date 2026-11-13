import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
import {updateMemeFollowers} from '../dist/meme-followers.js';
import {updateFollowers} from '../dist/follower-combat.js';
import {updateActive} from '../dist/combat-content.js';
import {serializeRun,deserializeRun} from '../dist/run-save.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function game(ids){const g=new Game(()=>.42);g.start();g.items=ids;g.room.type='fight';g.room.clear=false;g.room.obstacles=[];g.room.hazards=[];g.p.inv=0;const e=g.makeBoss('puppet',g.p.x+100,g.p.y);e.hp=1000;e.cd=999;g.room.enemies=[e];return g}
test('Sun hits bosses, prioritizes ordinary ranged threats and never cancels boss windups or existing bullets',()=>{
 const g=game(['sun']),boss=g.room.enemies[0];boss.puppetSkill={mode:'needle',t:.2};const ranged=g.spawn('turret',g.p.x+90,g.p.y);ranged.hp=100;g.room.enemies.push(ranged);g.enemyBullets=[{x:100,y:100,vx:30,vy:0,r:5}];updateMemeFollowers(g,0);g.memePets.sun.cd=0;updateMemeFollowers(g,0);updateMemeFollowers(g,.4);near(boss.hp,996.3);near(ranged.hp,96.3);assert.equal(ranged.phoneMutedUntil,2.6);assert.equal(boss.phoneMutedUntil,undefined);assert.deepEqual(boss.puppetSkill,{mode:'needle',t:.2});assert.equal(g.enemyBullets.length,1);
});
test('property marks bosses for 4 seconds and combines additively with the 6-second ghost mark',()=>{
 const g=game(['propertycard','ghostbuddha']),boss=g.room.enemies[0];g.activeCharge=g.activeCost();updateActive(g,0,{active:true});assert.equal(boss.propertyMarkedUntil,4);let before=boss.hp;g.damageEnemy(boss,10);near(before-boss.hp,12.3);g.p.inv=0;g.hurt();before=boss.hp;g.damageEnemy(boss,10);near(before-boss.hp,15);g.actionClock=4;before=boss.hp;g.damageEnemy(boss,10);near(before-boss.hp,13.5);g.actionClock=6;before=boss.hp;g.damageEnemy(boss,10);near(before-boss.hp,10.8);
});
test('quiet badge needs 35 charge and extends laugh radius; polite suit improves cadence without reducing damage',()=>{
 const g=game(['quietbadge','politesuit']);assert.equal(g.activeCost(),35);near(g.attackInterval(),.28*.8);g.shoot(1,0);assert.equal(g.bullets[0].damage,1);const e=g.room.enemies[0];e.x=g.p.x+205;e.r=20;const hp=e.hp;g.activeCharge=35;updateActive(g,0,{active:true});assert.equal(e.hp,hp-4);g.items.push('battery');assert.equal(g.activeCost(),25);
});
test('turtle contact cooldown roundtrips without crash or duplicate contact and repairs old map-less saves',()=>{
 const g=game(['turtle']);updateFollowers(g,0);const s=g.followerStates.turtle,e=g.room.enemies[0];e.x=s.x;e.y=s.y;updateFollowers(g,0);const hp=e.hp;const r=deserializeRun(serializeRun(g)).game;updateFollowers(r,0);assert.equal(r.room.enemies[0].hp,hp);assert.ok(r.followerStates.turtle.contactHits instanceof Map);r.followerStates.turtle.contactHits={};assert.doesNotThrow(()=>updateFollowers(r,0));
});
