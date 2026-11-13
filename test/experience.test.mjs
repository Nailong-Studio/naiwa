import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,ITEMS} from '../dist/campaign.js';
import {ItemAudio} from '../dist/item-audio.js';
import {BossAudio} from '../dist/boss-audio.js';
import {clearMeme,bounceMeme} from '../dist/meme-items.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function shot(ids=[]){const g=new Game(()=>.42);g.start();g.items=ids;g.room.obstacles=[];g.room.hazards=[];g.shoot(1,0);return g;}
test('badge and stones never reduce attack; standalone rim supplies its own bounded bounce',()=>{
 for(const id of ['quietbadge','stonepouch']){const g=shot([id]);close(g.bullets[0].damage,1);close(g.attackInterval(),.28)}
 const g=shot(['ironrim']),b=g.bullets[0];assert.equal(b.bounce,1);bounceMeme(g,b);close(b.damage,1.35);bounceMeme(g,b);close(b.damage,1.35);
 assert.equal(shot(['quietbadge','battery']).activeCost(),25);
});
test('fan preserves central long-range DPS with a capped close-range bonus and no companion boost',()=>{
 const g=shot(['fanvoice']),center=g.bullets.find(b=>b.vy===0),sides=g.bullets.filter(b=>b.vy!==0);
 close(center.damage/g.attackInterval(),1/.28);close(center.life,1.35);close(sides[0].life,.42);close(g.bullets.reduce((n,b)=>n+b.damage,0),1.85);
 g.shoot(1,0,true);close(g.bullets.at(-1).damage,.65);
});
test('heavy, wood and their combinations preserve shot distance and echo turnaround distance',()=>{
 for(const prefix of [[],['fanvoice'],['returnvoice'],['fanvoice','returnvoice']]){
 const base=shot(prefix).bullets;
 for(const extra of [['heavyvoice'],['rollwood'],['heavyvoice','rollwood']]){
 const bs=shot([...prefix,...extra]).bullets;
 bs.forEach((b,i)=>{close(Math.hypot(b.vx,b.vy)*b.life,Math.hypot(base[i].vx,base[i].vy)*base[i].life);if(prefix.includes('returnvoice'))close(b.shotSpeed*b.returnAfter,base[i].shotSpeed*base[i].returnAfter)});
 }}
});
test('gugu retains the original center hit and has bounded 120 percent bonus every fourth volley',()=>{
 const g=shot(['gugucharm']);g.memeVolley=3;g.bullets=[];g.shoot(1,0);close(g.bullets.find(b=>b.vy===0).damage,1);close(g.bullets.reduce((n,b)=>n+b.damage,0),2.2);
});
test('conditional items have a modest baseline, with replacement rather than multiplying their buff',()=>{
 const g=shot(['scarf','milkfilter']);close(g.bullets[0].damage,1.1*1.08);g.p.hp=2;g.effects.push({type:'milkPool',x:g.p.x,y:g.p.y,radius:50,friendly:true,life:3});g.bullets=[];g.shoot(1,0);close(g.bullets[0].damage,1.7*1.4);
 g.shoot(1,0,true);close(g.bullets.at(-1).damage,.65);
});
test('shrimp healing counts combat caches, banks at most one full-health recovery and ignores safety rooms',()=>{
 const g=shot(['shrimppaste']);for(let i=0;i<20;i++)clearMeme(g,{type:'shop'});assert.equal(g.shrimpClears,undefined);
 for(let i=0;i<20;i++)clearMeme(g,{type:'vault'});assert.equal(g.shrimpClears,4);g.p.hp=2;clearMeme(g,{type:'cache'});assert.equal(g.p.hp,3);assert.equal(g.shrimpClears,0);clearMeme(g,{type:'fight'});assert.equal(g.p.hp,3);
});
test('every obtainable item still creates finite projectiles and valid positive attack cadence',()=>{
 assert.equal(ITEMS.length,74);for(const item of ITEMS){const g=shot([item.id]);assert.ok(g.attackInterval()>0,item.id);for(const b of g.bullets)assert.ok([b.damage,b.life,b.vx,b.vy].every(Number.isFinite)&&b.damage>0,item.id)}
});
for(const kind of ['item','boss'])test(`${kind} voice starts its playback limit after loading, timeout releases channel, late completion stays cancelled`,async()=>{
 let now=0,resolve;const clips=[];const factory=()=>{const a={paused:true,ended:false,currentTime:0,play(){this.paused=false;return new Promise(r=>resolve=r)},pause(){this.paused=true}};clips.push(a);return a};
 const a=kind==='item'?new ItemAudio({now:()=>now,createAudio:factory}):new BossAudio({now:()=>now,createAudio:factory});
 const request=()=>kind==='item'?a.request('man'):a.request('bull','charge',{});
 request();now=3000;a.update(true);assert.ok(a.current);resolve();await Promise.resolve();now=4000;a.update(true);assert.ok(a.current,'cold loading must not cut off the actual line');a.stop();now=20000;request();const late=resolve;now=28001;a.update(true);assert.equal(a.current,null);assert.ok(clips.every(c=>c.paused));late();await Promise.resolve();assert.equal(a.current,null);assert.ok(request());
});
test('synchronously rejected boss playback does not break the game event loop',()=>{const a=new BossAudio({createAudio:()=>({play(){throw Error('unavailable')},pause(){},currentTime:0})});assert.equal(a.request('bull','charge',{}),false);assert.equal(a.current,null);assert.equal(a.last.bull,undefined)});
