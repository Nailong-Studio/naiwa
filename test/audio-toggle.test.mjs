import test from 'node:test';
import assert from 'node:assert/strict';
import {SoundMixer} from '../dist/sound-mixer.js';
import {GameAudio} from '../dist/game-audio.js';
import {BossAudio} from '../dist/boss-audio.js';
import {ItemAudio,ownsItemVoice} from '../dist/item-audio.js';
import {setGameSound} from '../dist/combat-audio.js';
import {unlockSilent} from '../dist/audio-unlock.js';
import {createRevivePlayer} from '../dist/revive-ui.js';

function setup(){
 const clips=[],pending=[];let tones=0;
 const soundMix=new SoundMixer({createContext:()=>{tones++;throw new Error('A switch must never synthesize sound')},createAudio:url=>{
  const a=new EventTarget();Object.assign(a,{url,paused:true,ended:false,muted:false,currentTime:0,duration:15.65,readyState:4,plays:0,pauseMuted:[],play(){this.plays++;this.paused=false;return new Promise((resolve,reject)=>pending.push({resolve,reject,a:this}))},pause(){this.pauseMuted.push(this.muted);this.paused=true}});clips.push(a);return a;
 }}),createAudio=url=>soundMix.createAudio(url),voice=new GameAudio({createAudio}),bossVoice=new BossAudio({createAudio}),itemVoice=new ItemAudio({createAudio,canPlay:key=>ownsItemVoice({has:()=>false},key)});
 return {soundMix,voice,bossVoice,itemVoice,clips,pending,createAudio,get tones(){return tones}};
}
test('muted revival retains media ownership when unmuted before delayed playing event',()=>{
 const h=setup(),revive=h.createAudio('revive');revive.muted=true;revive.play();assert.equal(h.soundMix.voice,revive);
 setGameSound(true,h,true);revive.muted=false;revive.dispatchEvent(new Event('playing'));assert.equal(revive.paused,false);assert.equal(h.soundMix.voice,revive);assert.equal(h.soundMix.cue(),false);
});
test('empty-inventory startup never unmutes primed item lines, including late gugu playback',async()=>{
 const h=setup();setGameSound(true,h);assert.equal(h.pending.length,12);h.pending.forEach(p=>p.resolve());await Promise.resolve();
 assert.ok(h.clips.every(a=>a.paused&&a.muted));assert.equal(h.itemVoice.request('gugu'),false);
 const gugu=h.itemVoice.clips.gugu;gugu.paused=false;gugu.dispatchEvent(new Event('playing'));assert.equal(gugu.paused,true);assert.equal(gugu.muted,true);assert.equal(h.tones,0);
});
test('mute closes the audible gate before pause and late unlock callbacks cannot reopen it',async()=>{
 const h=setup();h.voice.unlock();h.voice.laugh({now:0});assert.equal(h.voice.voice.muted,false);setGameSound(false,h);assert.ok(h.voice.voice.pauseMuted.every(Boolean));
 for(const p of h.pending)p.resolve();await Promise.resolve();assert.ok(h.clips.every(a=>a.paused&&a.muted));assert.equal(h.soundMix.cue(),false);assert.equal(h.tones,0);
});
test('revival sound toggling never primes other recordings and never plays a switch beep',()=>{
 const h=setup(),a=h.createAudio('revive');a.muted=true;a.play();
 for(let i=0;i<30;i++)setGameSound(i%2===0,h,true);
 assert.equal(h.clips.reduce((n,a)=>n+a.plays,0),1);assert.equal(h.soundMix.voice,a);assert.equal(h.tones,0);
});
test('silent priming cannot steal an existing muted revival media lease',async()=>{
 const h=setup(),a=h.createAudio('revive');a.play();const unused=h.itemVoice.clips.gugu;unlockSilent(unused,()=>false);assert.equal(h.soundMix.voice,a);
 h.pending.at(-1).resolve();await Promise.resolve();assert.equal(a.paused,false);assert.ok(unused.muted&&unused.paused);
});

function reviveHarness(){
 const h=setup(),nodes=new Map(),doc=new EventTarget(),view=new EventTarget();doc.hidden=false;
 const overlay={innerHTML:'',querySelector:s=>{if(!nodes.has(s))nodes.set(s,{textContent:'',disabled:false});return nodes.get(s)}};
 const g={mode:'dead',reviveUsed:false,p:{maxHp:6}},previous={window:globalThis.window,document:globalThis.document};globalThis.window=view;globalThis.document=doc;let enabled=false;
 const player=createRevivePlayer({getGame:()=>g,overlay,getSound:()=>enabled,onSound:()=>{enabled=!enabled;setGameSound(enabled,h,true)},onCancel:()=>{},onRevive:()=>{},createAudio:h.createAudio});player.open();const media=h.clips.at(-1);
 const restore=()=>{player.stop();for(const k of Object.keys(previous))if(previous[k]===undefined)delete globalThis[k];else globalThis[k]=previous[k]};
 return {...h,g,player,media,nodes,restore};
}
test('revive UI toggles resume the same recording without seeking, restarting progress or priming item audio',async()=>{
 const h=reviveHarness();try{
  h.g.reviveWatch.elapsed=4;h.media.currentTime=4.2;
  // Simulate mobile browsers pausing a media element as it becomes unmuted.
  let muted=h.media.muted;Object.defineProperty(h.media,'muted',{get:()=>muted,set:v=>{if(muted&&!v)h.media.paused=true;muted=v},configurable:true});
  h.nodes.get('#reviveMute').onclick();assert.equal(h.media.paused,false);assert.equal(h.media.currentTime,4.2);assert.equal(h.g.reviveWatch.elapsed,4);
  h.media.dispatchEvent(new Event('playing'));assert.equal(h.media.paused,false);assert.equal(h.soundMix.voice,h.media);
  for(let i=0;i<10;i++)h.nodes.get('#reviveMute').onclick();assert.equal(h.g.reviveWatch.elapsed,4);assert.equal(h.media.currentTime,4.2);assert.equal(h.clips.slice(0,-1).reduce((n,a)=>n+a.plays,0),0);
  h.pending[0].reject(new Error('old playback interrupted'));await Promise.resolve();assert.equal(h.media.paused,false);assert.equal(h.nodes.get('#reviveStatus').textContent,'正在加载大笑……');
  h.pending.at(-1).resolve();await Promise.resolve();assert.equal(h.nodes.get('#reviveStatus').textContent,'奶龙正在大笑……');
 }finally{h.restore()}
});
test('synchronous revive playback failure offers retry; mute switch does not resume a manually paused or completed ad',()=>{
 const h=reviveHarness();try{
  h.player.pause();const plays=h.media.plays;h.nodes.get('#reviveMute').onclick();assert.equal(h.media.plays,plays);assert.equal(h.media.paused,true);assert.equal(h.media.muted,true);
  h.media.play=()=>{throw new Error('blocked')};assert.doesNotThrow(()=>h.nodes.get('#reviveAction').onclick());assert.equal(h.nodes.get('#reviveAction').disabled,false);assert.match(h.nodes.get('#reviveStatus').textContent,/重试/);
  h.g.reviveWatch.elapsed=10;h.nodes.get('#reviveMute').onclick();assert.equal(h.media.plays,plays);assert.equal(h.g.reviveWatch.elapsed,10);
 }finally{h.restore()}
});
