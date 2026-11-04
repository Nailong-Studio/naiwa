import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {ItemAudio,ITEM_VOICES} from '../dist/item-audio.js';
import {Game} from '../dist/campaign.js';
import {updatePhoebe} from '../dist/phoebe-items.js';
import {updateMemeFollowers} from '../dist/meme-followers.js';
function setup(){let now=0,busy=false;const clips=[];const audio=new ItemAudio({now:()=>now,isBusy:()=>busy,createAudio:()=>{const a={paused:true,ended:false,plays:0,currentTime:0,play(){this.paused=false;this.ended=false;this.plays++;return undefined},pause(){this.paused=true}};clips.push(a);return a}});return {audio,clips,time:t=>now=t,busy:v=>busy=v}}
test('item clips exist and repeated events obey per-clip cooldown, global gap and one voice at a time',()=>{for(const v of Object.values(ITEM_VOICES))assert.ok(existsSync(new URL('../dist/assets/'+v.file,import.meta.url)));const {audio,clips,time}=setup();assert.ok(audio.request('man'));assert.equal(audio.request('man'),false);assert.equal(audio.request('quiet'),false);time(1500);audio.update(true);assert.equal(audio.current,null);assert.equal(audio.request('mamba'),false);time(4600);assert.ok(audio.request('mamba'));time(6000);assert.equal(audio.request('man'),false);time(9200);assert.ok(audio.request('man'));assert.equal(clips.filter(a=>!a.paused).length,1)});
test('boss/laugh priority, pause and mute stop item sounds without queued replay',()=>{const {audio,clips,busy,time}=setup();busy(true);assert.equal(audio.request('man'),false);busy(false);assert.ok(audio.request('man'));busy(true);audio.update(true);assert.equal(audio.current,null);assert.ok(clips.every(a=>a.paused));busy(false);time(10000);audio.update(true);assert.equal(clips[0].plays,1);audio.request('quiet');audio.update(false);assert.equal(audio.current,null);audio.setEnabled(false);time(30000);assert.equal(audio.request('man'),false)});
test('blocked autoplay may retry and a late rejection cannot cancel a newer clip',async()=>{const {audio,clips,time}=setup();clips[0].play=()=>Promise.reject(new Error('blocked'));audio.request('man');await Promise.resolve();assert.equal(audio.last.man,undefined);assert.equal(audio.current,null);let reject;clips[0].play=()=>new Promise((_,r)=>reject=r);audio.request('man');audio.stop();time(4600);audio.request('quiet');reject(new Error('late'));await Promise.resolve();assert.equal(audio.current.key,'quiet')});
test('pending mobile unlock never unmutes stale playback after stop or reset',async()=>{const {audio,clips}=setup();const resolve=[];for(const a of clips)a.play=()=>{a.paused=false;return new Promise(r=>resolve.push(r))};audio.unlock();audio.reset();for(const r of resolve)r();await Promise.resolve();assert.ok(clips.every(a=>a.paused&&a.currentTime===0&&a.muted))});
function game(ids=[]){const g=new Game(()=>.42);g.start();g.items=ids;g.room.type='fight';g.room.clear=false;g.room.obstacles=[];g.room.hazards=[];g.room.enemies=[g.spawn('turret',700,300)];g.room.enemies[0].hp=100;g.room.enemies[0].cd=999;g.p.inv=999;g.events=[];return g}
test('Man audio fires once on the actual empowered volley, not on charge, pellets or split hits',()=>{const g=game(['man','double','fanvoice','split']),e=g.room.enemies[0];for(let n=0;n<5;n++){g.bullets=[];g.shoot(1,0);for(const b of [...g.bullets])g.onBulletHit(e,b)}assert.ok(g.manReady);assert.equal(g.events.filter(e=>e.type==='itemVoice').length,0);g.shoot(0,0);assert.ok(g.manReady);g.shoot(1,0);assert.equal(g.events.filter(e=>e.type==='itemVoice'&&e.key==='man').length,1);g.shoot(1,0);assert.equal(g.events.filter(e=>e.type==='itemVoice').length,1)});
test('Mamba voice requires owned item and combat dash landing; no repeated frame cues',()=>{for(const owns of [false,true]){const g=game(owns?['mambaout']:[]);g.update(.02,{dash:true,mx:1});for(let i=0;i<30;i++)g.update(.02,{});assert.equal(g.events.filter(e=>e.type==='itemVoice'&&e.key==='mamba').length,owns?1:0)}});
test('quiet badge preserves the ordinary laugh event and cannot bypass skill charge mechanics',()=>{const g=game(['quietbadge']);g.update(.02,{active:true});assert.equal(g.events.filter(e=>e.type==='laugh').length,0);g.update(.02,{});g.activeCharge=g.activeCost();g.update(.02,{active:true});const events=g.events.filter(e=>e.type==='laugh');assert.equal(events.length,1);assert.equal(events[0].itemVoice,undefined);assert.equal(g.activeCharge,0);g.update(.02,{active:true});assert.equal(g.events.filter(e=>e.type==='laugh').length,1)});
const cues=g=>g.events.filter(e=>e.type==='itemVoice').map(e=>e.key);
test('low-volume single-channel cues leave 4.5 seconds between starts and prioritize rare effects without queues',()=>{
 const {audio,clips,time}=setup();assert.ok(clips.every(a=>a.volume===.38));assert.equal(audio.requestMany(['gugu','man','phoebesoot','phoebesoot']),'phoebesoot');assert.equal(clips.reduce((n,a)=>n+a.plays,0),1);
 time(3200);audio.update(true);assert.equal(audio.requestMany(['oyeye','phoebe']),null);time(4500);assert.equal(audio.current,null);assert.equal(audio.requestMany(['phoebesoot','oyeye']),'oyeye');
 audio.stop();time(20000);audio.update(true);assert.equal(clips.reduce((n,a)=>n+a.plays,0),2,'skipped cues never replay later');
});
test('Phoebe voice waits for completed unrolling; cancelled cables never speak',()=>{
 for(const cancelled of [false,true]){const g=game(['phoebe']);g.p.x=300;g.p.y=300;g.room.enemies[0].x=550;g.room.enemies[0].y=348;
  updatePhoebe(g,.7,.7,g.p);assert.equal(g.phoebe.phase,'windup');assert.deepEqual(cues(g),[]);updatePhoebe(g,.36,.36,g.p);assert.equal(g.phoebe.phase,'unroll');assert.deepEqual(cues(g),[]);
  if(cancelled)g.room.clear=true;updatePhoebe(g,.41,.41,g.p);updatePhoebe(g,.1,.1,g.p);assert.deepEqual(cues(g),cancelled?[]:['phoebe']);
 }
});
test('soot voice only follows successful ground protection, once per room',()=>{
 const g=game(['phoebesoot']);g.p.inv=0;g.hurtGround();assert.deepEqual(cues(g),['phoebesoot']);g.p.inv=0;g.hurtGround();g.p.inv=0;g.hurt();assert.deepEqual(cues(g),['phoebesoot']);
});
test('Tempura only says oye when a physical supply is actually created',()=>{
 const g=game(['tempura']);updateMemeFollowers(g,0);const s=g.memePets.tempura;s.cd=0;updateMemeFollowers(g,0);assert.deepEqual(cues(g),[]);updateMemeFollowers(g,.4);assert.equal(g.shrimpMeals.length,1);assert.deepEqual(cues(g),['oyeye']);updateMemeFollowers(g,.1);assert.deepEqual(cues(g),['oyeye']);
 s.phase='windup';s.t=.4;g.room.tempuraServings=2;updateMemeFollowers(g,0);assert.deepEqual(cues(g),['oyeye']);
});
test('rhythm and gugu cues count volleys, not pellets; follower shots do not speak',()=>{
 const g=game(['oyeye','gugucharm','double','fanvoice']);for(let n=0;n<20;n++)g.shoot(1,0);assert.equal(cues(g).filter(k=>k==='oyeye').length,5);assert.equal(cues(g).filter(k=>k==='gugu').length,5);const n=cues(g).length;g.shoot(0,0);g.shoot(1,0,true);assert.equal(cues(g).length,n);
});
test('feet voice requires landing in combat and is emitted once, never every footprint frame',()=>{
 for(const clear of [false,true]){const g=game(['shrimpfeet']);g.room.clear=clear;g.update(.02,{dash:true,mx:1});for(let n=0;n<40;n++)g.update(.02,{});assert.deepEqual(cues(g),clear?[]:['shrimpfeet']);}
});
