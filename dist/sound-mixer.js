import {SILENT_PRIME} from './audio-unlock.js';
import {BufferedAudio} from './buffered-audio.js';
// One recorded voice OR one short game cue. Never queue sounds from old events.
export class SoundMixer {
 constructor({createAudio=url=>new Audio(url),createContext=()=>new (window.AudioContext||window.webkitAudioContext)()}={}) {
  this.makeAudio=createAudio;this.makeContext=createContext;this.voice=null;this.tone=null;this.context=null;this.enabled=true;this.batching=false;this.pending=null;
 }
 getContext(){return this.context??=this.makeContext()}
 createBufferedAudio(url){return this.trackAudio(new BufferedAudio(url,{getContext:()=>this.getContext()}))}
 createAudio(url) {return this.trackAudio(this.makeAudio(url))}
 trackAudio(a) {
  const play=a.play.bind(a),pause=a.pause.bind(a);let ticket=0;a.muted=true;
  const release=()=>{if(this.voice===a)this.voice=null};
  a.pause=()=>{ticket++;a.muted=true;pause();release()};
  a.play=()=>{
   const attempt=++ticket;
   // Silent revival is real playback with a progress clock. Its muted flag
   // must NOT be confused with a throwaway mobile gesture-priming play.
   if(!a[SILENT_PRIME]){if(this.voice&&this.voice!==a)this.voice.pause();this.stopTone();this.voice=a}
   const failed=()=>{if(ticket===attempt)release()};
   try{const result=play();result?.then?.(()=>{},failed);return result}catch(error){failed();throw error}
  };
  a.addEventListener?.('ended',release);
  // Defend against delayed media starts after another clip has taken focus.
  a.addEventListener?.('playing',()=>{if(this.voice!==a)a.pause()});
  return a;
 }
 setEnabled(value){this.enabled=!!value;if(!value){if(this.voice)this.voice.muted=true;this.stopTone()}}
 beginFrame(){this.batching=true;this.pending=null}
 endFrame(){const cue=this.pending;this.batching=false;this.pending=null;if(cue)this.playTone(cue)}
 cue(freq=500,dur=.07,type='sine',volume=.025,priority=1){
  if(!this.enabled||this.voice)return false;
  const cue={freq,dur,type,volume:Math.min(volume,.025),priority};
  if(this.batching){if(!this.pending||priority>this.pending.priority)this.pending=cue;return true}
  return this.playTone(cue);
 }
 stopTone(){
  this.pending=null;const t=this.tone;this.tone=null;
  if(t){try{t.osc.stop()}catch{}t.osc.disconnect();t.gain.disconnect()}
 }
 playTone(cue){
  if(!this.enabled||this.voice)return false;
  if(this.tone){if(cue.priority<=this.tone.priority)return false;this.stopTone()}
  try{
   const c=this.context??=this.makeContext();
   // A suspended context may resume much later. Drop that cue instead of
   // scheduling a pile of oscillators to sound together on the next gesture.
   if(c.state==='suspended'){c.resume()?.catch?.(()=>{});return false}
   if(c.state==='closed')return false;
   const osc=c.createOscillator(),gain=c.createGain(),t={osc,gain,priority:cue.priority};this.tone=t;
   osc.type=cue.type;osc.frequency.setValueAtTime(cue.freq,c.currentTime);osc.frequency.exponentialRampToValueAtTime(cue.freq*.6,c.currentTime+cue.dur);
   gain.gain.setValueAtTime(cue.volume,c.currentTime);gain.gain.exponentialRampToValueAtTime(.001,c.currentTime+cue.dur);
   osc.connect(gain).connect(c.destination);osc.onended=()=>{osc.disconnect();gain.disconnect();if(this.tone===t)this.tone=null};
   osc.start();osc.stop(c.currentTime+cue.dur);return true;
  }catch{this.stopTone();return false}
 }
}
