import test from 'node:test';
import assert from 'node:assert/strict';
import {pngPixels} from './png-pixels.mjs';
import {FRAME_REGIONS,atlasRegion} from '../dist/atlas-regions.js';
import {heroDrawRect} from '../dist/hero-art.js';
import {ITEMS} from '../dist/campaign.js';
import {itemTexture,itemIcon} from '../dist/item-icons.js';
const cache=new Map();
function pixels(file){if(!cache.has(file))cache.set(file,pngPixels(new URL('../dist/assets/'+file,import.meta.url)));return cache.get(file)}
test('measured atlas frames are inside the real PNG and contain visible pixels',()=>{
 for(const [file,frames] of Object.entries(FRAME_REGIONS)){
  const im=pixels(file);
  for(const [left,top,w,h] of frames){
   assert.ok(left>=0&&top>=0&&w>0&&h>0&&left+w<=im.width&&top+h<=im.height,file);
   let count=0;for(let y=top;y<top+h;y++)for(let x=left;x<left+w;x++)if(im.alpha(x,y)>160)count++;
   assert.ok(count>1000,file+' empty or fragment-only frame');
  }
 }
});
test('atlas cuts never slice a connected character body or large prop',()=>{
 for(const [file,frames] of Object.entries(FRAME_REGIONS)){
  const im=pixels(file),seen=new Uint8Array(im.width*im.height);
  for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++){
   const index=y*im.width+x;if(seen[index]||im.alpha(x,y)<=160)continue;
   const queue=[index];seen[index]=1;let l=x,r=x,t=y,b=y;
   for(let n=0;n<queue.length;n++){
    const yy=Math.floor(queue[n]/im.width),xx=queue[n]%im.width;l=Math.min(l,xx);r=Math.max(r,xx);t=Math.min(t,yy);b=Math.max(b,yy);
    for(const [nx,ny] of [[xx-1,yy],[xx+1,yy],[xx,yy-1],[xx,yy+1]]){if(nx<0||ny<0||nx>=im.width||ny>=im.height)continue;const i=ny*im.width+nx;if(!seen[i]&&im.alpha(nx,ny)>160){seen[i]=1;queue.push(i)}}
   }
   if(queue.length>=1000)assert.ok(frames.some(([fl,ft,w,h])=>l>=fl&&r<fl+w&&t>=ft&&b<ft+h),`${file}: cut body ${[l,t,r,b]}`);
  }
 }
});
test('all item icons and world sprites use identical source bounds',()=>{
 for(const item of ITEMS){const tex=itemTexture(item.id);assert.ok(tex,item.id);const im=pixels(tex.file),col=tex.index%tex.cols,row=Math.floor(tex.index/tex.cols);const r=atlasRegion(tex.file,tex.cols,tex.rows,row,col,im.width,im.height),html=itemIcon(item);
  const size=html.match(/background-size:([\d.]+)% ([\d.]+)%/),position=html.match(/background-position:([\d.]+)% ([\d.]+)%/);
  assert.ok(size&&position,item.id);
  const w=im.width/(+size[1]/100),h=im.height/(+size[2]/100),l=+position[1]/100*(im.width-w),t=+position[2]/100*(im.height-h);
  for(const [actual,expected] of [[w,r.w],[h,r.h],[l,r.left],[t,r.top]])assert.ok(Math.abs(actual-expected)<.001,item.id+' UI/world mismatch');
 }
});
test('hero crop correction preserves source scale and tint canvas contains extended poses',()=>{
 const im=pixels('naiwa-pixel-v2.png'),image={naturalWidth:im.width,naturalHeight:im.height};
 for(let frame=0;frame<16;frame++){const r=heroDrawRect(image,frame);assert.ok(Math.abs(r.dw/r.w-90/(im.width/4))<1e-10);assert.ok(Math.abs(r.dh/r.h-90/(im.height/4))<1e-10);assert.ok(r.dx>=-55&&r.dy>=-75&&r.dx+r.dw<=55&&r.dy+r.dh<=35)}
 const jump=heroDrawRect(image,13),landing=heroDrawRect(image,14);
 assert.ok(jump.top<=926&&jump.left+jump.w<=626,'jump includes whole head but no landing dust');assert.ok(landing.left<=626,'landing keeps its own left dust');
});
