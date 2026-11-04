const NativeAudio=window.Audio,NativeContext=window.AudioContext,media=[],errors=[];let tones=0,switches=0;
window.addEventListener('error',e=>errors.push(e.message));window.addEventListener('unhandledrejection',e=>errors.push(String(e.reason)));
window.Audio=class extends NativeAudio{
 constructor(url){super(url);const m={a:this,file:new URL(url).pathname.split('/').at(-1),maxTime:0,audible:0,plays:0};media.push(m);this.audit=m;this.addEventListener('playing',()=>{if(!this.muted)m.audible++});this.addEventListener('timeupdate',()=>{m.maxTime=Math.max(m.maxTime,this.currentTime)})}
 play(){this.audit.plays++;return super.play()}
};
window.AudioContext=class extends NativeContext{createOscillator(){const o=super.createOscillator(),start=o.start.bind(o);o.start=(...args)=>{tones++;return start(...args)};return o}};
const mod=await import('./game.js'),$=s=>document.querySelector(s);let initialTones=0;
const enabled=()=>$('#sound').textContent.includes('开');
$('#qaStart').onclick=()=>{if(!enabled())$('#sound').click();mod.start();mod.processEvents();mod.game.hurt=()=>{};initialTones=tones};
$('#qaSilent').onclick=()=>{if(enabled())$('#sound').click();mod.start();mod.processEvents();mod.game.hurt=()=>{};initialTones=tones};
$('#qaSwitch').onclick=()=>{switches++;$('#sound').click()};
$('#qaDead').onclick=()=>{mod.game.p.hp=0;mod.game.mode='dead';mod.game.emit('end',{win:false});mod.processEvents()};
$('#qaGugu').onclick=()=>{mod.game.items=['gugucharm'];mod.game.emit('itemVoice',{key:'gugu'});mod.processEvents()};
setInterval(()=>{$('#qaAudio').textContent=JSON.stringify({mode:mod.game.mode,sound:enabled(),items:mod.game.items,switches,tonesSinceStart:tones-initialTones,reviveElapsed:+(mod.game.reviveWatch?.elapsed||0).toFixed(2),active:media.filter(m=>!m.a.paused).map(m=>({file:m.file,muted:m.a.muted,time:+m.a.currentTime.toFixed(2)})),audible:media.filter(m=>m.audible).map(m=>({file:m.file,count:m.audible,maxTime:+m.maxTime.toFixed(2)})),idleUnmuted:media.filter(m=>m.a.paused&&!m.a.muted).map(m=>m.file),errors},null,1)},100);
