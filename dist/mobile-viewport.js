import {applyRotation,sidewaysDirection,toVirtualDelta} from './rotate-view.js';
export const MOBILE_QUERY='(max-width:780px), (pointer:coarse), (max-width:1100px) and (max-height:600px)';
export function visibleGameSize(view){
 const v=view.visualViewport;
 // A missing/zero visual viewport must not collapse the arena during rotation.
 return {width:Math.round(v?.width>0?v.width:view.innerWidth),height:Math.round(v?.height>0?v.height:view.innerHeight)};
}
// Positive finger delta means pulling the content down; permit it only above its top edge.
export function canScrollVertically(node,delta){
 const max=node.scrollHeight-node.clientHeight;
 return max>1&&(delta>0?node.scrollTop>0:delta<0?node.scrollTop<max-1:false);
}
export function installMobileViewport({view=window,doc=document,media,resetInput}){
 let previous='',previousMobile=null,previousDir=null,scheduled=false;const fingers=new Map(),root=doc.documentElement;
 // A portrait touch screen turns the page sideways (rotate-view.js); --game-vw/--game-vh
 // then hold the turned, landscape size.
 function sync(){scheduled=false;const real=visibleGameSize(view),dir=sidewaysDirection(view,real),size=dir?{width:real.height,height:real.width}:real,key=`${size.width}:${size.height}:${media.matches}:${dir}`;
  if(previousMobile!==media.matches){previousMobile=media.matches;resetInput()}
  if(previousDir!==dir){previousDir=dir;resetInput();fingers.clear()}
  if(key!==previous){previous=key;root.style.setProperty('--game-vw',size.width+'px');root.style.setProperty('--game-vh',size.height+'px');applyRotation({doc,view,dir,...real})}
  if(media.matches&&(view.scrollX||view.scrollY))view.scrollTo(0,0);
 }
 const schedule=()=>{if(!scheduled){scheduled=true;view.requestAnimationFrame(sync)}};
 const rotate=()=>{resetInput();fingers.clear();schedule()};
 view.addEventListener('resize',schedule);view.addEventListener('orientationchange',rotate);view.screen?.orientation?.addEventListener?.('change',rotate);view.addEventListener('scroll',schedule,{passive:true});
 view.visualViewport?.addEventListener('resize',schedule);view.visualViewport?.addEventListener('scroll',schedule);doc.addEventListener('fullscreenchange',schedule);doc.addEventListener('webkitfullscreenchange',schedule);media.addEventListener('change',schedule);
 const scrollable=(target,delta)=>{
  if(!target?.closest?.('.modal,dialog[open],aside[data-open-panel],.mobile-menu-sheet,.wardrobe'))return false;
  for(let node=target;node&&node!==doc.body;node=node.parentElement){
   if(canScrollVertically(node,delta)&&/auto|scroll/.test(view.getComputedStyle(node).overflowY))return true;
  }return false;
 };
 doc.addEventListener('touchstart',e=>{for(const t of e.changedTouches)fingers.set(t.identifier,{x:t.clientX,y:t.clientY})},{passive:true});
 doc.addEventListener('touchmove',e=>{
  if(!media.matches)return;let permit=e.touches.length===1;
  for(const t of e.changedTouches){const old=fingers.get(t.identifier)||{x:t.clientX,y:t.clientY},move=toVirtualDelta(t.clientX-old.x,t.clientY-old.y);fingers.set(t.identifier,{x:t.clientX,y:t.clientY});if(Math.abs(move.x)>Math.abs(move.y)||!scrollable(t.target||e.target,move.y))permit=false}
  if(!permit&&e.cancelable)e.preventDefault();
 },{passive:false});
 const release=e=>{for(const t of e.changedTouches)fingers.delete(t.identifier)};doc.addEventListener('touchend',release,{passive:true});doc.addEventListener('touchcancel',release,{passive:true});
 doc.addEventListener('wheel',e=>{if(media.matches&&!scrollable(e.target,-e.deltaY)&&e.cancelable)e.preventDefault()},{passive:false});
 view.addEventListener('blur',()=>fingers.clear());view.addEventListener('load',()=>{previous='';schedule()});sync();
 // refresh(): re-read the viewport and the saved sideways direction now.
 return {refresh(){previous='';sync()}};
}
