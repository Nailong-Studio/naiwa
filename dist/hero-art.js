import {atlasRegion} from './atlas-regions.js';
import {loadArt} from './asset-url.js';
import {selectedCostume,costumeById,costumeImage} from './costumes.js';
import {COSTUME_REGIONS} from './costume-regions.js';
const sheet=typeof Image==='undefined'?null:new Image();
if(sheet)loadArt(sheet,'naiwa-pixel-v2.png');
const tinted=new Map();
export function heroFrame(g){
 if(g.sandy?.left>0)return g.p.dash>0?13:(g.heroMoving?4+Math.floor((g.actionClock||0)*12)%4:8+Math.floor((g.actionClock||0)*12)%4);
 const p=g.p,t=g.elapsed;
 if((g.heroHurtUntil||0)>t)return 15;
 if(p.dash>0)return p.dash>.17?12:13;
 if((g.heroLandUntil||0)>t)return 14;
 if((g.heroLaughUntil||0)>t)return 8+Math.floor(t*12)%4;
 if(g.heroMoving)return 4+Math.floor(t*10)%4;
 return Math.floor(t*3)%4;
}
export function drawHero(c,g,x,y,size=1,ghost=false,style={}){
 const id=style.costumeId??selectedCostume(),costume=costumeById(id),candidate=id==='original'?sheet:costumeImage(id);
 const active=candidate?.complete&&candidate.naturalWidth?candidate:sheet;
 if(!active?.complete||!active.naturalWidth)return false;
 const file=active===sheet?'naiwa-pixel-v2.png':costume.file;
 const frame=style.frame??heroFrame(g),r=heroDrawRect(active,frame,file);
 c.save();c.translate(Math.round(x),Math.round(y));c.scale(size,size);
 if(!ghost){c.fillStyle='#25343c35';c.fillRect(-19,19,38,6)}
 if((style.face??g.p.face)>0)c.scale(-1,1);
 c.imageSmoothingEnabled=false;
 if(style.tint){const key=file+frame+style.tint;let tile=tinted.get(key);if(!tile){if(tinted.size>=160)tinted.clear();tile=document.createElement('canvas');tile.width=tile.height=140;const tc=tile.getContext('2d');tc.imageSmoothingEnabled=false;tc.drawImage(active,r.left,r.top,r.w,r.h,r.dx+70,r.dy+90,r.dw,r.dh);tc.globalCompositeOperation='source-in';tc.fillStyle=style.tint;tc.fillRect(0,0,140,140);tinted.set(key,tile)}c.drawImage(tile,-70,-90,140,140)}
 else c.drawImage(active,r.left,r.top,r.w,r.h,r.dx,r.dy,r.dw,r.dh);
 c.restore();return true;
}

// Keep the original scale and anchor while allowing poses to extend beyond nominal cells.
export function heroDrawRect(image,frame,file='naiwa-pixel-v2.png'){
 const col=frame%4,row=Math.floor(frame/4),cw=image.naturalWidth/4,ch=image.naturalHeight/4;
 if(COSTUME_REGIONS[file]){
  const [left,top,w,h]=COSTUME_REGIONS[file][frame],scale=90/ch;
  return {left,top,w,h,dx:(left-(col+.5)*cw)*scale,dy:(top-(row+1)*ch)*scale+25,dw:w*scale,dh:h*scale};
 }
 const r=atlasRegion(file,4,4,row,col,image.naturalWidth,image.naturalHeight);
 return {...r,dx:-45+(r.left-col*cw)*90/cw,dy:-65+(r.top-row*ch)*90/ch,dw:r.w*90/cw,dh:r.h*90/ch};
}

