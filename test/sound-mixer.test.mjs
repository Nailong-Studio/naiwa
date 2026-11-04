import test from 'node:test';
import assert from 'node:assert/strict';
import {SoundMixer} from '../dist/sound-mixer.js';
import {GameAudio} from '../dist/game-audio.js';
import {BossAudio} from '../dist/boss-audio.js';
import {ItemAudio} from '../dist/item-audio.js';
import {playPlayerLaugh,requestBossCue} from '../dist/combat-audio.js';

function setup(){
 const clips=[],nodes=[],param=()=>({setValueAtTime(v){this.value=v},exponentialRampToValueAtTime(){}});
 const context={state:'running',currentTime:0,destination:{},resume(){return Promise.resolve()},createGain(){return {gain:param(),connect(){return this},disconnect(){}}},createOscillator(){const o={frequency:param(),live:false,connect(){return this},disconnect(){this.live=false},start(){this.live=true},stop(time){if(time===undefined)this.live=false}};nodes.push(o);return o}};
 const mixer=new SoundMixer({createContext:()=>context,createAudio:url=>{const events={};const a={url,paused:true,ended:false,muted:false,currentTime:0,play(){this.paused=false;return this.result},pause(){this.paused=true},addEventListener(k,fn){(events[k]??=[]).push(fn)},emit(k){for(const fn of events[k]||[])fn()}};clips.push(a);return a}});
 return {mixer,clips,nodes,context};
}
test('mass kills and shooting are coalesced; hurt wins, and only one oscillator can be live',()=>{
 const {mixer,nodes}=setup();mixer.beginFrame();for(let i=0;i<40;i++)mixer.cue(240,.08);mixer.cue(520,.045);mixer.cue(120,.18,'sawtooth',.025,5);mixer.endFrame();
 assert.equal(nodes.length,1);assert.equal(nodes[0].frequency.value,120);
 for(let i=0;i<40;i++)mixer.cue();assert.equal(nodes.length,1);
 mixer.cue(100,.1,'sine',.04,6);assert.equal(nodes.filter(n=>n.live).length,1);assert.equal(mixer.tone.gain.gain.value,.025);
 mixer.stopTone();assert.equal(nodes.filter(n=>n.live).length,0);
});
test('speech silences existing and same-frame effects; no backlog resumes after speech',()=>{
 const {mixer,nodes}=setup();mixer.cue();const a=mixer.createAudio('laugh');mixer.beginFrame();mixer.cue(120,.2,'sine',.025,5);a.play();mixer.endFrame();
 assert.equal(nodes.filter(n=>n.live).length,0);assert.equal(mixer.cue(),false);a.emit('ended');mixer.endFrame();assert.equal(nodes.length,1);
 assert.equal(mixer.cue(),true);assert.equal(nodes.length,2);
});
test('all recorded sources share focus, including revival and delayed starts',async()=>{
 const {mixer,clips}=setup(),a=mixer.createAudio('item'),b=mixer.createAudio('boss'),revive=mixer.createAudio('revive');let resolve;
 a.result=new Promise(r=>resolve=r);a.play();b.play();assert.equal(a.paused,true);revive.play();assert.equal(b.paused,true);resolve();await Promise.resolve();
 // Even a delayed browser playing event cannot make the displaced clip audible.
 a.paused=false;a.emit('playing');assert.equal(a.paused,true);assert.deepEqual(clips.filter(c=>!c.paused).map(c=>c.url),['revive']);
 revive.pause();assert.equal(mixer.voice,null);
});
test('muted unlock cannot steal focus or release a later real play when its old promise rejects',async()=>{
 const {mixer}=setup(),a=mixer.createAudio('item'),b=mixer.createAudio('boss');let reject;
 a.muted=true;a.result=new Promise((r,j)=>reject=j);a.play().catch(()=>{});a.pause();b.play();assert.equal(mixer.voice,b);
 a.result=undefined;a.muted=false;a.play();reject(new Error('aborted unlock'));await Promise.resolve();assert.equal(mixer.voice,a);assert.equal(a.paused,false);assert.equal(b.paused,true);
});
test('suspended audio context drops queued effects instead of bursting them on resume',async()=>{
 const {mixer,context,nodes}=setup();context.state='suspended';context.resume=()=>Promise.reject(new Error('gesture needed'));
 for(let i=0;i<50;i++)mixer.cue();await Promise.resolve();assert.equal(nodes.length,0);context.state='running';mixer.cue();assert.equal(nodes.length,1);
});
test('mute and pause clear both running and pending effects; stale ended events cannot clear a replacement',()=>{
 const {mixer,nodes}=setup();mixer.cue();mixer.cue(120,.1,'sine',.02,5);nodes[0].onended();assert.ok(mixer.tone);
 mixer.beginFrame();mixer.cue(500,.1,'sine',.02,6);mixer.setEnabled(false);mixer.endFrame();assert.equal(nodes.filter(n=>n.live).length,0);assert.equal(nodes.length,2);assert.equal(mixer.cue(),false);
 mixer.setEnabled(true);mixer.cue();mixer.stopTone();assert.equal(nodes.filter(n=>n.live).length,0);
});
test('real controllers: item, queued dual bosses, active laugh and revive remain exclusive',()=>{
 const {mixer,clips,nodes}=setup();let now=0;const createAudio=url=>mixer.createAudio(url),voice=new GameAudio({createAudio}),bossVoice=new BossAudio({createAudio,now:()=>now}),itemVoice=new ItemAudio({createAudio,isBusy:()=>voice.playing||!!bossVoice.current}),channels={voice,bossVoice,itemVoice};
 const check=()=>assert.ok(clips.filter(a=>!a.paused&&!a.muted&&!a.ended).length+nodes.filter(n=>n.live).length<=1);
 mixer.cue();check();itemVoice.request('man');check();requestBossCue(channels,{kind:'bull',skill:'charge',owner:{}});check();requestBossCue(channels,{kind:'meishu',skill:'traps',owner:{}});check();
 now=3500;bossVoice.current.audio.ended=true;bossVoice.update(true);check();assert.equal(bossVoice.current.key,'meishu');playPlayerLaugh(channels,{now:4000});check();assert.equal(mixer.cue(),false);
 voice.stop();bossVoice.stop();itemVoice.stop();const revive=createAudio('revive');revive.play();check();assert.equal(mixer.cue(),false);revive.pause();check();
});
