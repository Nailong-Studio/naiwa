import {toggleGameFullscreen,canGoFullscreen,consumeFullscreenTurn} from './fullscreen.js';
import {MOBILE_QUERY,installMobileViewport} from './mobile-viewport.js';
import {flipDirection,toVirtualPoint,toVirtualDelta,virtualRect,viewportMedia} from './rotate-view.js';
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
// The move stick is a thumb zone. Its ring rests at the usual spot and jumps under the
// finger where it lands. The zone's left and bottom are the screen edges, so only those
// push the ring back; it may cross the zone's inner edges. Offsets are from the zone's
// left and bottom edges, in the page's own (possibly sideways) axes.
export function ringPlacement(zone,size,point){
 const half=size/2,cx=Math.max(point.x-zone.left,half),cy=Math.min(point.y-zone.top,zone.height-half);
 return {left:cx-half,bottom:zone.height-cy-half};
}
export function bindStickControl(element,change,{deadZone=7}={}){
 let origin=null,radius=0;
 const ring=element.querySelector?.('em')||null,style=element.style,view=element.ownerDocument?.defaultView;
 function place(){
  if(!origin||!ring||!style?.setProperty)return;
  const at=ringPlacement(virtualRect(element),virtualRect(ring).width,toVirtualPoint(origin.x,origin.y));
  style.setProperty('--ring-x',at.left+'px');style.setProperty('--ring-y',at.bottom+'px');
 }
 const rest=()=>{style?.removeProperty?.('--ring-x');style?.removeProperty?.('--ring-y')};
 // Keep the neutral point on the physical screen when browser bars resize a sideways page.
 // Reposition the artwork after layout. The held finger's movement uses only its own delta.
 if(view?.ResizeObserver&&ring){
  const observer=new view.ResizeObserver(place);observer.observe(element);observer.observe(ring);
 }else if(view?.requestAnimationFrame){
  const afterLayout=()=>view.requestAnimationFrame(()=>view.requestAnimationFrame(place));
  view.addEventListener('resize',afterLayout);view.visualViewport?.addEventListener('resize',afterLayout);
 }
 return bindHoldControl(element,e=>{
  origin={x:e.clientX,y:e.clientY};radius=(ring?virtualRect(ring).width+12:virtualRect(element).width)*.32;
  place();change({x:0,y:0},true);
 },()=>{origin=null;rest();change({x:0,y:0},false)},{move:e=>{
  if(!origin)return;
  const delta=toVirtualDelta(e.clientX-origin.x,e.clientY-origin.y);
  change(stickVector(delta.x,delta.y,radius,deadZone),true);
 }});
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
 let center=null,aim={x:0,y:0};
 // Keep the origin stable until release: address-bar/fullscreen layout changes
 // must not move the neutral point under a stationary finger.
 const update=e=>{if(!center)return;const {x,y}=toVirtualDelta(e.clientX-center.x,e.clientY-center.y);aim=Math.hypot(x,y)<=deadZone?{x:0,y:0}:cardinalAim(x,y,aim,.15);change(aim,true)};
 const reset=bindHoldControl(element,e=>{const r=element.getBoundingClientRect();center={x:r.left+r.width/2,y:r.top+r.height/2};update(e)},()=>{center=null;aim={x:0,y:0};change(aim,false)},{move:update});
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
 const layoutOptions=[...document.querySelectorAll('[data-touch-layout-option]')];
 function applyTouchLayout(value){const layout=value==='wide'?'wide':'balanced';document.documentElement.dataset.touchLayout=layout;layoutOptions.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.touchLayoutOption===layout)));return layout}
 try{applyTouchLayout(localStorage.getItem('naiwa-touch-layout'))}catch{applyTouchLayout('balanced')}
 layoutOptions.forEach(b=>b.onclick=()=>{resetInput();const layout=applyTouchLayout(b.dataset.touchLayoutOption);try{localStorage.setItem('naiwa-touch-layout',layout)}catch{};scaleReadout()});
 // 画面 ↔ 按键: five saved steps that trade room size against control size and reach.
 const scaleOptions=[...document.querySelectorAll('[data-touch-scale-option]')],readout=document.querySelector('#touchScaleReadout');
 function applyTouchScale(value){const step=Math.min(5,Math.max(1,Math.round(Number(value))||3));document.documentElement.dataset.touchScale=String(step);scaleOptions.forEach(b=>b.setAttribute('aria-checked',String(Number(b.dataset.touchScaleOption)===step)));return step}
 function scaleReadout(){if(!readout)return;requestAnimationFrame(()=>{const room=virtualRect(document.querySelector('#game')),fire=document.querySelector('#touchFire'),pad=virtualRect(fire).width-2*(parseFloat(getComputedStyle(fire).getPropertyValue('--slop'))||0);readout.textContent=media.matches&&room.width?`房间 ${Math.round(room.width)} × ${Math.round(room.height)} · 攻击键 ${Math.round(pad)} px`:''})}
 try{applyTouchScale(localStorage.getItem('naiwa-touch-scale')??3)}catch{applyTouchScale(3)}
 scaleOptions.forEach(b=>b.onclick=()=>{resetInput();const step=applyTouchScale(b.dataset.touchScaleOption);try{localStorage.setItem('naiwa-touch-scale',String(step))}catch{};scaleReadout()});
 // Portrait as the game sees it: a sideways page counts as landscape.
 const portrait=viewportMedia('(orientation:portrait)'),aside=document.querySelector('aside'),backdrop=document.querySelector('#mobileBackdrop');
 const buttons=[...document.querySelectorAll('[data-mobile-panel]')];let suspended=false,previousFocus=null;
 const menu=document.querySelector('#mobileMenuLayer'),menuToggle=document.querySelector('#mobileMenuToggle');let menuSuspended=false;
 function menuLabels(){for(const [target,source] of [['menuSound','sound']]){const b=document.getElementById(target),s=document.getElementById(source);b.textContent=s.textContent}scaleReadout()}
 function closeMenu(){if(menu.hidden)return;menu.hidden=true;menuToggle.setAttribute('aria-expanded','false');document.body.classList.remove('mobile-panel-open');if(menuSuspended)resume();menuSuspended=false;resetInput();menuToggle.focus({preventScroll:true})}
 menuToggle.onclick=()=>{if(!menu.hidden){closeMenu();return}close();menuSuspended=suspend();resetInput();menu.hidden=false;menuToggle.setAttribute('aria-expanded','true');document.body.classList.add('mobile-panel-open');menuLabels();document.querySelector('#mobileMenuClose').focus({preventScroll:true})};
 document.querySelector('#mobileMenuClose').onclick=closeMenu;
 menu.addEventListener('click',e=>{if(e.target===menu)closeMenu()});
 menu.querySelectorAll('[data-menu-action]').forEach(b=>b.onclick=()=>{const action=b.dataset.menuAction;if(action==='sound'){document.getElementById(action).click();menuLabels();return}if(action==='rotate'){flipSideways();return}closeMenu();if(['map','stats','inventory'].includes(action))document.querySelector(`[data-mobile-panel="${action}"]`).click();else document.getElementById(action).click()});
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
 // Turning a touch phone pauses play even though the page itself stays landscape.
 // Entering fullscreen locks landscape and turns the screen too; that one is ours.
 matchMedia('(orientation:portrait)').addEventListener('change',event=>{if(media.matches&&matchMedia('(pointer:coarse)').matches&&!consumeFullscreenTurn(event.matches)){resetInput();pause()}});
 // Sideways mode can face either way; the menu flips it and the choice is saved.
 let viewport=null;
 function flipSideways(){flipDirection(window);resetInput();viewport?.refresh();scaleReadout()}
 // iPhone browsers have no page fullscreen; the menu button would only report that.
 if(!canGoFullscreen())document.querySelector('[data-menu-action="mobileFullscreen"]')?.setAttribute('hidden','');
 document.querySelector('#mobileFullscreen').addEventListener('click',async()=>{
  const result=await toggleGameFullscreen({mobile:matchMedia('(pointer:coarse)').matches});
  if(result==='unsupported')notify('此浏览器不支持网页全屏，已使用横屏铺满布局。');
  else if(result==='denied')notify('浏览器未允许全屏，可继续横屏游玩或收起地址栏。');
 });
 document.querySelector('#quickFullscreen').onclick=()=>document.querySelector('#mobileFullscreen').click();
 for(const type of ['selectstart','contextmenu','dragstart'])document.querySelector('.game-column').addEventListener(type,e=>e.preventDefault());
 document.querySelector('#game').addEventListener('pointerdown',e=>e.preventDefault());
 viewport=installMobileViewport({media,resetInput});
}
