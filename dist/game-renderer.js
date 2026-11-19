import {prepareGameCanvas} from './canvas-compat.js';

// Gameplay stays in 960 × 600 coordinates. Only the drawing buffer follows the
// display density, with a 1920 × 1200 ceiling for mobile memory and fill rate.
export function gameRenderSize(cssWidth,cssHeight,dpr=1){
 const density=Number.isFinite(dpr)&&dpr>0?dpr:1;
 const width=Number.isFinite(cssWidth)&&cssWidth>0?cssWidth:960;
 const height=Number.isFinite(cssHeight)&&cssHeight>0?cssHeight:600;
 const scale=Math.max(1,Math.min(2,Math.max(width/960,height/600)*density));
 const units=Math.min(120,Math.ceil(60*scale));
 return {width:units*16,height:units*10,scale:units/60};
}

export function createGameRenderer(canvas,view=window){
 const context=prepareGameCanvas(canvas.getContext('2d'));
 let dirty=true,lastDpr,size;
 const invalidate=()=>{dirty=true};
 view.addEventListener?.('resize',invalidate);
 view.visualViewport?.addEventListener?.('resize',invalidate);
 const observer=view.ResizeObserver?new view.ResizeObserver(invalidate):null;
 observer?.observe(canvas);
 return {
  context,
  beginFrame(){
   const dpr=view.devicePixelRatio||1;
   if(dirty||dpr!==lastDpr){
    // client size is before the portrait-page CSS rotation; boundingClientRect
    // would swap the axes and select the wrong resolution on those phones.
    size=gameRenderSize(canvas.clientWidth,canvas.clientHeight,dpr);
    if(canvas.width!==size.width||canvas.height!==size.height){canvas.width=size.width;canvas.height=size.height}
    dirty=false;lastDpr=dpr;
   }
   context.setTransform(size.scale,0,0,size.scale,0,0);
   context.imageSmoothingEnabled=false;
   context.clearRect(0,0,960,600);
  },
  dispose(){observer?.disconnect();view.removeEventListener?.('resize',invalidate);view.visualViewport?.removeEventListener?.('resize',invalidate)}
 };
}
