import {pngPixels} from './png-pixels.mjs';
import {spriteRegion} from '../dist/sprite-art.js';
const sheets=[['items-classic-v1.png',7,6]];
function gap(im,axis,nominal,lo,hi,radius){
 let runs=[],start=null;const end=Math.min(axis==='x'?im.width:im.height,Math.ceil(nominal+radius));
 for(let k=Math.max(0,Math.floor(nominal-radius));k<end;k++){
  let count=0;for(let v=Math.ceil(lo);v<Math.floor(hi);v++)count+=im.alpha(axis==='x'?k:v,axis==='x'?v:k)>96?1:0;
  if(count===0){if(start===null)start=k}else if(start!==null){if(k-start>=5)runs.push([start,k]);start=null}
 }
 if(start!==null&&end-start>=5)runs.push([start,end]);
 runs.sort((a,b)=>Math.abs((a[0]+a[1])/2-nominal)-Math.abs((b[0]+b[1])/2-nominal));
 return runs.length?Math.round((runs[0][0]+runs[0][1])/2):Math.round(nominal);
}
for(const [file,cols,rows] of sheets){const im=pngPixels(new URL('../dist/assets/'+file,import.meta.url));const regions=[];
 for(let r=0;r<rows;r++)for(let col=0;col<cols;col++){
  const box=spriteRegion({src:file,naturalWidth:im.width,naturalHeight:im.height},cols,rows,r,col);
  let {left:l,top:t,w,h}=box,right=l+w,bottom=t+h;
  if(col>0)l=gap(im,'x',l,t,bottom,w*.22);if(col<cols-1)right=gap(im,'x',right,t,bottom,w*.22);
  if(r>0)t=gap(im,'y',t,l,right,h*.2);if(r<rows-1)bottom=gap(im,'y',bottom,l,right,h*.2);
  if(col>0)l=gap(im,'x',l,t,bottom,w*.22);if(col<cols-1)right=gap(im,'x',right,t,bottom,w*.22);
  regions.push([Math.round(l),Math.round(t),Math.round(right-l),Math.round(bottom-t)]);
 }
 console.log(JSON.stringify({file,regions}));
}
