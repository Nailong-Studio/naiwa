// Sideways mode. When a touch browser stays in portrait (iPhone and in-app browsers
// cannot lock the orientation, and a phone's rotation lock keeps any browser upright),
// the whole page is turned 90° so the landscape layout fills the screen and the
// player turns the phone. Everything that reads the viewport is translated, so the
// rest of the game keeps seeing a landscape screen:
//  - stylesheets: media queries are answered for the turned size, and viewport units,
//    safe-area insets and pan-y touch rules are rewritten to the turned axes;
//  - scripts: pointer coordinates and element rects go through toVirtualPoint and
//    virtualRect, and viewportMedia() answers matchMedia queries for the turned screen.
// Outside sideways mode every helper is the identity, so desktop and real landscape
// behave exactly as before.
export const ROTATE_KEY='naiwa-rotate-direction';
// The device edge that ends up on each side of the turned page. cw turns the page
// clockwise: the phone's top edge becomes the left side, so the player turns the
// phone counter-clockwise (top to the left), the usual way to hold a landscape game.
const EDGES={cw:{top:'right',right:'bottom',bottom:'left',left:'top'},ccw:{top:'left',right:'top',bottom:'right',left:'bottom'}};
const state={dir:null,width:0,height:0};
const watchers=new Set();
const sessionDirections=new WeakMap();

export function rotation(){return state.dir}
export function savedDirection(view){
 if(sessionDirections.has(view))return sessionDirections.get(view);
 try{return view.localStorage?.getItem(ROTATE_KEY)==='ccw'?'ccw':'cw'}catch{return 'cw'}
}
export function flipDirection(view){
 const next=savedDirection(view)==='cw'?'ccw':'cw';
 sessionDirections.set(view,next);
 try{view.localStorage?.setItem(ROTATE_KEY,next)}catch{}
}
// size is the real visible viewport. Only touch screens turn; a narrow desktop window
// keeps the rotate prompt.
export function sidewaysDirection(view,size){
 if(!(size.height>size.width))return null;
 let coarse=false;try{coarse=!!view.matchMedia?.('(pointer:coarse)')?.matches}catch{}
 return coarse?savedDirection(view):null;
}

// Screen (client) coordinates to the turned page's coordinates, and back for vectors.
export function toVirtualPoint(x,y){
 if(state.dir==='cw')return {x:y,y:state.width-x};
 if(state.dir==='ccw')return {x:state.height-y,y:x};
 return {x,y};
}
export function toVirtualDelta(dx,dy){
 if(state.dir==='cw')return {x:dy,y:-dx};
 if(state.dir==='ccw')return {x:-dy,y:dx};
 return {x:dx,y:dy};
}
export function virtualRect(element){
 const r=element.getBoundingClientRect();if(!state.dir)return r;
 const a=toVirtualPoint(r.left,r.top),b=toVirtualPoint(r.left+r.width,r.top+r.height);
 const left=Math.min(a.x,b.x),top=Math.min(a.y,b.y),width=Math.abs(a.x-b.x),height=Math.abs(a.y-b.y);
 return {left,top,width,height,right:left+width,bottom:top+height,x:left,y:top};
}

// Answers a media query list for a given viewport size. Features that do not depend on
// the size (pointer, hover, prefers-*) are asked of the real browser through real().
// Returns null for anything it cannot read, so the caller keeps the browser's answer.
const length=value=>{const m=/^(-?\d*\.?\d+)(px|em|rem)?$/.exec(value.trim());return m?parseFloat(m[1])*(m[2]&&m[2]!=='px'?16:1):NaN};
export function evaluateMedia(text,{width,height,real}){
 const queries=String(text).split(',');let any=false;
 for(const query of queries){
  let s=query.trim().toLowerCase(),negate=false,ok=true;
  if(!s)continue;
  if(s.startsWith('only '))s=s.slice(5).trim();
  if(s.startsWith('not ')){negate=true;s=s.slice(4).trim()}
  for(const part of s.split(/\s+and\s+/)){
   if(part==='all'||part==='screen')continue;
   if(/^[a-z-]+$/.test(part)){ok=false;continue}
   const m=/^\(\s*([a-z-]+)\s*(?::\s*([^()]*?))?\s*\)$/.exec(part);if(!m)return null;
   const [,name,value='']=m;let result;
   if(/^(min|max)-(width|height)$/.test(name)){
    const limit=length(value);if(Number.isNaN(limit))return null;
    const size=name.endsWith('width')?width:height;result=name.startsWith('min')?size>=limit:size<=limit;
   }else if(name==='orientation')result=value===(width>height?'landscape':'portrait');
   else if(/width|height|aspect-ratio|resolution|device-/.test(name))return null;
   else result=!!real(value?`(${name}:${value})`:`(${name})`);
   ok=ok&&result;
  }
  if(negate?!ok:ok)any=true;
 }
 return any;
}

