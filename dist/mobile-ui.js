import {toggleGameFullscreen} from './fullscreen.js';
import {MOBILE_QUERY,installMobileViewport} from './mobile-viewport.js';
export function bindHoldControl(element,press,release,{move=()=>{}}={}){
 let pointer=null;const doc=element.ownerDocument,view=doc?.defaultView,seen=new WeakSet();
 element.addEventListener('pointerdown',e=>{if(pointer!==null||e.button!==0)return;e.preventDefault();pointer=e.pointerId;try{element.setPointerCapture?.(pointer)}catch{}element.classList?.add('held');press(e)});
 const reset=()=>{if(pointer===null)return;const id=pointer;pointer=null;element.classList?.remove('held');try{if(element.hasPointerCapture?.(id))element.releasePointerCapture(id)}catch{}release()};
 const end=e=>{if(e.pointerId!==pointer)return;reset()};
 const moving=e=>{if(e.pointerId!==pointer||seen.has(e))return;seen.add(e);if(e.pointerType==='mouse'&&e.buttons===0){reset();return}e.preventDefault();move(e)};
 // Capture is an optimization, not the lifetime of a finger. Window fallback
 // follows it outside the button even when a mobile browser drops capture.
 for(const target of new Set([element,view].filter(Boolean))){for(const type of ['pointerup','pointercancel'])target.addEventListener(type,end,true);target.addEventListener('pointermove',moving,{capture:true,passive:false})}
 element.addEventListener('lostpointercapture',()=>{if(element.isConnected===false||!view)reset()});
 view?.addEventListener('blur',reset);view?.addEventListener('pagehide',reset);
 doc?.addEventListener?.('visibilitychange',()=>{if(doc.hidden)reset()});
 element.addEventListener('contextmenu',e=>e.preventDefault());
 return reset;
}
// Use the point where the finger landed as neutral, so touching off-centre never jumps.
export function stickVector(dx,dy,radius,deadZone=7){
 const length=Math.hypot(dx,dy);
 if(length<=deadZone)return {x:0,y:0};
 const strength=Math.min(1,(length-deadZone)/Math.max(1,radius-deadZone));
 return {x:dx/length*strength,y:dy/length*strength};
}
export function bindStickControl(element,change,{deadZone=7}={}){
 let origin=null,radius=0;
 const reset=bindHoldControl(element,e=>{origin={x:e.clientX,y:e.clientY};radius=element.getBoundingClientRect().width*.32;change({x:0,y:0},true)},()=>{origin=null;change({x:0,y:0},false)},{move:e=>{if(origin)change(stickVector(e.clientX-origin.x,e.clientY-origin.y,radius,deadZone),true)}});
 return reset;
}
// Consumables use a one-frame pulse, never a held key or a delayed action after a menu.
export function createTouchActions(){
 const pending=new Set();
 return {press(action,playing=true){if(playing)pending.add(action)},take(){const actions=Object.fromEntries([...pending].map(key=>[key,true]));pending.clear();return actions},clear(){pending.clear()}};
}
// Dominant axis wins; retain the previous axis near a diagonal to avoid jitter.
export function cardinalAim(x,y,previous={x:0,y:0},hysteresis=0){
 if(!Number.isFinite(x)||!Number.isFinite(y)||(!x&&!y))return {x:0,y:0};
 const horizontal=previous.x?Math.abs(y)<=Math.abs(x)*(1+hysteresis):previous.y?Math.abs(x)>Math.abs(y)*(1+hysteresis):Math.abs(x)>=Math.abs(y);
 return horizontal?{x:Math.sign(x),y:0}:{x:0,y:Math.sign(y)};
}
export function bindAttackStick(element,change,{deadZone=12}={}){
 let bounds=null,aim={x:0,y:0};
 // Keep the origin stable until release: address-bar/fullscreen layout changes
 // must not move the neutral point under a stationary finger.
 const update=e=>{if(!bounds)return;const x=e.clientX-bounds.left-bounds.width/2,y=e.clientY-bounds.top-bounds.height/2;aim=Math.hypot(x,y)<=deadZone?{x:0,y:0}:cardinalAim(x,y,aim,.15);change(aim,true)};
 const reset=bindHoldControl(element,e=>{bounds=element.getBoundingClientRect();update(e)},()=>{bounds=null;aim={x:0,y:0};change(aim,false)},{move:update});
 return reset;
}
export function mobileAttack({held,aim,playing}){
 const direction=cardinalAim(aim.x,aim.y),fire=!!(playing&&held&&(direction.x||direction.y));
 return {fire,auto:false,ax:fire?direction.x:0,ay:fire?direction.y:0};
}
// A panel owns pause shortcuts until it closes; never resume the game behind it.
export function bindPanelShortcuts(target,{isOpen,close}){
 target.addEventListener('keydown',e=>{if(!isOpen()||!['escape','p'].includes(e.key.toLowerCase()))return;e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)close()},true);
}
export function bindMapShortcut(target,{canToggle,toggle}){
 target.addEventListener('keydown',e=>{
  if(e.key.toLowerCase()!=='m'||e.ctrlKey||e.altKey||e.metaKey||e.isComposing)return;
  if(e.target?.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName)||!canToggle())return;
  e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)toggle();
 },true);
}
export function setupMobileUI({suspend,resume,resetInput,pause,notify,canOpenMap=()=>false}){
 const media=matchMedia(MOBILE_QUERY);
 const portrait=matchMedia('(orientation:portrait)'),aside=document.querySelector('aside'),backdrop=document.querySelector('#mobileBackdrop');
 const buttons=[...document.querySelectorAll('[data-mobile-panel]')];let suspended=false,previousFocus=null;
 const menu=document.querySelector('#mobileMenuLayer'),menuToggle=document.querySelector('#mobileMenuToggle');let menuSuspended=false;
 function menuLabels(){for(const [target,source] of [['menuSound','sound']]){const b=document.getElementById(target),s=document.getElementById(source);b.textContent=s.textContent}}
 function closeMenu(){if(menu.hidden)return;menu.hidden=true;menuToggle.setAttribute('aria-expanded','false');document.body.classList.remove('mobile-panel-open');if(menuSuspended)resume();menuSuspended=false;resetInput();menuToggle.focus({preventScroll:true})}
 menuToggle.onclick=()=>{if(!menu.hidden){closeMenu();return}close();menuSuspended=suspend();resetInput();menu.hidden=false;menuToggle.setAttribute('aria-expanded','true');document.body.classList.add('mobile-panel-open');menuLabels();document.querySelector('#mobileMenuClose').focus({preventScroll:true})};
 document.querySelector('#mobileMenuClose').onclick=closeMenu;
 menu.addEventListener('click',e=>{if(e.target===menu)closeMenu()});
 menu.querySelectorAll('[data-menu-action]').forEach(b=>b.onclick=()=>{const action=b.dataset.menuAction;if(action==='sound'){document.getElementById(action).click();menuLabels();return}closeMenu();if(['map','stats','inventory'].includes(action))document.querySelector(`[data-mobile-panel="${action}"]`).click();else document.getElementById(action).click()});
 function close(){if(!aside.dataset.openPanel)return;delete aside.dataset.openPanel;aside.removeAttribute('role');aside.removeAttribute('aria-modal');document.body.classList.remove('mobile-panel-open');backdrop.hidden=true;buttons.forEach(b=>b.setAttribute('aria-expanded','false'));resetInput();if(suspended)resume();suspended=false;previousFocus?.focus({preventScroll:true})}
 buttons.forEach(button=>button.addEventListener('click',()=>{
  if(aside.dataset.openPanel===button.dataset.mobilePanel){close();return}
  if(!aside.dataset.openPanel){previousFocus=media.matches?button:document.activeElement;suspended=suspend();resetInput()}
  aside.dataset.openPanel=button.dataset.mobilePanel;aside.setAttribute('role','dialog');aside.setAttribute('aria-modal','true');document.body.classList.add('mobile-panel-open');backdrop.hidden=false;
  buttons.forEach(b=>b.setAttribute('aria-expanded',String(b===button)));document.querySelector('#closeMobilePanel').focus({preventScroll:true});
 }));
 document.querySelector('#closeMobilePanel').addEventListener('click',close);backdrop.addEventListener('click',close);
 bindPanelShortcuts(window,{isOpen:()=>!menu.hidden||!!aside.dataset.openPanel,close:()=>{if(!menu.hidden)closeMenu();else close()}});
 bindMapShortcut(window,{canToggle:()=>menu.hidden&&(!!aside.dataset.openPanel||canOpenMap()),toggle:()=>document.querySelector('[data-mobile-panel="map"]').click()});
 function layout(){if(!media.matches||portrait.matches){close();closeMenu()}if(media.matches&&portrait.matches){resetInput();pause()}}
 media.addEventListener('change',layout);portrait.addEventListener('change',layout);layout();
 document.querySelector('#mobileFullscreen').addEventListener('click',async()=>{
  const result=await toggleGameFullscreen();
  if(result==='unsupported')notify('此浏览器不支持网页全屏，已使用横屏铺满布局。');
  else if(result==='denied')notify('浏览器未允许全屏，可继续横屏游玩或收起地址栏。');
 });
 document.querySelector('#quickFullscreen').onclick=()=>document.querySelector('#mobileFullscreen').click();
 for(const type of ['selectstart','contextmenu','dragstart'])document.querySelector('.game-column').addEventListener(type,e=>e.preventDefault());
 document.querySelector('#game').addEventListener('pointerdown',e=>e.preventDefault());
 installMobileViewport({media,resetInput});
}
