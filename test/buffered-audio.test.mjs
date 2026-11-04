import test from 'node:test';
import assert from 'node:assert/strict';
import {BufferedAudio} from '../dist/buffered-audio.js';
import {SoundMixer} from '../dist/sound-mixer.js';
import {GameAudio} from '../dist/game-audio.js';
import {ItemAudio,ITEM_VOICES,ownsItemVoice} from '../dist/item-audio.js';
import {BossAudio} from '../dist/boss-audio.js';
import {playPlayerLaugh,setGameSound} from '../dist/combat-audio.js';

function setup(){
 const nodes=[],gains=[];let resumes=0,fetches=0,decodes=0,gesture=false;
 const c={state:'suspended',currentTime:0,destination:{},resume(){resumes++;if(!gesture)return Promise.reject(new Error('gesture required'));this.state='running';return Promise.resolve()},decodeAudioData(){decodes++;return Promise.resolve({duration:15.65})},createGain(){const g={gain:{value:1},connect(){},disconnect(){this.disconnected=true}};gains.push(g);return g},createBufferSource(){const n={connect(){},disconnect(){},start(){this.live=true},stop(){this.live=false}};nodes.push(n);return n}};
 const mixer=new SoundMixer({createContext:()=>c});
 const raw=new BufferedAudio('laugh.mp3',{getContext:()=>c,fetchAudio:async()=>{fetches++;return {ok:true,arrayBuffer:async()=>new ArrayBuffer(4)}}});
 const a=mixer.trackAudio(raw),errors=[],timers=[];
 const voice=new GameAudio({createAudio:()=>a,onError:e=>errors.push(e),schedule:(fn,ms)=>{const t={fn,ms};timers.push(t);return t},cancel:t=>{if(t)t.cancelled=true}});
 return {c,nodes,gains,mixer,raw,a,voice,errors,timers,gesture(fn){gesture=true;fn();gesture=false},get resumes(){return resumes},get fetches(){return fetches},get decodes(){return decodes}};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
test('gesture unlock is silent; later frame plays real decoded laugh without an HTMLAudio autoplay grant',async()=>{
 const h=setup();h.gesture(()=>h.voice.unlock());await settle();assert.equal(h.nodes.length,0);assert.equal(h.resumes,1);
 h.voice.laugh({now:0});await settle();assert.equal(h.errors.length,0);assert.equal(h.nodes.length,1);assert.equal(h.nodes[0].buffer.duration,15.65);assert.equal(h.nodes[0].live,true);assert.equal(h.gains[0].gain.value,.35);assert.equal(h.mixer.voice,h.a);
 assert.equal(h.timers.find(t=>t.ms===1100)?.cancelled,undefined);h.voice.stop();assert.equal(h.nodes[0].live,false);assert.equal(h.gains[0].gain.value,0);
});
test('mute during download cancels the pending laugh and cannot start it after decode finishes',async()=>{
 const h=setup();let finish;h.c.decodeAudioData=()=>new Promise(r=>finish=r);h.gesture(()=>h.voice.unlock());await settle();h.voice.laugh({now:0});h.voice.setEnabled(false);h.mixer.setEnabled(false);finish({duration:15});await settle();
 assert.equal(h.nodes.length,0);assert.equal(h.mixer.voice,null);assert.equal(h.errors.length,0);assert.equal(h.voice.playing,false);
});
test('toggle back on and interrupted-context recovery neither replay stale audio nor re-download it',async()=>{
 const h=setup();h.gesture(()=>h.voice.unlock());await settle();h.voice.laugh({now:0});await settle();h.voice.setEnabled(false);h.voice.setEnabled(true);h.c.state='interrupted';h.gesture(()=>h.voice.unlock());await settle();assert.equal(h.nodes.filter(n=>n.live).length,0);
 h.voice.laugh({now:1000});await settle();assert.equal(h.errors.length,0);assert.equal(h.nodes.filter(n=>n.live).length,1);assert.equal(h.fetches,1);assert.equal(h.decodes,1);assert.equal(h.resumes,2);
});
test('buffered laugh shares exclusivity with revival media and pending game tones',async()=>{
 const h=setup();h.gesture(()=>h.voice.unlock());await settle();h.voice.laugh({now:0});await settle();assert.equal(h.mixer.cue(),false);
 const media=h.mixer.trackAudio({muted:true,paused:true,play(){this.paused=false;return Promise.resolve()},pause(){this.paused=true},addEventListener(){}});media.play();assert.equal(h.nodes.filter(n=>n.live).length,0);assert.equal(h.mixer.voice,media);assert.equal(h.gains[0].gain.value,0);media.pause();assert.equal(h.mixer.voice,null);
});
test('late ended callbacks from a replaced source cannot release the new laugh',async()=>{
 const h=setup();h.gesture(()=>h.voice.unlock());await settle();h.voice.laugh({now:0});await settle();const ended=h.nodes[0].onended;h.voice.laugh({now:1000});await settle();ended();assert.equal(h.nodes[1].live,true);assert.equal(h.voice.playing,true);assert.equal(h.mixer.voice,h.a);h.voice.stop();
});
test('failed download can retry and audio is not queued without a gesture unlock',async()=>{
 const h=setup();await settle();h.voice.laugh({now:0});await settle();assert.equal(h.errors.length,1);assert.equal(h.nodes.length,0);h.gesture(()=>h.voice.unlock());await settle();assert.equal(h.nodes.length,0);h.voice.laugh({now:1000});await settle();assert.equal(h.nodes.length,1);
 const b=new BufferedAudio('bad',{getContext:()=>h.c,fetchAudio:async()=>({ok:false})});await assert.rejects(b.load(),/download/);b.fetchAudio=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(4)});await b.load();h.voice.stop();
});

