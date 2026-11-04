import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
import {updateScreech,drawScreech} from '../dist/screech.js';
const setup=()=>{const g=new Game();g.start();const e=g.spawn('soundTurret',300,300);g.p.x=700;g.p.y=300;g.room.enemies=[e];return {g,e}};
test('screech turret rotates three patterns and shifts repeated radial lanes',()=>{
 const {g,e}=setup(),directions=[];
 for(let i=0;i<6;i++){g.enemyBullets=[];g.enemyAttack(e);assert.equal(e.screech.kind,['ring','fan','cross'][i%3]);directions.push([...e.screech.angles]);updateScreech(g,e,.49);assert.equal(g.enemyBullets.length,0);updateScreech(g,e,.02);assert.equal(g.enemyBullets.length,[6,5,4][i%3]);}
 assert.notDeepEqual(directions[0],directions[3]);assert.notDeepEqual(directions[2],directions[5]);
});
test('fan locks to its warning direction, then retargets the player on the next cycle',()=>{
 const {g,e}=setup();e.screechCycle=1;g.enemyAttack(e);g.p.x=300;g.p.y=100;updateScreech(g,e,.51);assert.ok(Math.abs(g.enemyBullets[2].vy)<1e-9);e.screechCycle=4;g.enemyAttack(e);updateScreech(g,e,.51);assert.ok(g.enemyBullets.at(-3).vy<0);assert.ok(Math.abs(g.enemyBullets.at(-3).vx)<1e-9);
});
test('dead or repelled screech turrets cancel their pending attack and pause freezes warnings',()=>{
 for(const interrupt of ['dead','repelled']){const {g,e}=setup();g.enemyAttack(e);g.mode='paused';g.update(.04);assert.equal(e.screech.t,0);e[interrupt]=interrupt==='dead'?true:.3;updateScreech(g,e,.6);assert.equal(g.enemyBullets.length,0);assert.equal(e.screech,null)}
});
test('all three sound turret warnings draw finite, distinct shot guides',()=>{
 const labels=[],ctx=new Proxy({}, {get:(_,key)=>(...args)=>{for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a));if(key==='fillText')labels.push(args[0])},set:()=>true});
 for(let i=0;i<3;i++){const {g,e}=setup();e.screechCycle=i;g.enemyAttack(e);drawScreech(ctx,e)}assert.equal(new Set(labels).size,3);
});
