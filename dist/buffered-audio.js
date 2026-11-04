// Gameplay recordings use the gesture-unlocked Web Audio context. Unlike a
// muted HTMLAudio preload, this does not rely on per-element autoplay grants.
export class BufferedAudio extends EventTarget {
 constructor(url,{getContext,fetchAudio=url=>fetch(url)}={}){
  super();this.url=url;this.getContext=getContext;this.fetchAudio=fetchAudio;
  this.paused=true;this.ended=false;this._muted=true;this._volume=1;this.offset=0;this.serial=0;
 }
 set preload(value){if(value==='auto')this.load().catch(()=>{})}
 get muted(){return this._muted}
 set muted(value){this._muted=!!value;this.syncGain()}
 get volume(){return this._volume}
 set volume(value){this._volume=value;this.syncGain()}
 get currentTime(){return this.source?this.offset+Math.max(0,this.getContext().currentTime-this.started):this.offset}
 set currentTime(value){this.offset=value}
 syncGain(){if(this.gain)this.gain.gain.value=this.muted?0:this.volume}
 load(){
  if(!this.loading)this.loading=Promise.resolve().then(()=>this.fetchAudio(this.url)).then(r=>{
   if(!r.ok)throw new Error('Recorded audio download failed');return r.arrayBuffer();
  }).then(data=>this.getContext().decodeAudioData(data)).then(buffer=>this.buffer=buffer).catch(error=>{this.loading=null;throw error});
  return this.loading;
 }
 unlock(){
  // Only called by the UI's gesture handlers. No recording is played here.
  try{const c=this.getContext();if(c.state!=='running'){this.unlocking=Promise.resolve(c.resume());this.unlocking.catch(()=>{})}this.load().catch(()=>{})}catch{}
 }
 async play(){
  const ticket=++this.serial,c=this.getContext();this.paused=false;this.ended=false;
  if(c.state!=='running'&&this.unlocking)await this.unlocking;
  if(c.state!=='running'){this.paused=true;throw new Error('Audio context needs a user gesture')}
  const buffer=await this.load();
  if(ticket!==this.serial||this.paused)throw new Error('Audio playback cancelled');
  if(c.state!=='running'){this.paused=true;throw new Error('Audio context interrupted')}
  this.disconnect();
  const source=c.createBufferSource(),gain=c.createGain();this.source=source;this.gain=gain;
  source.buffer=buffer;this.syncGain();source.connect(gain);gain.connect(c.destination);this.started=c.currentTime;
  source.onended=()=>{if(this.source!==source)return;this.disconnect();this.paused=true;this.ended=true;this.offset=0;this.dispatchEvent(new Event('ended'))};
  source.start(0,this.offset);this.dispatchEvent(new Event('playing'));
 }
 disconnect(){const source=this.source,gain=this.gain;this.source=null;this.gain=null;if(gain){gain.gain.value=0;gain.disconnect()}if(source){source.onended=null;try{source.stop()}catch{}source.disconnect()}}
 pause(){this.serial++;this.offset=this.currentTime;this.paused=true;this.disconnect()}
}
