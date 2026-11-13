import {COSTUMES,costumeById,selectedCostume,setCostume,loadCostume} from './costumes.js';
import {drawHero} from './hero-art.js';
import {viewportMedia} from './rotate-view.js';
export function createWardrobe({onOpen,onClose}){
 const layer=document.createElement('div');layer.className='wardrobe-layer';layer.hidden=true;
 layer.innerHTML=`<section class="wardrobe" role="dialog" aria-modal="true" aria-labelledby="wardrobeTitle">
 <header class="wardrobe-heading"><div><span>NAIWA'S WARDROBE</span><h2 id="wardrobeTitle">奶蛙的衣橱</h2></div><button class="wardrobe-close" aria-label="关闭衣橱">返回 ×</button></header>
 <div class="wardrobe-body"><div class="wardrobe-stage"><div class="wardrobe-preview" data-state="equipped"><span class="wardrobe-badge"></span><canvas width="240" height="240" aria-label="时装动作预览"></canvas><strong class="wardrobe-name"></strong><p class="wardrobe-detail"></p><div class="wardrobe-poses" aria-label="预览动作">${['站立','走路','大笑','蛙跳','受伤'].map((n,i)=>`<button data-pose="${i}" aria-pressed="${i===0}">${n}</button>`).join('')}</div></div>
 <div class="wardrobe-footer"><div><span class="wardrobe-status" role="status"></span><small>仅改变外观 · 全部可穿戴 · 自动记住选择</small></div><button class="wardrobe-equip">穿上这套</button></div></div>
 <div class="wardrobe-selection"><div class="wardrobe-scroll-hint"><strong>全部 ${COSTUMES.length} 套</strong><span>点卡片预览 · 上下滑动 ↓</span></div><div class="wardrobe-catalog" aria-label="选择时装">${COSTUMES.map(c=>`<button class="costume-card" data-costume="${c.id}" aria-pressed="false" style="--costume-accent:${c.accent}"><canvas width="110" height="110" aria-hidden="true"></canvas><strong>${c.name}</strong><span class="costume-tag"></span></button>`).join('')}</div></div></div></section>`;
 document.body.append(layer);
 const q=s=>layer.querySelector(s),cards=[...layer.querySelectorAll('[data-costume]')],preview=q('.wardrobe-preview canvas'),ctx=preview.getContext('2d'),fake={p:{face:-1}};
 let open=false,choice=selectedCostume(),pose=0,tick=0,raf=0,last=0,token=0,previousFocus,available=false;
 function labels(){const worn=selectedCostume();for(const b of cards){b.setAttribute('aria-pressed',String(b.dataset.costume===choice));b.dataset.equipped=String(b.dataset.costume===worn);b.querySelector('.costume-tag').textContent=b.dataset.costume===worn?'已穿戴':b.dataset.costume===choice?'预览中':'试穿'}q('.wardrobe-preview').dataset.state=choice===worn?'equipped':'preview';q('.wardrobe-badge').textContent=choice===worn?'当前穿戴':'预览中 · 尚未穿上';q('.wardrobe-equip').disabled=!available||choice===selectedCostume();q('.wardrobe-equip').textContent=choice===selectedCostume()?'已穿戴':'穿上这套'}
 function paint(canvas,id,frame,size,x,y){const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);c.imageSmoothingEnabled=false;drawHero(c,fake,x,y,size,true,{frame,costumeId:id,face:-1})}
 async function select(id){choice=costumeById(id).id;available=false;const own=++token,c=costumeById(choice);q('.wardrobe-name').textContent=c.name;q('.wardrobe-detail').textContent=c.detail;q('.wardrobe-status').textContent='正在准备动作图…';labels();try{await loadCostume(choice);if(!open||own!==token)return;available=true;q('.wardrobe-status').textContent=choice===selectedCostume()?'正在穿戴这套时装':'先试穿，满意后点击穿戴';labels()}catch{if(open&&own===token)q('.wardrobe-status').textContent='动作图未加载成功，请重新选择重试。'}}
 function frame(now){if(!open)return;tick+=Math.max(0,Math.min(.05,(now-last)/1000||0));last=now;
  const sequences=[[0,1,2,3],[4,5,6,7],[8,9,10,11],[12,13,13,14,0],[15,15,0,0]],seq=sequences[pose],index=seq[Math.floor(tick*(pose===0?3:8))%seq.length];
  ctx.clearRect(0,0,240,240);if(available)paint(preview,choice,index,2.35,120,176);raf=requestAnimationFrame(frame);
 }
 const painted=new Set();
 async function thumbnail(b){if(painted.has(b))return;try{await loadCostume(b.dataset.costume);paint(b.querySelector('canvas'),b.dataset.costume,0,1.1,55,80);painted.add(b);observer?.unobserve(b)}catch{b.querySelector('.costume-tag').textContent='加载失败 · 点击重试'}}
 const observer=typeof IntersectionObserver==='undefined'?null:new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting)thumbnail(e.target)},{root:q('.wardrobe-catalog'),rootMargin:'100px'});
 function observeCards(){for(const b of cards)if(!b.hidden&&!painted.has(b)){if(observer)observer.observe(b);else thumbnail(b)}}
 function close(){if(!open)return;open=false;token++;observer?.disconnect();cancelAnimationFrame(raf);layer.hidden=true;onClose();previousFocus?.focus({preventScroll:true})}
 cards.forEach(b=>b.onclick=()=>select(b.dataset.costume));
 layer.querySelectorAll('[data-pose]').forEach(b=>b.onclick=()=>{pose=Number(b.dataset.pose);tick=0;layer.querySelectorAll('[data-pose]').forEach(p=>p.setAttribute('aria-pressed',String(p===b)))});
 q('.wardrobe-close').onclick=close;layer.addEventListener('click',e=>{if(e.target===layer)close()});
 q('.wardrobe-equip').onclick=()=>{if(!available)return;setCostume(choice);labels();q('.wardrobe-status').textContent='已穿上：'+costumeById(choice).name};
 window.addEventListener('keydown',e=>{if(!open)return;e.stopImmediatePropagation();if(['escape','p'].includes(e.key.toLowerCase())){e.preventDefault();close()}else if(e.key==='Tab'){const targets=[...layer.querySelectorAll('button:not(:disabled)')].filter(el=>!el.hidden&&el.getClientRects().length),first=targets[0],last=targets.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}},true);
 window.addEventListener('keyup',e=>{if(open)e.stopImmediatePropagation()},true);
 viewportMedia('(orientation:portrait)').addEventListener('change',close);
 return {open(){if(open||onOpen()===false)return;previousFocus=document.activeElement;open=true;layer.hidden=false;last=performance.now();select(selectedCostume());q('.wardrobe-close').focus();observeCards();raf=requestAnimationFrame(frame)},close,isOpen:()=>open};
}
