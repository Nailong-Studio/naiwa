import {drawFamily,drawSprite} from './sprite-art.js';
import {pixelRing} from './pixel-art.js';
import {drawHero} from './hero-art.js';
import {selectedCostume} from './costumes.js';
export function drawRescue(c,r,{complete=false}={}){
 const t=r?.t||0,phase=complete?'complete':r?.phase||'caged',progress=(r?.presses||0)/(r?.goal||24),breaking=phase==='breaking',reunion=['reunion','complete'].includes(phase),run=phase==='complete'?1:Math.min(1,(r?.phaseTime||0)/1.5);
 c.clearRect(0,0,640,260);c.fillStyle='#e9d8aa';c.fillRect(0,0,640,260);
 for(let y=0;y<260;y+=26)for(let x=0;x<640;x+=32){c.fillStyle=(x/32+y/26)%2?'#f4e7bf':'#ecdcb2';c.fillRect(x+1,y+1,30,24)}
 c.fillStyle='#d1b787';c.fillRect(0,205,640,55);c.fillStyle='#a88766';c.fillRect(0,205,640,4);
 const heroX=reunion?180+run*150:180,childX=reunion?448-run*92:448;
 const heroRow=reunion||r?.pulse>0?2:0,heroCol=Math.floor(t*9)%4;
 if(selectedCostume()==='original'||!drawHero(c,{p:{face:1}},heroX,178,1.4,true,{frame:heroRow*4+heroCol}))drawSprite(c,'naiwa-pixel-v2.png',heroCol,heroRow,4,4,heroX,182,124,{flip:true});
 if(!reunion||run<1)drawFamily(c,'child',reunion?2:progress>.4?1:0,childX,184,82);
 drawFamily(c,'mother',reunion&&run>=1?2:reunion?1:0,reunion?380:92,185,reunion&&run>=1?115:100);
 if(!reunion){
  c.save();c.translate(448+(r?.pulse||0)*Math.sin(t*60)*3,0);
  const spread=breaking?Math.min(1,(r.phaseTime||0)/1.1):0;
  for(let i=-2;i<=2;i++){
   const x=i*25,y=73;
   c.save();c.translate(x+spread*i*55,y+spread*spread*180);c.rotate(spread*i*.45);c.fillStyle='#61556b';c.fillRect(-4,0,8,131);c.fillStyle='#b9acb0';c.fillRect(-2,0,2,129);
   if(progress>.3&&i%2===0){c.fillStyle='#f4e7bf';c.fillRect(-4,45,5,4);c.fillRect(-1,49,5,4)}if(progress>.65){c.fillStyle='#f4e7bf';c.fillRect(-4,81,6,4);c.fillRect(0,85,4,5)}c.restore();
  }
  if(!breaking){c.fillStyle='#61556b';c.fillRect(-66,68,132,10);c.fillRect(-66,197,132,10);c.fillStyle='#e9bb66';c.fillRect(-10,138,20,22);c.fillStyle='#61556b';c.fillRect(-3,143,6,11)}
  c.restore();
 }
 if(r?.pulse>0&&!reunion){const travel=1-r.pulse;pixelRing(c,224+travel*215,135,10+travel*42,'#fff7cf',4)}
 if(breaking||reunion){for(let i=0;i<26;i++){const x=(i*83+t*12)%640,y=(i*37+t*(15+i%3*7))%235;c.fillStyle=['#e8a66d','#f7c75c','#b4d0a2','#baaccd'][i%4];c.fillRect(Math.round(x/2)*2,Math.round(y/2)*2,4,6)}}
}
export function renderRescueUI(overlay,g,{onPress,onPause,onSound,sound}){
 overlay.innerHTML=`<div class="modal rescue-modal"><div class="mini">ONE LAST LAUGH</div><h2>奶豆就在牢笼里！</h2><canvas id="rescueScene" width="640" height="260" aria-label="奶蛙和豆包用大笑打破牢笼救出奶豆"></canvas><p id="rescueMessage" aria-live="polite">反复按键，或点击下方按钮，用大笑震碎牢笼。</p><progress id="rescueProgress" max="${g.rescue.goal}" value="${g.rescue.presses}" aria-label="破笼进度"></progress><div class="rescue-controls"><button class="primary" id="rescueLaugh">大笑！ <span id="rescueCount"></span></button><button class="secondary" id="rescueSound">声音 ${sound?'开':'关'}</button><button class="secondary" id="rescuePause">暂停</button></div><small>每次按下算一次，长按不连发 · P / Esc 暂停</small></div>`;
 overlay.querySelector('#rescueLaugh').onclick=onPress;
 overlay.querySelector('#rescuePause').onclick=onPause;
 overlay.querySelector('#rescueSound').onclick=onSound;
}
const scenes=new WeakMap();
export function updateRescueUI(overlay,g){
 const target=overlay.querySelector('#rescueScene');if(!target)return;
 let buffer=scenes.get(target);if(!buffer){buffer=document.createElement('canvas');buffer.width=320;buffer.height=130;scenes.set(target,buffer)}
 const c=buffer.getContext('2d');c.setTransform(.5,0,0,.5,0,0);drawRescue(c,g.rescue,{complete:g.mode==='win'});
 const dest=target.getContext('2d');dest.imageSmoothingEnabled=false;dest.clearRect(0,0,640,260);dest.drawImage(buffer,0,0,640,260);
 const r=g.rescue;if(!r)return;const progress=overlay.querySelector('#rescueProgress');if(progress)progress.value=r.presses;
 const count=overlay.querySelector('#rescueCount');if(count)count.textContent=`${r.presses} / ${r.goal}`;
 const button=overlay.querySelector('#rescueLaugh');if(button)button.disabled=r.phase!=='caged';
 const msg=overlay.querySelector('#rescueMessage'),text=r.phase==='caged'?'反复按键，或点击下方按钮，用大笑震碎牢笼。':r.phase==='breaking'?'再也没有牢笼能关住这一家人的笑声！':'奶豆，我们回家！';if(msg&&msg.textContent!==text)msg.textContent=text;
}
