import {unlockSilent} from './audio-unlock.js';
// This is a locally hosted laugh recording, not synthesized "ha" beeps.
export class GameAudio{
 constructor({createAudio=url=>new Audio(url),schedule=(fn,ms)=>setTimeout(fn,ms),cancel=id=>clearTimeout(id),onError=()=>{}}={}){
  this.schedule=schedule;this.cancel=cancel;this.onError=onError;
  this.enabled=true;this.lastShort=-Infinity;this.longPlaying=false;this.playing=false;this.generation=0;
  this.voice=createAudio(new URL('./assets/nailong-laugh.mp3',import.meta.url).href);
  this.voice.preload='auto';this.voice.addEventListener?.('ended',()=>{this.longPlaying=false;this.playing=false});this.voice.volume=.48;
 }
 setEnabled(value){this.enabled=!!value;if(!value)this.stop()}
 stop(){this.generation++;this.cancel(this.timer);this.cancel(this.loadTimer);this.timer=null;this.loadTimer=null;this.voice.pause();this.voice.currentTime=0;this.longPlaying=false;this.playing=false}
 // Called from user gestures so iOS/Android can unlock media playback.
 unlock(){if(!this.enabled)return;if(this.voice.unlock)this.voice.unlock();else unlockSilent(this.voice,()=>this.playing)}
 laugh({long=false,now=performance.now()}={}){
  if(!this.enabled)return false;
  if(!long&&(this.longPlaying&&!this.voice.ended||now-this.lastShort<650))return false;
  const generation=++this.generation;this.cancel(this.timer);this.cancel(this.loadTimer);this.timer=null;this.loadTimer=null;this.lastShort=now;this.longPlaying=long;this.playing=true;this.voice.muted=false;this.voice.volume=long?.55:.35;
  if(long||this.voice.paused||this.voice.ended)this.voice.currentTime=0;
  const started=()=>{if(generation!==this.generation||!this.playing)return;this.cancel(this.loadTimer);this.loadTimer=null;if(long)return;this.timer=this.schedule(()=>{if(generation===this.generation&&!this.longPlaying)this.stop()},1100);this.timer?.unref?.()};
  const failed=error=>{if(generation!==this.generation)return;this.stop();this.lastShort=-Infinity;this.onError(error)};
  this.loadTimer=this.schedule(()=>failed(new Error('Laugh playback timed out')),8000);this.loadTimer?.unref?.();
  try{const result=this.voice.play();if(result?.then)result.then(started,failed);else started()}catch(error){failed(error);return false}return true;
 }
}