// Rewrites one declaration block for the turned page: viewport units follow the turned
// size (--game-vw/--game-vh), insets come from the device edge that is now on that side,
// and pan-y lists also accept the other axis because browsers differ on whether pan-y
// follows the rotation. The touch guard in mobile-viewport.js still decides direction.
// No lookbehind: Safari before 16.4 would refuse to load the module.
const UNITS=/(^|[^\w.-])(-?(?:\d+\.?\d*|\.\d+))(dvh|svh|lvh|vh|dvw|svw|lvw|vw|dvmin|svmin|lvmin|vmin|dvmax|svmax|lvmax|vmax)(?![\w-])/g;
const INSETS=/env\(\s*safe-area-inset-(top|right|bottom|left)/g;
const PAN_Y=/touch-action\s*:\s*pan-y(?=\s*(?:;|!|$))/g;
const NEEDS=/\d(?:dvh|svh|lvh|vh|dvw|svw|lvw|vw|dvmin|svmin|lvmin|vmin|dvmax|svmax|lvmax|vmax)(?![\w-])|safe-area-inset|touch-action\s*:\s*pan-y/;
export function rotateStyleText(text,dir){
 const edge=EDGES[dir];if(!edge)return text;
 return text.replace(UNITS,(match,before,number,unit)=>{
  const axis=unit.includes('min')?'min':unit.includes('max')?'max':unit.endsWith('h')?'h':'w';
  const base=axis==='h'?'var(--game-vh)':axis==='w'?'var(--game-vw)':`${axis}(var(--game-vw), var(--game-vh))`;
  const k=parseFloat(number)/100;return before+(k===1?base:`calc(${base} * ${+k.toFixed(6)})`);
 }).replace(INSETS,(match,side)=>`env(safe-area-inset-${edge[side]}`).replace(PAN_Y,'touch-action: pan-x pan-y');
}

// Same-origin stylesheets are read once; original texts are kept so leaving sideways
// mode restores every rule exactly.
const seenSheets=new WeakSet(),mediaRules=[],styleRules=[];
function collect(doc){
 for(const sheet of doc.styleSheets||[]){
  if(seenSheets.has(sheet))continue;let rules;try{rules=sheet.cssRules}catch{continue}if(!rules)continue;seenSheets.add(sheet);
  const walk=list=>{for(const rule of list){
   if(rule.media&&rule.cssRules&&!rule.styleSheet)mediaRules.push({rule,text:rule.media.mediaText,applied:rule.media.mediaText});
   if(rule.style&&NEEDS.test(rule.style.cssText))styleRules.push({rule,text:rule.style.cssText,dir:null});
   if(rule.cssRules)walk(rule.cssRules);
  }};
  walk(rules);
 }
}
function applySheets(doc,view){
 collect(doc);
 const {dir}=state,real=query=>{try{return view.matchMedia(query).matches}catch{return false}};
 for(const entry of styleRules){if(entry.dir===dir)continue;entry.rule.style.cssText=dir?rotateStyleText(entry.text,dir):entry.text;entry.dir=dir}
 for(const entry of mediaRules){
  let next=entry.text;
  if(dir){const result=evaluateMedia(entry.text,{width:state.height,height:state.width,real});if(result!==null)next=result?'all':'not all'}
  if(next!==entry.applied){entry.rule.media.mediaText=next;entry.applied=next}
 }
}

// width/height: the real visible viewport. Returns true when sideways mode turned on,
// off or changed direction.
export function applyRotation({doc,view,dir,width,height}){
 const was=state.dir;Object.assign(state,{dir:dir||null,width,height});
 if(!state.dir&&!was)return false;
 const root=doc.documentElement;
 if(root.dataset){if(state.dir)root.dataset.rotated=state.dir;else delete root.dataset.rotated}
 root.style?.setProperty?.('--real-w',width+'px');root.style?.setProperty?.('--real-h',height+'px');
 applySheets(doc,view);
 watchers.forEach(check=>check());
 return state.dir!==was;
}

// A MediaQueryList stand-in that answers for the turned screen. It reads the viewport
// live, so a real rotation never reports a passing portrait state before the page turns.
export function viewportMedia(query,view=window){
 const real=view.matchMedia(query),listeners=new Set();
 const evaluate=()=>{
  const v=view.visualViewport,size={width:Math.round(v?.width>0?v.width:view.innerWidth),height:Math.round(v?.height>0?v.height:view.innerHeight)};
  if(!sidewaysDirection(view,size))return real.matches;
  const result=evaluateMedia(query,{width:size.height,height:size.width,real:q=>view.matchMedia(q).matches});
  return result===null?real.matches:result;
 };
 let last=evaluate();
 const check=()=>{const now=evaluate();if(now===last)return;last=now;const event={matches:now,media:query};listeners.forEach(fn=>fn(event))};
 real.addEventListener('change',check);watchers.add(check);
 return {media:query,get matches(){return evaluate()},addEventListener(type,fn){if(type==='change')listeners.add(fn)},removeEventListener(type,fn){listeners.delete(fn)}};
}
