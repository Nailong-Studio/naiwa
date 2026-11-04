export function isGameFullscreen(doc=document){return !!(doc.fullscreenElement||doc.webkitFullscreenElement)}
// Invoke directly in the start-button gesture. Rejection must never block the game.
export async function requestGameFullscreen({mobile=true,doc=document,view=window}={}){
 if(isGameFullscreen(doc))return 'already';
 const root=doc.documentElement,request=root.requestFullscreen||root.webkitRequestFullscreen;
 if(!request||doc.fullscreenEnabled===false||doc.webkitFullscreenEnabled===false)return 'unsupported';
 try{
  await request.call(root);
  try{if(mobile)await view.screen?.orientation?.lock?.('landscape')}catch{}
  return 'entered';
 }catch{return 'denied'}
}
export async function toggleGameFullscreen({mobile=true,doc=document,view=window}={}){
 if(!isGameFullscreen(doc))return requestGameFullscreen({mobile,doc,view});
 try{const exit=doc.exitFullscreen||doc.webkitExitFullscreen;if(!exit)return 'unsupported';await exit.call(doc);return 'exited'}catch{return 'denied'}
}
