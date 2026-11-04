import {unlockSilent} from './audio-unlock.js';
export const BOSS_VOICES={
 bull:{file:'bull-call.mp3',label:'牛来 · 妈——妈——',duration:3.5},
 bullRage:{file:'bull-rage.mp3',label:'牛来 · 暴走喊声',duration:3.1},
 meishu:{file:'meishu-taunt.mp3?v=single',label:'美鼠 · 你的胆子真是肥嘟嘟的',duration:2.095}
};
export function bossVoiceKey(kind,skill){return kind==='bull'?(skill==='stomp'||skill==='rage'?'bullRage':skill==='charge'?'bull':null):kind==='meishu'&&['traps','curtain','rage'].includes(skill)?'meishu':null}
// A single speech channel, bounded waiting and per-clip cooldown keep combat cues audible.
export class BossAudio{
 constructor({createAudio=url=>new Audio(url),now=()=>performance.now()}={}){this.enabled=true;this.now=now;this.clips={};this.last={};this.current=null;this.pending=null;this.generation=0;for(const [key,v] of Object.entries(BOSS_VOICES)){const a=createAudio(new URL('./assets/'+v.file,import.meta.url).href);a.preload='auto';a.volume=.52;this.clips[key]=a}}
 setEnabled(value){this.enabled=!!value;if(!this.enabled)this.stop()}
 stop(){this.generation++;this.pending=null;this.current=null;for(const a of Object.values(this.clips)){a.pause();a.currentTime=0}}
 reset(){this.stop();this.last={}}
 unlock(){if(!this.enabled)return;for(const a of Object.values(this.clips)){if(a.unlock)a.unlock();else unlockSilent(a,()=>this.current?.audio===a)}}
 request(kind,skill,owner){const key=bossVoiceKey(kind,skill),now=this.now();if(!this.enabled||!key||owner?.dead||now-(this.last[key]??-Infinity)<11000)return false;const cue={key,kind,owner,expires:now+4500};if(this.current){if(this.pending?.kind===kind)return false;this.pending=cue;return false}return this.play(cue)}
 play(cue){if(!this.enabled||cue.owner?.dead)return false;const a=this.clips[cue.key],generation=++this.generation;this.current={...cue,audio:a,requested:this.now(),started:null};this.last[cue.key]=this.now();a.currentTime=0;a.muted=false;const failed=()=>{if(generation!==this.generation)return;a.pause();a.currentTime=0;this.current=null;delete this.last[cue.key]};const started=()=>{if(generation===this.generation&&this.current)this.current.started=this.last[cue.key]=this.now()};this.current.failed=failed;try{const p=a.play();if(p?.then)p.then(started,failed);else started()}catch{failed();return false}return true}
 update(playing){if(!playing){if(this.current||this.pending)this.stop();return}const now=this.now();if(this.current){const c=this.current;if(c.started===null&&now-c.requested>=8000){c.failed();this.generation++}else if(c.owner?.dead||c.audio.ended||(c.started!==null&&now-c.started>6000)){c.audio.pause();c.audio.currentTime=0;this.current=null;this.generation++}else return}const cue=this.pending;this.pending=null;if(cue&&cue.expires>=now&&!cue.owner?.dead&&now-(this.last[cue.key]??-Infinity)>=11000)this.play(cue)}
}

