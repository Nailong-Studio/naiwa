import {pngPixels} from './png-pixels.mjs';
import {COSTUMES} from '../dist/costumes.js';
import {writeFileSync} from 'node:fs';
function gap(im,axis,n,lo,hi,radius){
 let runs=[],start=null,end=Math.min(axis==='x'?im.width:im.height,Math.ceil(n+radius));
 for(let k=Math.max(0,Math.floor(n-radius));k<end;k++){
  let count=0;for(let v=Math.ceil(lo);v<Math.floor(hi);v++)count+=im.alpha(axis==='x'?k:v,axis==='x'?v:k)>96?1:0;
  if(!count){if(start===null)start=k}else if(start!==null){if(k-start>=4)runs.push([start,k]);start=null}
 }
 if(start!==null&&end-start>=4)runs.push([start,end]);
 runs.sort((a,b)=>Math.abs((a[0]+a[1])/2-n)-Math.abs((b[0]+b[1])/2-n));
 return runs.length?Math.round((runs[0][0]+runs[0][1])/2):Math.round(n);
}
const result={};
for(const {file,id} of COSTUMES.slice(1)){
 const im=pngPixels(new URL('../dist/assets/'+file,import.meta.url)),cw=im.width/4,ch=im.height/4,frames=[];
 for(let row=0;row<4;row++)for(let col=0;col<4;col++){
  let l=col*cw,t=row*ch,r=l+cw,b=t+ch;
  if(col>0)l=gap(im,'x',l,t,b,cw*.22);if(col<3)r=gap(im,'x',r,t,b,cw*.22);
  if(row>0)t=gap(im,'y',t,l,r,ch*.22);if(row<3)b=gap(im,'y',b,l,r,ch*.22);
  if(col>0)l=gap(im,'x',l,t,b,cw*.22);if(col<3)r=gap(im,'x',r,t,b,cw*.22);
  frames.push([Math.round(l),Math.round(t),Math.round(r-l),Math.round(b-t)]);
 }
 result[file]=frames;console.log(id,im.width,im.height);
}
writeFileSync(new URL('../dist/costume-regions.js',import.meta.url),'// Measured transparent gutters; source artwork is preserved unchanged.\nexport const COSTUME_REGIONS='+JSON.stringify(result)+';\n');
