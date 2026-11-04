import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
import {startRescue,isRescueKey} from '../dist/rescue.js';
import {GameAudio} from '../dist/game-audio.js';
import {MOB_SHEETS,actorFrame} from '../dist/sprite-art.js';
import {drawPixelEffect,FOREGROUND_EFFECTS,drawPickup} from '../dist/pixel-effects.js';
import {updateFollowers,resetFollowers} from '../dist/follower-combat.js';
const step=(g,n)=>{for(let i=0;i<n;i++)g.update(.02)};
test('rescue requires 24 fresh gestures, pauses, then breaks cage and reunites before victory',()=>{
 const g=new Game();g.start();startRescue(g);const x=g.p.x;g.update(.02,{mx:1,fire:true,bomb:true});assert.equal(g.p.x,x);assert.equal(g.bullets.length,0);
 assert.ok(g.rescueLaugh());assert.equal(g.rescueLaugh(),false);assert.equal(g.rescue.presses,1);
 const before={...g.rescue};g.mode='paused';step(g,100);assert.deepEqual(g.rescue,before);assert.equal(g.rescueLaugh(),false);g.mode='rescue';
 for(let i=1;i<24;i++){step(g,4);assert.ok(g.rescueLaugh())}
 assert.equal(g.rescue.phase,'breaking');assert.equal(g.mode,'rescue');assert.equal(g.rescueLaugh(),false);step(g,81);assert.equal(g.rescue.phase,'reunion');step(g,176);assert.equal(g.mode,'win');step(g,100);assert.equal(g.events.filter(e=>e.type==='end').length,1);assert.equal(new Game().rescue,undefined);
});
test('held keys and browser shortcuts cannot fill rescue progress',()=>{
 for(const e of [{key:'a',repeat:true},{key:'r',ctrlKey:true},{key:'p'},{key:'Escape'},{key:'Tab'},{key:'F5'}])assert.equal(isRescueKey(e),false);
 for(const key of ['a',' ','ArrowUp','Enter'])assert.equal(isRescueKey({key}),true);
});
test('laugh recording respects mute, cooldown and long climax without overlapping channels',()=>{
 let plays=0,pauses=0;const fake={paused:true,ended:false,currentTime:0,play(){plays++;this.paused=false;return Promise.resolve()},pause(){pauses++;this.paused=true}};
 const audio=new GameAudio({createAudio:()=>fake});audio.laugh({now:0});audio.laugh({now:100});assert.equal(plays,1);audio.laugh({long:true,now:200});assert.equal(plays,2);audio.laugh({now:1000});assert.equal(plays,2);audio.setEnabled(false);assert.ok(pauses>0);assert.equal(audio.laugh({long:true,now:2000}),false);assert.equal(plays,2);
});
test('late audio unlock does not cut off a newly triggered short laugh or leave repeated unlock muted',async()=>{
 const pending=[];const fake={paused:true,ended:false,muted:false,currentTime:0,play(){this.paused=false;return new Promise(resolve=>pending.push(resolve))},pause(){this.paused=true}};
 const audio=new GameAudio({createAudio:()=>fake});audio.unlock();audio.unlock();audio.laugh({now:0});for(const resolve of pending)resolve();await Promise.resolve();
 assert.equal(fake.paused,false);assert.equal(fake.muted,false);audio.stop();
});
test('old failed laugh cannot cancel a newer climax and disabled audio stays stopped',async()=>{
 const pending=[];const fake={paused:true,ended:false,muted:false,currentTime:0,play(){this.paused=false;return new Promise((resolve,reject)=>pending.push({resolve,reject}))},pause(){this.paused=true}};
 const audio=new GameAudio({createAudio:()=>fake});audio.laugh({now:0});audio.stop();audio.laugh({long:true,now:100});pending[0].reject(new Error('old play aborted'));await Promise.resolve();assert.equal(audio.longPlaying,true);assert.equal(audio.playing,true);
 audio.setEnabled(false);pending[1].resolve();await Promise.resolve();assert.equal(fake.paused,true);assert.equal(audio.playing,false);
});
test('all 25 mobs have action sheets and boss frames stay within their animation grids',()=>{
 assert.equal(new Set(MOB_SHEETS.flatMap(s=>s[1])).size,25);
 for(const kind of ['collector','speaker','catcher','puppet','bull','meishu'])for(const state of [{},{hit:1},{artMoving:true},{finalSkill:{age:0,wind:1}},{finalSkill:{age:2,wind:1}},{dead:true}]){const frame=actorFrame({type:'boss',kind,...state},1);assert.ok(frame>=0&&frame<(['bull','meishu'].includes(kind)?8:4))}
});
test('every foreground effect and resource icon renders finite geometry, no generic fallback',()=>{
 const c=new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:(...args)=>{for(const n of args)if(typeof n==='number')assert.ok(Number.isFinite(n))},set:(o,k,v)=>(o[k]=v,true)});
 for(const type of FOREGROUND_EFFECTS)for(const life of [.01,.3,.6])assert.ok(drawPixelEffect(c,{type,x:100,y:150,tx:300,ty:200,radius:160,life,max:.6}));assert.equal(drawPixelEffect(c,{type:'milkPool'}),false);for(const type of ['coin','key','heart','bomb','chest'])drawPickup(c,type,100,150);
});
test('changing rooms cancels pet targets and delayed rabbit damage',()=>{
 const g=new Game();g.start();g.items.push('dog','rabbit');g.rabbitRequest={x:1,y:1,targets:[]};g.rabbitWave={t:0};g.followerStates={dog:{target:{}}};resetFollowers(g);assert.equal(g.rabbitRequest,null);assert.equal(g.rabbitWave,null);assert.deepEqual(g.followerStates,{});updateFollowers(g,.02);assert.equal(g.followerStates.dog.phase,'idle');
});
