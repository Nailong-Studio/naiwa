import {drawPickup} from './pixel-effects.js';
import {drawFollowers} from './followers.js';
import {drawResources} from './resource-art.js';
import {drawContent} from './content-art.js';
import {drawSpeakerAttack} from './speaker.js';
export function drawRunner(ctx,e,t){
 const stride=Math.sin(t*22)*8;ctx.save();ctx.translate(e.x,e.y);ctx.fillStyle='#593d352c';ctx.beginPath();ctx.ellipse(0,19,23,7,0,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle='#784b3c';ctx.lineWidth=5;for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(s*8,10);ctx.lineTo(s*12+stride*s,24);ctx.stroke()}
 ctx.fillStyle='#d99a6e';ctx.strokeStyle='#714a37';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,-1,17,19,0,0,Math.PI*2);ctx.fill();ctx.stroke();
 for(const s of [-1,1]){ctx.beginPath();ctx.arc(s*13,-19,8,0,Math.PI*2);ctx.fill();ctx.stroke()}
 ctx.fillStyle='#ce514e';ctx.fillRect(-18,4,36,7);ctx.beginPath();ctx.moveTo(-16,5);ctx.lineTo(-35,-2+stride*.4);ctx.lineTo(-30,10);ctx.closePath();ctx.fill();
 ctx.fillStyle='#fff0cc';ctx.fillRect(-11,-10,8,9);ctx.fillRect(3,-10,8,9);ctx.fillStyle='#48382f';ctx.fillRect(-7,-7,3,5);ctx.fillRect(5,-7,3,5);
 ctx.strokeStyle='#d26b54';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-30,-12);ctx.lineTo(-44,-12);ctx.moveTo(-30,-6);ctx.lineTo(-39,-6);ctx.stroke();ctx.restore();
}
export function drawCampaign(ctx,g,t){const p=g.p;
 ctx.save();ctx.textAlign='center';drawContent(ctx,g,t);drawResources(ctx,g);
 for(const e of g.room.enemies||[])if(e.kind==='speaker')drawSpeakerAttack(ctx,e);
 for(const fx of g.effects){
  if(fx.type!=='milkBottle'&&fx.type!=='milkSplash')continue;
  const flight=fx.type==='milkBottle',progress=1-fx.life/fx.max;
  ctx.save();ctx.beginPath();ctx.arc(fx.x,fx.y,fx.radius,0,Math.PI*2);
  ctx.fillStyle=flight?'#eb875c35':'#fff1c9cc';ctx.fill();ctx.strokeStyle=flight?'#bd573d':'#d6a96a';ctx.lineWidth=3;ctx.stroke();
  if(flight){
   ctx.beginPath();ctx.arc(fx.x,fx.y,fx.radius,-Math.PI/2,-Math.PI/2+Math.PI*2*progress);ctx.strokeStyle='#fff3c0';ctx.lineWidth=5;ctx.stroke();
   ctx.font='bold 13px system-ui';ctx.fillStyle='#93432f';ctx.fillText('奶瓶落点 · 快躲开',fx.x,fx.y+fx.radius+19);
   const bx=fx.sx+(fx.x-fx.sx)*progress,by=fx.sy+(fx.y-fx.sy)*progress-Math.sin(progress*Math.PI)*100;
   ctx.translate(bx,by);ctx.rotate(progress*Math.PI*2);ctx.fillStyle='#fff9e5';ctx.strokeStyle='#906848';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(-11,-16,22,34,6);ctx.fill();ctx.stroke();ctx.fillStyle='#e49d69';ctx.fillRect(-7,-23,14,8);ctx.fillStyle='#cfb98a';ctx.fillRect(-7,-3,14,3);
  }else{
   ctx.globalAlpha=Math.max(0,1-progress);ctx.strokeStyle='#fff9e8';ctx.lineWidth=7;ctx.beginPath();ctx.arc(fx.x,fx.y,fx.radius*(.65+progress*.35),0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();
 }
 for(const fx of g.effects)if(fx.type==='trap'){ctx.beginPath();ctx.arc(fx.x,fx.y,60,0,Math.PI*2);ctx.fillStyle=fx.life<.3?'#ef4c5399':'#ef4c532a';ctx.fill();ctx.strokeStyle='#a83844';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#932f3b';ctx.fillText(fx.life<.3?'夹！':'快躲开',fx.x,fx.y);}
 for(const e of g.room.enemies||[]){if(e.dead)continue;if(e.muted){ctx.beginPath();ctx.arc(e.x,e.y,85,0,Math.PI*2);ctx.strokeStyle='#a9a5cb';ctx.lineWidth=6;ctx.stroke();ctx.fillStyle='#eee3ff';ctx.fillText('吸收笑声',e.x,e.y-100)}}
 ctx.textAlign='center';ctx.font='bold 16px system-ui';
 for(const l of g.room.loot){drawPickup(ctx,l.type,l.x,l.y);ctx.fillStyle='#56435b';ctx.font='bold 14px system-ui';ctx.fillText(l.type==='chest'?'E · 1 钥匙':l.amount>1?'×'+l.amount:'',l.x,l.y+25)}
 if(g.room.type==='shop'){ctx.fillStyle='#46614b';ctx.fillRect(350,220,260,65);ctx.fillStyle='#fff4d2';ctx.font='bold 18px system-ui';ctx.fillText('豆包的补给柜台',480,247);ctx.font='bold 15px system-ui';ctx.fillText('E · 查看商品与服务',480,271)}
 if(g.room.pendingItem){ctx.fillStyle='#f9e28c';ctx.fillText('✦ 道具留在这里 · E 拿取',480,345)}
 for(const b of g.explosives){drawPickup(ctx,'bomb',b.x,b.y);ctx.fillStyle=b.t<.5?'#c24e67':'#594854';ctx.fillText(b.t.toFixed(1),b.x,b.y-23)}
 for(const e of g.room.enemies||[])if(!e.dead&&e.wind>0){ctx.setLineDash([8,9]);ctx.strokeStyle='#be594e';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+(e.dx||1)*300,e.y+(e.dy||0)*300);ctx.stroke();ctx.setLineDash([])}
 drawFollowers(ctx,g);
 ctx.restore();}
export function drawBoss(ctx,e,t){ctx.save();ctx.translate(e.x,e.y-(e.airborne?Math.sin(Math.min(1,(e.sound?.t||0)/.8)*Math.PI)*130:0));ctx.fillStyle='#36433235';ctx.beginPath();ctx.ellipse(0,40,55,13,0,0,7);ctx.fill();ctx.strokeStyle='#454b35';ctx.lineWidth=3;ctx.fillStyle=e.kind==='speaker'?'#5d6c67':e.kind==='puppet'?'#dbb58c':'#dbbf67';ctx.beginPath();ctx.roundRect(-42,-43,84,83,18);ctx.fill();ctx.stroke();ctx.fillStyle='#354831';
 if(e.kind==='speaker'){for(const y of [-18,20]){ctx.beginPath();ctx.arc(0,y,19,0,7);ctx.fill();ctx.strokeStyle='#b4c697';ctx.stroke()}}
 else{ctx.fillRect(-20,-18,9,10);ctx.fillRect(12,-18,9,10);ctx.beginPath();ctx.arc(0,6,20,0,Math.PI);ctx.fill();}
 if(e.kind==='bull'){ctx.strokeStyle='#f0e1b5';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(-28,-39);ctx.lineTo(-53,-58);ctx.lineTo(-53,-73);ctx.moveTo(28,-39);ctx.lineTo(53,-58);ctx.lineTo(53,-73);ctx.stroke();ctx.fillStyle='#b89459';ctx.beginPath();ctx.ellipse(0,7,28,17,0,0,7);ctx.fill();ctx.fillStyle='#3e4734';ctx.fillRect(-12,3,7,6);ctx.fillRect(7,3,7,6)}
 if(e.kind==='meishu'){ctx.fillStyle='#dfb653';for(const s of [-1,1]){ctx.beginPath();ctx.ellipse(s*31,-66,14,34,s*.2,0,7);ctx.fill();ctx.stroke()}ctx.fillStyle='#394f45';ctx.fillRect(-32,-22,64,15)}
 if(e.kind==='collector'){ctx.fillStyle='#55655c';ctx.fillRect(-59,25,118,24);for(const x of [-43,43]){ctx.beginPath();ctx.arc(x,49,13,0,7);ctx.fill()}ctx.fillStyle='#f4e9ba';ctx.fillRect(-9,-75,18,29)}
 if(e.kind==='catcher'){ctx.strokeStyle='#bda76b';ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(-40,0);ctx.lineTo(-83,44);ctx.lineTo(-95,10);ctx.moveTo(40,0);ctx.lineTo(83,44);ctx.lineTo(95,10);ctx.stroke()}
 if(e.kind==='puppet'){ctx.strokeStyle='#786a58';ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(0,-43);ctx.lineTo(0,40);ctx.stroke();ctx.setLineDash([])}
 ctx.textAlign='center';ctx.fillStyle='#faf1ca';ctx.font='bold 12px system-ui';ctx.fillText(({collector:'奶瓶收缴员',speaker:'静音箱',catcher:'套索长臂怪',puppet:'拼装奶偶',bull:'牛来',meishu:'美鼠'})[e.kind]||'Boss',0,-90);ctx.restore()}
