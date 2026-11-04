import {drawItemEffect} from './item-vfx.js';
import {drawSprite} from './sprite-art.js';
import {pixelRing} from './pixel-art.js';
const ink='#42384b',cream='#fff3c6';
const block=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x/2)*2,Math.round(y/2)*2,w,h)};
export function drawPickup(c,type,x,y){
 c.save();c.translate(Math.round(x),Math.round(y));
 if(type==='coin'){block(c,-8,-11,16,22,ink);block(c,-11,-8,22,16,ink);block(c,-7,-9,14,18,'#e9ad46');block(c,-9,-6,18,12,'#f7cf68');block(c,-3,-7,4,14,cream)}
 else if(type==='key'){block(c,-11,-10,15,14,ink);block(c,-8,-7,9,8,'#f6ce76');block(c,-5,-4,3,3,ink);block(c,0,0,14,5,ink);block(c,1,0,12,2,'#f6ce76');block(c,8,3,4,5,'#f6ce76')}
 else if(type==='heart'){const rows=['0110110','1111111','1111111','0111110','0011100','0001000'];for(let yy=0;yy<6;yy++)for(let xx=0;xx<7;xx++)if(rows[yy][xx]==='1')block(c,xx*4-14,yy*4-12,4,4,'#d56279');block(c,-8,-8,4,4,'#ffe3c1')}
 else if(type==='chest'){block(c,-15,-12,30,25,ink);block(c,-12,-9,24,19,'#c18b51');block(c,-12,-1,24,3,ink);block(c,-3,-3,6,9,'#ffe3a1')}
 else {block(c,-8,-9,16,20,ink);block(c,-11,-6,22,14,ink);block(c,-7,-6,14,14,'#68707e');block(c,-5,-5,4,4,'#c0d2cf');block(c,-2,-14,4,6,'#a77a4e');block(c,2,-18,4,4,'#ffca74')}
 c.restore();
}
function sparks(c,x,y,progress,radius,color,count=8){for(let i=0;i<count;i++){const a=i*Math.PI*2/count,dist=5+progress*radius;block(c,x+Math.cos(a)*dist-2,y+Math.sin(a)*dist-2,4,4,color)}}
export const FOREGROUND_EFFECTS=new Set(['echoPulse','ghostIdol','shrimpFeet','laugh','bombBlast','bossLaugh','voiceChain','petBlock','petCollect','petWave','petMuzzle','petImpact']);
export function drawPixelEffect(c,f){
 if(drawItemEffect(c,f))return true;
 if(!FOREGROUND_EFFECTS.has(f.type))return false;
 const progress=Math.max(0,Math.min(1,1-f.life/f.max)),radius=f.radius||190;
 c.save();c.globalAlpha*=Math.min(1,f.life/f.max*2);
 if(f.type==='ghostIdol'){
  drawSprite(c,'ghostbuddha-v1.png',0,0,1,1,f.x,f.y,65,{alpha:.8});
 }else if(f.type==='shrimpFeet'){
  pixelRing(c,f.x,f.y,f.radius||65,'#dcad68',2);for(const d of [-1,1]){block(c,f.x+d*12-4,f.y-5,8,14,'#f7c66f');for(let i=0;i<3;i++)block(c,f.x+d*12-6+i*4,f.y-10,3,4,cream)}
 }else if(f.type==='echoPulse'){
  pixelRing(c,f.x,f.y,radius*progress,ink,5);pixelRing(c,f.x,f.y,radius*progress,'#83cbe9',3);
  pixelRing(c,f.x,f.y,radius*Math.max(0,progress-.22),'#d5efff',3);sparks(c,f.x,f.y,progress,radius,'#abd4fb',8);
 }else if(f.type==='voiceChain'){
  const length=Math.hypot(f.tx-f.x,f.ty-f.y),steps=Math.max(1,Math.ceil(length/6));
  for(let i=0;i<=steps;i++){const p=i/steps,offset=i%2?3:-3;block(c,f.x+(f.tx-f.x)*p,f.y+(f.ty-f.y)*p+offset,4,4,'#efc563')}
 }else if(f.type==='laugh'||f.type==='bossLaugh'||f.type==='petWave'){
  const color=f.type==='bossLaugh'?'#d9768b':f.type==='petWave'?'#f1c75e':'#fff0aa';
  pixelRing(c,f.x,f.y,radius*progress,ink,5);pixelRing(c,f.x,f.y,radius*progress,color,3);
  if(progress>.2)pixelRing(c,f.x,f.y,radius*Math.max(0,progress-.18),color,3);
  sparks(c,f.x,f.y,progress,radius,color,12);
 }else if(f.type==='bombBlast'){
  pixelRing(c,f.x,f.y,radius*progress,'#9c555b',8);pixelRing(c,f.x,f.y,radius*progress,'#ffcd78',4);
  sparks(c,f.x,f.y,progress,radius,'#fff0b4',16);
  for(let i=0;i<6;i++){const a=i*2.4;block(c,f.x+Math.cos(a)*progress*radius*.7-6,f.y+Math.sin(a)*progress*radius*.7-6,12*(1-progress)+2,12*(1-progress)+2,'#bf857d')}
 }else if(f.type==='petBlock'){
  pixelRing(c,f.x,f.y,12+progress*12,'#aee2c4',4);sparks(c,f.x,f.y,progress,26,cream,6);
 }else if(f.type==='petCollect'){
  for(const d of [-1,1]){block(c,f.x+d*8-2,f.y-progress*25,4,12,'#ffe3a0');block(c,f.x+d*8-6,f.y+4-progress*25,12,4,'#ffe3a0')}
 }else {sparks(c,f.x,f.y,progress,f.radius||20,f.type==='petMuzzle'?'#ffe3a0':'#f5bf77');block(c,f.x-3,f.y-3,6,6,cream)}
 c.restore();return true;
}
