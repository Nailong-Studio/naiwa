import test from 'node:test';
import assert from 'node:assert/strict';
import {GameAudio} from '../dist/game-audio.js';
import {ItemAudio} from '../dist/item-audio.js';
import {BossAudio} from '../dist/boss-audio.js';
import {playPlayerLaugh,requestBossCue} from '../dist/combat-audio.js';
const media=()=>({paused:true,ended:false,currentTime:0,play(){this.paused=false;return Promise.resolve()},pause(){this.paused=true}});
test('slow-starting laugh receives the full short clip after playback starts, not from request time',async()=>{
 let resolve;const a=media(),timers=[];a.play=()=>{a.paused=false;return new Promise(r=>resolve=r)};
 const voice=new GameAudio({createAudio:()=>a,schedule:(fn,ms)=>{timers.push({fn,ms});return 1},cancel:()=>{}});
 voice.laugh({now:0});assert.equal(timers.length,1);assert.equal(timers[0].ms,8000);assert.equal(voice.playing,true);
 resolve();await Promise.resolve();assert.equal(timers.length,2);assert.equal(timers[1].ms,1100);assert.equal(a.paused,false);timers[1].fn();assert.equal(a.paused,true);
});
test('cancelled or rejected playback cannot schedule stale cutoffs and real errors are reported once',async()=>{
 let resolve,reject;const a=media(),timers=[],errors=[];a.play=()=>new Promise((r,j)=>{resolve=r;reject=j});
 const voice=new GameAudio({createAudio:()=>a,schedule:fn=>timers.push(fn),cancel:()=>{},onError:e=>errors.push(e)});
 voice.laugh({now:0});voice.stop();resolve();await Promise.resolve();assert.equal(timers.length,1);
 voice.laugh({now:1000});reject(new Error('blocked'));await Promise.resolve();assert.equal(voice.playing,false);assert.equal(errors.length,1);assert.equal(timers.length,2);
 a.play=()=>{throw new Error('bad source')};assert.equal(voice.laugh({now:2000}),false);assert.equal(errors.length,2);
});
test('active laugh preempts boss and item lines, cannot be interrupted by new boss cues, and respects mute',async()=>{
 const voice=new GameAudio({createAudio:media}),bossVoice=new BossAudio({createAudio:media}),itemVoice=new ItemAudio({createAudio:media,isBusy:()=>voice.playing||!!bossVoice.current}),channels={voice,bossVoice,itemVoice};
 itemVoice.request('man');requestBossCue(channels,{kind:'bull',skill:'charge',owner:{}});assert.equal(itemVoice.current,null);assert.equal(bossVoice.current.key,'bull');
 assert.equal(playPlayerLaugh(channels),true);assert.equal(bossVoice.current,null);assert.equal(voice.playing,true);assert.equal(voice.voice.paused,false);
 assert.equal(requestBossCue(channels,{kind:'meishu',skill:'traps',owner:{}}),false);assert.equal(itemVoice.request('quiet'),false);assert.equal(bossVoice.pending,null);
 await Promise.resolve();voice.stop();assert.equal(requestBossCue(channels,{kind:'meishu',skill:'traps',owner:{}}),true);
 voice.setEnabled(false);assert.equal(playPlayerLaugh(channels),false);assert.equal(bossVoice.current.key,'meishu');bossVoice.stop();
});
