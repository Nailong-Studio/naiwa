import test from 'node:test';
import assert from 'node:assert/strict';
import {ItemAudio,ITEM_VOICES,ITEM_VOICE_OWNERS,ownsItemVoice} from '../dist/item-audio.js';
import {BossAudio} from '../dist/boss-audio.js';
import {GameAudio} from '../dist/game-audio.js';
import {Game} from '../dist/campaign.js';
function harness(Type,options={}){
 const clips=[],pending=[];const audio=new Type({...options,createAudio:()=>{const a={paused:true,muted:false,ended:false,currentTime:0,play(){this.paused=false;return new Promise((resolve,reject)=>pending.push({resolve,reject,a}))},pause(){this.paused=true}};clips.push(a);return a}});return {audio,clips,pending};
}
test('repeated media unlock never leaves unrequested clips playing, including rejection and reset races',async()=>{
 for(const Type of [ItemAudio,BossAudio,GameAudio]){
  const {audio,clips,pending}=harness(Type);audio.unlock();audio.unlock();assert.equal(pending.length,clips.length,'repeated unlock is coalesced');assert.ok(clips.every(a=>a.paused&&a.muted));
  pending.forEach((p,i)=>i%2?p.resolve():p.reject(new Error('aborted')));await Promise.resolve();assert.ok(clips.every(a=>a.paused&&a.currentTime===0));
  pending.length=0;audio.unlock();audio.stop();pending.forEach(p=>p.reject(new Error('late')));await Promise.resolve();assert.ok(clips.every(a=>a.paused));
 }
});
test('unlock cannot restart/mute an active requested voice or stop it when older promises reject',async()=>{
 for(const Type of [ItemAudio,BossAudio,GameAudio]){
  const {audio,clips,pending}=harness(Type);audio.unlock();const old=[...pending];
  if(Type===ItemAudio)audio.request('man');else if(Type===BossAudio)audio.request('bull','charge',{});else audio.laugh({long:true,now:0});
  const active=Type===GameAudio?audio.voice:audio.current.audio;active.currentTime=.25;const n=pending.length;audio.unlock();assert.equal(pending.length,n);assert.equal(active.currentTime,.25);assert.equal(active.muted,false);
  old.forEach(p=>p.reject(new Error('old unlock')));await Promise.resolve();assert.equal(active.paused,false);assert.equal(active.muted,false);assert.ok(clips.filter(a=>a!==active).every(a=>a.paused));audio.stop();
 }
});
test('every item voice is ownership-gated at playback and revoked ownership stops the current cue',()=>{
 const owned=new Set(),g={has:id=>owned.has(id)};let now=0;
 const {audio,pending}=harness(ItemAudio,{now:()=>now,canPlay:key=>ownsItemVoice(g,key)});
 assert.deepEqual(Object.keys(ITEM_VOICES).sort(),Object.keys(ITEM_VOICE_OWNERS).sort());
 for(const key of Object.keys(ITEM_VOICES))assert.equal(audio.request(key),false);assert.equal(pending.length,0);
 for(const [key,ids] of Object.entries(ITEM_VOICE_OWNERS))for(const id of ids){owned.add(id);now+=20000;assert.equal(audio.request(key),true);owned.clear();audio.update(true);assert.equal(audio.current,null)}
 assert.equal(audio.requestMany(['man','phoebe','oyeye']),null);assert.equal(ownsItemVoice(g,'unknown'),false);
});
test('stale Man readiness without the item cannot empower shots or emit its voice; empty inventory produces no item voice',()=>{
 const g=new Game(()=>.42);g.start();g.manReady=true;g.items=[];g.events=[];g.shoot(1,0);assert.equal(g.bullets.at(-1).manBoost,false);assert.equal(g.bullets.at(-1).damage,1);
 g.room.type='fight';g.room.clear=false;g.room.obstacles=[];g.room.enemies=[g.spawn('turret',800,450)];g.room.enemies[0].hp=999;g.room.enemies[0].cd=999;g.p.inv=999;
 for(let n=0;n<200;n++)g.update(.02,{fire:true,ax:1,dash:n===1,mx:n<15?1:0});assert.equal(g.events.filter(e=>e.type==='itemVoice').length,0);
});
