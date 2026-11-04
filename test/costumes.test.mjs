import test from 'node:test';
import assert from 'node:assert/strict';
import {COSTUMES,COSTUME_KEY,costumeById,readCostume,setCostume,selectedCostume} from '../dist/costumes.js';
import {COSTUME_REGIONS} from '../dist/costume-regions.js';
import {heroDrawRect,heroFrame} from '../dist/hero-art.js';
import {pngPixels} from './png-pixels.mjs';
import {Game} from '../dist/campaign.js';
test('costume catalog identities are unique and unavailable storage falls back safely',()=>{
 assert.equal(new Set(COSTUMES.map(c=>c.id)).size,COSTUMES.length);
 assert.equal(readCostume({getItem(){throw Error()}}),'original');assert.equal(costumeById('bad').id,'original');
 let saved;const storage={getItem:k=>k===COSTUME_KEY?saved:null,setItem:(k,v)=>saved=v};
 setCostume('phoebe',storage);assert.equal(readCostume(storage),'phoebe');assert.equal(selectedCostume(),'phoebe');
 setCostume('bad',storage);assert.equal(saved,'original');
 setCostume('david',{setItem(){throw Error()}});assert.equal(selectedCostume(),'david');setCostume('original');
});
test('equipping every costume leaves combat stats, charge, inventory and hitbox unchanged',()=>{
 const g=new Game();g.start();const snapshot=JSON.stringify(g);
 for(const c of COSTUMES){setCostume(c.id,null);assert.equal(JSON.stringify(g),snapshot)}setCostume('original',null);
});
test('all costume atlases have sixteen complete frames and preserve aspect ratio and tint bounds',()=>{
 for(const def of COSTUMES.slice(1)){
  const im=pngPixels(new URL('../dist/assets/'+def.file,import.meta.url)),frames=COSTUME_REGIONS[def.file],image={naturalWidth:im.width,naturalHeight:im.height};assert.equal(frames.length,16);
  for(let f=0;f<16;f++){
   const r=heroDrawRect(image,f,def.file);assert.ok(r.left>=0&&r.top>=0&&r.left+r.w<=im.width&&r.top+r.h<=im.height,def.id+':'+f);
   assert.ok(Math.abs(r.dw/r.w-r.dh/r.h)<1e-10,'no stretching');assert.ok(r.dx>=-70&&r.dy>=-90&&r.dx+r.dw<=70&&r.dy+r.dh<=50,def.id+':tint:'+f);
   let pixels=0;for(let y=r.top;y<r.top+r.h;y++)for(let x=r.left;x<r.left+r.w;x++)if(im.alpha(x,y)>160)pixels++;
   assert.ok(pixels>5000,def.id+':empty:'+f);
  }
  const seen=new Uint8Array(im.width*im.height);
  for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++){
   const index=y*im.width+x;if(seen[index]||im.alpha(x,y)<=160)continue;
   const queue=[index];seen[index]=1;let l=x,r=x,t=y,b=y;
   for(let n=0;n<queue.length;n++){const yy=Math.floor(queue[n]/im.width),xx=queue[n]%im.width;l=Math.min(l,xx);r=Math.max(r,xx);t=Math.min(t,yy);b=Math.max(b,yy);
    for(const [nx,ny] of [[xx-1,yy],[xx+1,yy],[xx,yy-1],[xx,yy+1]]){if(nx<0||ny<0||nx>=im.width||ny>=im.height)continue;const i=ny*im.width+nx;if(!seen[i]&&im.alpha(nx,ny)>160){seen[i]=1;queue.push(i)}}
   }
   if(queue.length>=100)assert.ok(frames.some(([fl,ft,w,h])=>l>=fl&&r<fl+w&&t>=ft&&b<ft+h),`${def.id}: cut component ${[l,t,r,b]}`);
  }
 }
});
test('costume animation uses the existing attack/jump/hurt frame selection',()=>{
 const g=new Game();g.start();for(const c of COSTUMES){setCostume(c.id,null);g.p.dash=.2;assert.equal(heroFrame(g),12);g.p.dash=.1;assert.equal(heroFrame(g),13);g.p.dash=0;g.heroHurtUntil=g.elapsed+1;assert.equal(heroFrame(g),15);g.heroHurtUntil=0}setCostume('original',null);
});


