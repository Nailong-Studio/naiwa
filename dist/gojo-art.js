import {drawSprite} from './sprite-art.js';
import {pixelRing} from './pixel-art.js';
import {GOJO} from './gojo-fusion.js';
const block=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x/2)*2,Math.round(y/2)*2,w,h)};
function orb(c,p,color,label,t){
 const r=12+Math.sin(t*12)*2;pixelRing(c,p.x,p.y,r+5,'#34263f',4);pixelRing(c,p.x,p.y,r,color,5);
 block(c,p.x-7,p.y-7,14,14,color);block(c,p.x-3,p.y-5,6,8,'#fff3f1');
 for(let i=0;i<5;i++){const a=t*3+i*Math.PI*2/5;block(c,p.x+Math.cos(a)*(r+8)-2,p.y+Math.sin(a)*(r+8)-2,4,4,color)}
 c.font='bold 20px system-ui';c.textAlign='center';c.strokeStyle='#2d2538';c.lineWidth=3;c.strokeText(label,p.x,p.y-25);c.fillStyle='#fff4dd';c.fillText(label,p.x,p.y-25);
}
export function drawGojo(c,g){
 const s=g.gojo;if(!s||s.version!==2)return;c.save();const t=g.actionClock||0;
 const casting=s.phase==='redHold'||s.phase==='blueFlight',alpha=Math.min(1,s.left/.3);
 drawSprite(c,'gojo-manga-actions-v2.png',casting?1:0,0,4,1,s.x,s.y,68,{flip:s.face<0,alpha});
 if(s.feet)drawSprite(c,'gojo-manga-actions-v2.png',s.phase==='redWindup'||s.phase==='redFlight'?3:2,0,4,1,s.feet.x,s.feet.y,36,{flip:s.feet.face<0,alpha});
 if(s.red)orb(c,s.red,'#fa617a','赫',t);
 if(s.blue)orb(c,s.blue,'#5ed5ff','苍',t);
 if(s.purple){
  const p=s.purple,progress=Math.min(1,p.t/GOJO.warning);
  // Static outer edge is the damage boundary. The inner ring counts down.
  c.globalAlpha=.1+progress*.12;c.fillStyle='#b27ef5';c.beginPath();c.arc(p.x,p.y,GOJO.radius,0,Math.PI*2);c.fill();c.globalAlpha=1;
  pixelRing(c,p.x,p.y,GOJO.radius,'#4d294e',10);pixelRing(c,p.x,p.y,GOJO.radius,'#e7b0ff',6);pixelRing(c,p.x,p.y,GOJO.radius*(1-progress),'#c87bff',3);
  orb(c,p,'#bb77fa','茈',t);
  const labelX=Math.max(230,Math.min(730,p.x)),labelY=p.y>475?p.y-45:p.y+44;
  c.font='bold 20px system-ui';c.textAlign='center';c.strokeStyle='#382039';c.lineWidth=3;c.strokeText('即将爆炸 · 会伤到自己',labelX,labelY);c.fillStyle='#fff2b9';c.fillText('即将爆炸 · 会伤到自己',labelX,labelY);
 }
 c.restore();
}
