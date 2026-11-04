import {unlockSilent} from './audio-unlock.js';
export const ITEM_VOICES={
 man:{file:'item-man-v1.mp3',label:'Man！',cooldown:8000,maxMs:1400},
 mamba:{file:'item-mamba-v1.mp3',label:'Mamba out',cooldown:10000,maxMs:3000},
 quiet:{file:'item-quiet-v1.mp3',label:'你吼那么大声干什么',cooldown:14000,maxMs:2600,priority:60},
 phoebe:{file:'item-phoebe-v1.mp3',label:'菲比啾比',cooldown:16000,maxMs:4000,priority:80},
 phoebesoot:{file:'item-phoebesoot-v1.mp3',label:'我再也不拉电线了',cooldown:14000,maxMs:3200,priority:90},
 oyeye:{file:'item-oyeye-v1.mp3',label:'欧耶',cooldown:10000,maxMs:2000,priority:20},
 shrimpfeet:{file:'item-shrimpfeet-v1.mp3',label:'最神的脚脚',cooldown:14000,maxMs:4000,priority:50},
 gugu:{file:'item-gugu-v1.mp3',label:'咕咕嘎嘎',cooldown:12000,maxMs:4400,priority:10}
};
export const ITEM_VOICE_OWNERS={man:['man'],mamba:['mambaout'],quiet:['quietbadge','sun'],phoebe:['phoebe','phoebewire'],phoebesoot:['phoebesoot'],oyeye:['oyeye','tempura'],shrimpfeet:['shrimpfeet'],gugu:['gugucharm']};
export function ownsItemVoice(g,key){return (ITEM_VOICE_OWNERS[key]||[]).some(id=>g.has(id))}
// No queue: stale combat lines must never play after a pause or a room change.
export class ItemAudio{
 constructor({createAudio=url=>new Audio(url),now=()=>performance.now(),isBusy=()=>false,canPlay=()=>true}={}){this.now=now;this.isBusy=isBusy;this.canPlay=canPlay;this.enabled=true;this.current=null;this.last={};this.lastAny=-Infinity;this.generation=0;this.clips={};for(const [key,v] of Object.entries(ITEM_VOICES)){const a=createAudio(new URL('./assets/'+v.file,import.meta.url).href);a.preload='auto';a.volume=.38;this.clips[key]=a}}
 setEnabled(enabled){this.enabled=!!enabled;if(!this.enabled)this.stop()}
 stop(){this.generation++;this.current=null;for(const a of Object.values(this.clips)){a.pause();a.currentTime=0}}
 reset(){this.stop();this.last={};this.lastAny=-Infinity}
 // Pick one current-frame cue; nothing is retained for a later frame.
 requestMany(keys){for(const key of [...new Set(keys)].filter(k=>ITEM_VOICES[k]).sort((a,b)=>(ITEM_VOICES[b].priority??30)-(ITEM_VOICES[a].priority??30)))if(this.request(key))return key;return null}
 unlock(){if(!this.enabled)return;for(const a of Object.values(this.clips)){if(a.unlock)a.unlock();else unlockSilent(a,()=>this.current?.audio===a)}}
 request(key){const def=ITEM_VOICES[key],time=this.now();this.update(true);if(!this.enabled||!def||!this.canPlay(key)||this.isBusy()||this.current||time-this.lastAny<4500||time-(this.last[key]??-Infinity)<def.cooldown)return false;
  const a=this.clips[key],generation=++this.generation,oldAny=this.lastAny,oldLast=this.last[key];this.lastAny=time;this.last[key]=time;this.current={key,audio:a,requested:time,started:null};a.currentTime=0;a.muted=false;
  const failed=()=>{if(generation!==this.generation)return;a.pause();a.currentTime=0;this.current=null;this.lastAny=oldAny;if(oldLast===undefined)delete this.last[key];else this.last[key]=oldLast};
  const started=()=>{if(generation===this.generation&&this.current)this.current.started=this.lastAny=this.last[key]=this.now()};
  this.current.failed=failed;
  try{const result=a.play();if(result?.then)result.then(started,failed);else started()}catch{failed();return false}return true;
 }
 update(playing){if(!playing||!this.enabled||this.isBusy()){if(this.current)this.stop();return}const c=this.current;if(c&&!this.canPlay(c.key)){this.stop();return}if(c?.started===null&&this.now()-c.requested>=8000){c.failed();this.generation++;return}if(c&&(c.audio.ended||(c.started!==null&&this.now()-c.started>=ITEM_VOICES[c.key].maxMs))){c.audio.pause();c.audio.currentTime=0;this.current=null;this.generation++}}
}
