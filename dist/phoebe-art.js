import {drawSprite} from './sprite-art.js';
const square=(c,x,y,size,color)=>{c.fillStyle=color;c.fillRect(Math.round(x/2)*2,Math.round(y/2)*2,size,size)};
function cable(c,points,active,width=5){
 for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/4));for(let j=0;j<=n;j++){const t=j/n,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;if(active)square(c,x-width,y-width,width*2,'#83deed25');square(c,x-3,y-3,6,'#29485d');square(c,x-1,y-1,2,active?'#c4f6ed':'#728d9e');}}
 for(const p of [points[0],points.at(-1)]){square(c,p.x-5,p.y-5,10,'#34475b');square(c,p.x-3,p.y-3,6,active?'#f6d276':'#82989c');}
}
export function drawPhoebe(c,g){
 c.save();for(const w of g.phoebeWires||[]){c.globalAlpha=Math.min(1,(w.until-g.elapsed)/.35);cable(c,w.points,true,w.width)}c.globalAlpha=1;
 if(g.phoebeTrace?.length>1)cable(c,g.phoebeTrace,false);
 const s=g.phoebe;if(s&&g.has('phoebe')){
  const frame=s.phase==='windup'?2:s.phase==='unroll'||s.phase==='recover'?3:s.moving?Math.floor(g.elapsed*8)%2:0;
  drawSprite(c,'phoebe-electrician-v1.png',frame,0,4,2,s.x,s.y,56,{flip:s.face<0});
  if(s.phase==='unroll'&&s.cable){const {from,to}=s.cable,t=Math.min(1,s.t/.4),p={x:from.x+(to.x-from.x)*t,y:from.y-24+(to.y-from.y+24)*t-Math.sin(t*Math.PI)*24};cable(c,[{x:from.x,y:from.y-24},p],false);}
 }
 for(const f of g.effects)if(f.type==='phoebeSoot'){drawSprite(c,'phoebe-electrician-v1.png',2,1,4,2,f.x,f.y-30-(1-f.life/f.max)*20,36,{alpha:f.life/f.max});}
 c.restore();
}
