import {drawHero} from './hero-art.js';
import {drawGojo} from './gojo-art.js';
import {sandyActive} from './chrono-items.js';
const colors=['#b8ff3d','#52ff8d','#28e8dd','#3c9dff','#9872ff'];
export function drawChrono(c,g){
 const active=sandyActive(g),s=g.sandy;
 if(active){
  c.save();c.fillStyle='#063a483e';c.fillRect(47,47,866,506);c.fillStyle='#73ff6b17';c.fillRect(47,47,866,506);
  c.strokeStyle=s.age<.16?'#caff8e':'#61f2b0';c.lineWidth=s.age<.16?7:3;c.strokeRect(50,50,860,500);
  // Sparse static scanlines and edge circuits leave projectile silhouettes readable.
  c.fillStyle='#83ffcc16';for(let y=52;y<550;y+=8)c.fillRect(50,y,860,1);
  c.fillStyle='#5cffa9';for(let i=0;i<8;i++){const y=75+i*59;c.fillRect(53,y,12+i%3*6,3);c.fillRect(892-i%3*6,y,12+i%3*6,3)}
  c.globalAlpha=.2;drawHero(c,g,s.origin.x,s.origin.y,1,true,{frame:15,face:s.origin.face,tint:'#a2ffcf'});c.restore();
 }
 for(const p of g.sandyTrails||[]){c.save();c.globalAlpha=(1-p.age/.8)*.65;const index=Math.min(4,Math.floor(p.age/.16));drawHero(c,g,p.x,p.y,1,true,{frame:p.frame,face:p.face,tint:colors[index]});c.restore()}
 if(active){c.save();c.fillStyle='#102e39dc';c.fillRect(65,509,190,34);c.fillStyle='#b2ff5b';c.font='bold 12px monospace';c.textAlign='left';c.fillText((s.age<2?'超频 ×3 ':'斯安威斯坦 ')+(s.age<2?2-s.age:s.left).toFixed(1)+'s',73,524);c.fillStyle='#304f58';c.fillRect(73,532,170,4);c.fillStyle='#94ff58';c.fillRect(73,532,170*(s.age<2?(2-s.age)/2:s.left),4);c.restore()}
 drawGojo(c,g);
}
