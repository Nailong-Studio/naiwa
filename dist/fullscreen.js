export function isGameFullscreen(doc=document){return !!(doc.fullscreenElement||doc.webkitFullscreenElement)}
// iPhone browsers expose no page fullscreen at all.
export function canGoFullscreen(doc=document){const root=doc.documentElement;return !!(root?.requestFullscreen||root?.webkitRequestFullscreen)&&doc.fullscreenEnabled!==false&&doc.webkitFullscreenEnabled!==false}
// Invoke directly in the start-button gesture. Rejection must never block the game.
// A second request while one is still settling (a tap's touchend and click) shares it.
let inflight=null;
let expectedTurn=null;
// Only the landscape change produced by our current fullscreen request may skip pause.
export function consumeFullscreenTurn(portrait,doc=document){
 if(!expectedTurn||expectedTurn.doc!==doc)return false;
 expectedTurn=null;
 return !portrait&&isGameFullscreen(doc);
}
export function requestGameFullscreen(options){
 if(inflight)return inflight;
 const request=enterGameFullscreen(options);inflight=request;request.finally(()=>{if(inflight===request)inflight=null});
 return request;
}
async function enterGameFullscreen({mobile=true,doc=document,view=window}={}){
 if(isGameFullscreen(doc))return 'already';
 const root=doc.documentElement,request=root.requestFullscreen||root.webkitRequestFullscreen;
 if(!request||doc.fullscreenEnabled===false||doc.webkitFullscreenEnabled===false)return 'unsupported';
 const orientation=mobile?view.screen?.orientation:null;
 const turn=orientation?.lock&&view.matchMedia?.('(orientation:portrait)')?.matches?{doc}:null;
 if(turn)expectedTurn=turn;
 let locked=false;
 try{
  await request.call(root);
  try{if(orientation?.lock){await orientation.lock('landscape');locked=true}}catch{}
  return 'entered';
 }catch{return 'denied'}
 finally{
  if(turn&&expectedTurn===turn){
   const clear=()=>{if(expectedTurn===turn)expectedTurn=null};
   // Media-query events from a successful native lock may arrive on the next paint.
   if(locked&&view.requestAnimationFrame)view.requestAnimationFrame(()=>view.requestAnimationFrame(clear));
   else clear();
  }
 }
}
export async function toggleGameFullscreen({mobile=true,doc=document,view=window}={}){
 if(!isGameFullscreen(doc)){keeper.on=true;return requestGameFullscreen({mobile,doc,view})}
 // Switching fullscreen off by hand also stops the keeper until the next run.
 keeper.on=false;
 try{const exit=doc.exitFullscreen||doc.webkitExitFullscreen;if(!exit)return 'unsupported';await exit.call(doc);return 'exited'}catch{return 'denied'}
}
// Phone runs stay fullscreen. Browsers only allow it from a tap, so once a run has
// started, the first tap after the player left fullscreen (back gesture, app switch)
// asks again. A browser that keeps refusing is left alone for the rest of the run.
const keeper={on:false,pending:false,refusals:0};
export function keepGameFullscreen(on){keeper.on=!!on;keeper.refusals=0}
export function installFullscreenKeeper({doc=document,view=window,isMobile}){
 const tap=()=>{
  if(!keeper.on||keeper.pending||keeper.refusals>=2||!isMobile()||isGameFullscreen(doc)||!canGoFullscreen(doc))return;
  keeper.pending=true;
  requestGameFullscreen({doc,view}).then(result=>{keeper.refusals=result==='entered'||result==='already'?0:keeper.refusals+1}).finally(()=>{keeper.pending=false});
 };
 // touchend and click both count as a user gesture; touchstart and pointerdown do not.
 doc.addEventListener('touchend',tap,true);doc.addEventListener('click',tap,true);
}
