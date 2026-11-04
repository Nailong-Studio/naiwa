import test from 'node:test';
import assert from 'node:assert/strict';
import {BossAudio,bossVoiceKey} from '../dist/boss-audio.js';
import {Game} from '../dist/campaign.js';
function setup(){let time=0;const clips=[];const audio=new BossAudio({now:()=>time,createAudio:()=>{const a={paused:true,ended:false,currentTime:0,plays:0,play(){this.paused=false;this.ended=false;this.plays++;return undefined},pause(){this.paused=true}};clips.push(a);return a}});return {audio,clips,time:t=>time=t}}
test('mobile unlock keeps only the requested boss clip playing when promises settle late',async()=>{
 const {audio,clips}=setup(),pending=[];
 for(const a of clips)a.play=()=>{a.paused=false;return new Promise(resolve=>pending.push(resolve))};
 audio.unlock();audio.request('bull','charge',{});for(const resolve of pending)resolve();await Promise.resolve();
 assert.equal(clips.filter(a=>!a.paused).length,1);assert.equal(clips[0].paused,false);
 assert.ok(clips.slice(1).every(a=>a.paused&&a.currentTime===0));
});
test('boss voice maps distinctive skills to original clips, without shouting on every volley',()=>{assert.equal(bossVoiceKey('bull','charge'),'bull');assert.equal(bossVoiceKey('bull','stomp'),'bullRage');assert.equal(bossVoiceKey('meishu','traps'),'meishu');assert.equal(bossVoiceKey('meishu','curtain'),'meishu');assert.equal(bossVoiceKey('meishu','fan'),null)});
test('voices serialize with a per-clip cooldown and bounded pending cue',()=>{const {audio,clips,time}=setup();assert.ok(audio.request('bull','charge',{}));assert.equal(audio.request('meishu','traps',{}),false);assert.equal(clips[2].plays,0);time(3500);clips[0].ended=true;audio.update(true);assert.equal(clips[2].plays,1);assert.equal(clips.filter(c=>!c.paused).length,1);time(8000);clips[2].ended=true;audio.update(true);assert.equal(audio.request('bull','charge',{}),false);time(12000);assert.ok(audio.request('bull','stomp',{}))});
test('pause/mute stop all sounds, discard pending audio and never replay a dead owner',()=>{const {audio,clips,time}=setup();const dead={dead:false};audio.request('bull','charge',{});audio.request('meishu','traps',dead);dead.dead=true;clips[0].ended=true;time(3500);audio.update(true);assert.equal(clips[2].plays,0);audio.reset();audio.request('meishu','traps',{});audio.update(false);assert.ok(clips.every(c=>c.paused));audio.update(true);assert.equal(clips[2].plays,1);audio.setEnabled(false);assert.equal(audio.request('bull','charge',{}),false)});
test('expired queued cues are discarded and failed playback permits a later retry',async()=>{const {audio,clips,time}=setup();audio.request('bull','charge',{});audio.request('meishu','traps',{});time(7000);audio.update(true);assert.equal(clips[2].plays,0);audio.reset();clips[0].play=()=>Promise.reject(new Error('blocked'));audio.request('bull','charge',{});await Promise.resolve();assert.equal(audio.current,null);assert.equal(audio.last.bull,undefined)});
test('real final boss skill starts emit one cue; updates do not emit it every frame',()=>{const g=new Game();g.start();g.floor=5;g.generate();g.enter(g.rooms.find(r=>r.exists&&r.type==='boss').id,'top');g.events=[];g.p.inv=999;const bull=g.room.enemies.find(e=>e.kind==='bull');g.enemyAttack(bull);assert.equal(g.events.filter(e=>e.type==='bossVoice'&&e.kind==='bull').length,1);for(let i=0;i<10;i++)g.update(.02);assert.equal(g.events.filter(e=>e.type==='bossVoice'&&e.kind==='bull').length,1)});

