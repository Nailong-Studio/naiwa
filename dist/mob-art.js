import {drawSoundMobs} from './sound-mobs.js';
import {CHAPTER_MOBS} from './mob-catalog.js';
export function drawMob(ctx,e){const d=CHAPTER_MOBS[e.type];if(!d)return false;
 ctx.save();ctx.translate(e.x,e.y);ctx.fillStyle='#34443830';ctx.beginPath();ctx.ellipse(0,22,26,7,0,0,7);ctx.fill();ctx.strokeStyle='#574e4d';ctx.fillStyle=e.mobCast?'#f3cb88':d.color;ctx.lineWidth=2;
 ctx.beginPath();
 if(e.type==='beatling'){ctx.roundRect(-24,-18,48,38,5)}
 else if(e.type==='curdling'){ctx.ellipse(0,0,24,21,0,0,7)}
 else if(e.type==='prismEye'){ctx.moveTo(0,-25);ctx.lineTo(25,0);ctx.lineTo(0,25);ctx.lineTo(-25,0);ctx.closePath()}
 else if(e.type==='echoBell'){ctx.moveTo(-22,17);ctx.quadraticCurveTo(-13,5,-15,-8);ctx.quadraticCurveTo(0,-32,15,-8);ctx.quadraticCurveTo(13,5,22,17);ctx.closePath()}
 else ctx.roundRect(-21,-21,42,42,e.type==='forklift'?3:9);
 ctx.fill();ctx.stroke();
 ctx.fillStyle='#f7ebd0';ctx.fillRect(-12,-9,8,9);ctx.fillRect(4,-9,8,9);ctx.fillStyle='#453f40';ctx.fillRect(-9,-6,3,5);ctx.fillRect(7,-6,3,5);
 ctx.strokeStyle='#4f4945';ctx.lineWidth=3;
 if(e.type==='forklift'){for(const s of [-1,1]){ctx.fillRect(s*25-4,-16,8,29);ctx.beginPath();ctx.moveTo(s*10,15);ctx.lineTo(s*10,34);ctx.stroke()}}
 if(e.type==='milkSkater'){for(const s of [-1,1]){ctx.beginPath();ctx.ellipse(s*15,24,13,4,-.2,0,7);ctx.fill()}}
 if(e.type==='beatling'){ctx.strokeStyle='#eed6ab';for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(side*22,-10);ctx.lineTo(side*10,18);ctx.stroke()}ctx.strokeStyle='#574e4d';ctx.beginPath();ctx.moveTo(-26,-18);ctx.lineTo(-8,-32);ctx.moveTo(26,-18);ctx.lineTo(8,-32);ctx.stroke()}
 if(e.type==='conductor'){ctx.beginPath();ctx.moveTo(17,6);ctx.lineTo(36,-24);ctx.stroke();ctx.fillRect(-22,-26,44,6)}
 if(e.type==='parcelThrower'){ctx.fillStyle='#edcd8d';ctx.fillRect(-16,10,32,20);ctx.strokeRect(-16,10,32,20);ctx.beginPath();ctx.moveTo(0,10);ctx.lineTo(0,30);ctx.stroke()}
 if(e.type==='stitchMedic'){ctx.fillStyle='#f5e5d5';ctx.fillRect(-16,-28,32,10);ctx.fillStyle='#b85e66';ctx.fillRect(-3,-28,6,10);ctx.fillRect(-7,-25,14,4)}
 if(e.type==='scrapMine'){ctx.beginPath();ctx.moveTo(0,-21);ctx.lineTo(8,-33);ctx.stroke();ctx.fillStyle='#da6756';ctx.beginPath();ctx.arc(9,-33,4,0,7);ctx.fill()}
 if(e.type==='lockSentry'){ctx.beginPath();ctx.arc(0,15,9,Math.PI,0);ctx.stroke();ctx.fillRect(-11,14,22,12)}
 ctx.fillStyle='#51423e';ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.fillText(d.mark,0,13);ctx.font='10px system-ui';ctx.fillText(d.name,0,-39);
 if(e.rallied>0){ctx.strokeStyle='#b38be8';ctx.beginPath();ctx.arc(0,0,29,0,7);ctx.stroke()}
 ctx.restore();return true;
}
export function drawMobCues(ctx,g){drawSoundMobs(ctx,g);ctx.save();ctx.font='11px system-ui';ctx.textAlign='center';ctx.lineWidth=2;
 for(const e of g.room.enemies){if(e.dead||!e.mobCast)continue;const c=e.mobCast;ctx.strokeStyle='#b36369';ctx.fillStyle='#e8a56824';ctx.setLineDash([6,6]);
  if(['rush','echo','cross'].includes(c.kind)){const count=c.kind==='cross'?4:1;for(let i=0;i<count;i++){const a=c.aim+i*Math.PI/2,l=c.kind==='rush'?220:320;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+Math.cos(a)*l,e.y+Math.sin(a)*l);ctx.stroke()}}
  else if(c.kind==='mend'){ctx.strokeStyle='#5a9a7c';ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(c.target.x,c.target.y);ctx.stroke()}
  else{ctx.beginPath();ctx.arc(e.x,e.y,c.kind==='conduct'?175:85,0,7);ctx.fill();ctx.stroke()}
  ctx.setLineDash([]);ctx.fillStyle='#8f4953';ctx.fillText({rush:'冲锋锁定',echo:'回声三连 · 小心折返',cross:'十字预警',mend:'正在缝补',conduct:'合奏预备 · 优先打断',detonate:'即将自爆'}[c.kind],e.x,e.y-50);
 }
 for(const f of g.effects){
  if(f.type==='mobHeal'){ctx.fillStyle='#41946b';ctx.font='bold 18px system-ui';ctx.fillText('+2',f.x,f.y-25-(1-f.life/f.max)*18)}
  if(f.type!=='mobZone')continue;const active=f.max-f.life>=f.wind;ctx.fillStyle=active?'#e4917777':'#e4ba862b';ctx.strokeStyle=f.kind==='electric'?'#9571b1':'#b58365';ctx.setLineDash(active?[]:[5,5]);ctx.beginPath();ctx.arc(f.x,f.y,f.radius,0,7);ctx.fill();ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#735056';ctx.font='11px system-ui';ctx.fillText({curd:'奶团将溅开',parcel:'包裹落点',electric:active?'通电':'电网预警'}[f.kind],f.x,f.y+5);
  if(f.kind==='parcel'){const p=Math.min(1,(f.max-f.life)/f.wind),x=(f.owner?.x??f.sx)+(f.x-(f.owner?.x??f.sx))*p,y=(f.owner?.y??f.sy)+(f.y-(f.owner?.y??f.sy))*p-Math.sin(p*Math.PI)*90;ctx.fillStyle='#c9a077';ctx.fillRect(x-12,y-12,24,24);ctx.strokeRect(x-12,y-12,24,24)}
 }
 ctx.restore();
}