function recordedChannels(){
 const h=setup();let time=0,owned=true;
 const createAudio=url=>h.mixer.trackAudio(new BufferedAudio(url,{getContext:()=>h.c,fetchAudio:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(4)})}));
 const bossVoice=new BossAudio({createAudio,now:()=>time}),itemVoice=new ItemAudio({createAudio,now:()=>time,isBusy:()=>h.voice.playing||!!bossVoice.current,canPlay:key=>ownsItemVoice({has:()=>owned},key)});
 return {...h,bossVoice,itemVoice,soundMix:h.mixer,setTime:t=>time=t,setOwned:v=>owned=v};
}
test('all item and boss recordings use a silently unlocked shared context and play later without native autoplay grants',async()=>{
 const h=recordedChannels();h.gesture(()=>{h.voice.unlock();h.bossVoice.unlock();h.itemVoice.unlock()});await settle();assert.equal(h.nodes.length,0);
 let t=0;for(const key of Object.keys(ITEM_VOICES)){h.setTime(t+=20000);assert.ok(h.itemVoice.request(key));await settle();assert.equal(h.itemVoice.current.key,key);assert.equal(h.nodes.filter(n=>n.live).length,1);assert.equal(h.gains.at(-1).gain.value,.38);h.itemVoice.stop()}
 for(const [kind,skill,key] of [['bull','charge','bull'],['bull','rage','bullRage'],['meishu','traps','meishu']]){h.setTime(t+=20000);assert.ok(h.bossVoice.request(kind,skill,{}));await settle();assert.equal(h.bossVoice.current.key,key);assert.equal(h.nodes.filter(n=>n.live).length,1);assert.equal(h.gains.at(-1).gain.value,.52);h.bossVoice.stop()}
});
test('shared-context item ownership, mute, laugh priority and later recovery remain exclusive',async()=>{
 const h=recordedChannels();h.gesture(()=>setGameSound(true,h));await settle();h.setOwned(false);assert.equal(h.itemVoice.request('gugu'),false);assert.equal(h.nodes.length,0);h.setOwned(true);h.itemVoice.request('gugu');await settle();playPlayerLaugh(h,{now:0});await settle();assert.equal(h.itemVoice.current,null);assert.equal(h.nodes.filter(n=>n.live).length,1);assert.equal(h.mixer.voice,h.voice.voice);
 setGameSound(false,h);assert.equal(h.nodes.filter(n=>n.live).length,0);h.gesture(()=>setGameSound(true,h));await settle();assert.equal(h.nodes.filter(n=>n.live).length,0);h.setTime(20000);h.itemVoice.request('phoebe');await settle();assert.equal(h.nodes.filter(n=>n.live).length,1);h.itemVoice.stop();
});
test('muting delayed item and boss decodes cannot start stale recordings when downloads finish',async()=>{
 for(const type of ['itemVoice','bossVoice']){const h=recordedChannels(),resolve=[];h.c.decodeAudioData=()=>new Promise(r=>resolve.push(r));h.gesture(()=>setGameSound(true,h));await settle();if(type==='itemVoice')h.itemVoice.request('man');else h.bossVoice.request('bull','charge',{});setGameSound(false,h);resolve.forEach(r=>r({duration:4}));await settle();assert.equal(h.nodes.length,0);assert.equal(h[type].current,null);assert.equal(h.mixer.voice,null)}
});
