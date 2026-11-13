import {beginRevive,advanceRevive,cancelRevive,finishRevive,REVIVE_SECONDS,WatchClock} from './revive.js';
import {spriteImage,drawSprite} from './sprite-art.js';
export function createRevivePlayer({getGame,overlay,getSound,onSound,onCancel,onRevive,createAudio=url=>new Audio(url)}){
 let g=null,media=null,token=0,message='',clock=new WatchClock();
 const active=()=>g&&getGame()===g&&g.mode==='revive';
 function controls(){
  if(!active())return;const elapsed=g.reviveWatch.elapsed,ready=elapsed>=REVIVE_SECONDS,button=overlay.querySelector('#reviveAction');if(!button)return;
  const paused=media.paused;button.disabled=!ready&&!paused;
  button.textContent=ready?'半血复活 →':paused?'继续观看':`观看中 · ${Math.ceil(REVIVE_SECONDS-elapsed)} 秒`;
  overlay.querySelector('#reviveProgress').value=elapsed;
  overlay.querySelector('#reviveStatus').textContent=ready?'大笑能量充满了！':message||(paused?'观看已暂停，点击继续。':'奶龙正在大笑……');
  overlay.querySelector('#reviveCountdown').textContent=ready?`恢复 ${Math.ceil(g.p.maxHp/2)} / ${g.p.maxHp} 生命`:`还需观看 ${Math.ceil(REVIVE_SECONDS-elapsed)} 秒`;
  const mute=overlay.querySelector('#reviveMute');mute.textContent='声音 '+(getSound()?'开':'关');if(mute.dataset)mute.dataset.on=String(getSound());
  if(button.dataset)button.dataset.ready=String(ready);
 }
 function stop(){token++;if(media){media.pause();media.currentTime=0;media.onplaying=media.onwaiting=media.onerror=media.onseeking=null}media=null;g=null;clock.reset()}
 function pause(){if(!active()||g.reviveWatch.elapsed>=REVIVE_SECONDS)return;token++;media.pause();clock.reset();message='观看已暂停，点击继续。';controls()}
 function play(){
  if(!active()||document.hidden||g.reviveWatch.elapsed>=REVIVE_SECONDS)return;
  const generation=++token;clock.reset();message='正在加载大笑……';media.muted=!getSound();
  const failed=()=>{if(generation!==token||!active())return;media.pause();clock.reset();message='播放未开始，请点击继续重试。';controls()};
  const started=()=>{if(generation===token&&active()&&!media.paused){message='';controls()}};
  try{if(media.error)media.load();const result=media.play();if(result?.then)result.then(started,failed);else started()}catch{failed()}controls();
 }
 function open(){
  stop();const current=getGame();if(!beginRevive(current))return false;g=current;
  overlay.innerHTML=`<section class="modal revive-modal" role="dialog" aria-modal="true" aria-labelledby="reviveHeading"><h2 id="reviveHeading">奶龙大笑 · 复活广告</h2><div class="revive-body"><canvas id="reviveScene" width="480" height="240" aria-label="奶龙大笑动画"></canvas><div class="revive-info"><p id="reviveStatus" role="status">正在加载大笑……</p><progress id="reviveProgress" max="10" value="0" aria-label="广告观看进度"></progress><strong id="reviveCountdown">还需观看 10 秒</strong><p class="revive-note">每局一次 · 复活恢复半血<br>切到后台暂停计时</p><button id="reviveAction" class="primary" disabled>观看中 · 10 秒</button><div class="revive-options"><button id="reviveMute" class="secondary">声音 开</button><button id="reviveCancel" class="secondary">放弃观看</button></div></div></div></section>`;
  media=createAudio(new URL('./assets/nailong-laugh.mp3',import.meta.url).href);media.loop=true;media.preload='auto';media.volume=.55;
  media.onplaying=()=>{message='';clock.reset();controls()};media.onwaiting=()=>{message='大笑加载中，计时暂停……';controls()};media.onerror=()=>{media.pause();message='大笑加载失败，请点击继续重试。';clock.reset();controls()};media.onseeking=()=>clock.reset();
  overlay.querySelector('#reviveAction').onclick=()=>{if(g.reviveWatch.elapsed<REVIVE_SECONDS){play();return}const current=g;if(finishRevive(current)){stop();onRevive()}};
  overlay.querySelector('#reviveCancel').onclick=()=>{const current=g;cancelRevive(current);stop();onCancel()};
  overlay.querySelector('#reviveMute').onclick=()=>{const wasPlaying=!media.paused;onSound();media.muted=!getSound()||!wasPlaying;if(wasPlaying)play();controls()};
  spriteImage('naiwa-pixel-v2.png');play();return true;
 }
 function update(){
  if(!active())return;media.muted=!getSound()||media.paused;const canvas=overlay.querySelector('#reviveScene');if(!canvas){pause();return}
  const image=spriteImage('naiwa-pixel-v2.png'),loaded=!!(image?.complete&&image.naturalWidth),elapsed=g.reviveWatch.elapsed;
  const delta=clock.sample({time:media.currentTime,duration:media.duration,playing:!media.paused&&media.readyState>=2,visible:!document.hidden&&loaded,seeking:media.seeking});
  if(elapsed<REVIVE_SECONDS&&advanceRevive(g,delta)){media.pause();message='';clock.reset()}
  const t=g.reviveWatch.elapsed,c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#f5e5b5';c.fillRect(0,0,480,240);
  for(let y=0;y<240;y+=24)for(let x=0;x<480;x+=24)if((x+y)%48===0){c.fillStyle='#eddaa5';c.fillRect(x,y,24,24)}
  c.fillStyle='#809369';c.fillRect(0,206,480,34);drawSprite(c,'naiwa-pixel-v2.png',Math.floor(t*10)%4,2,4,4,240,174,170,{flip:true});
  c.fillStyle='#80623e';c.font='bold 26px system-ui';c.textAlign='center';for(let i=0;i<4;i++){const side=i%2?-1:1;c.fillText('哈',240+side*(90+(i>1?45:0)),90+Math.sin(t*7+i)*12+(i>1?65:0))}
  controls();
 }
 window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
 return {open,stop,pause,update};
}
