import {drawHazards} from './hazard-art.js';
import {drawCraneGates} from './crane-gates.js';
import {pixelRing} from './pixel-art.js';
import {drawCatcherCombos} from './catcher-combos.js';
import {drawPuppetAttack} from './puppet.js';
import {drawFinalFight} from './final-boss.js';
import {drawMob,drawMobCues} from './mob-art.js';
import {drawScreech} from './screech.js';
import {hazardEnabled,beltVector} from './chapter-mechanics.js';
import {hazardPhase} from './combat-content.js';
import {THEMED_ENEMIES} from './chapter-content.js';
export {THEMED_ENEMIES};
export function drawThemedEnemy(ctx,e,t){
 if(drawMob(ctx,e))return;
 const stationary=['turret','milkspitter','soundTurret','dollTurret','warden'].includes(e.type),color=e.type==='milkleak'?'#e5d9b8':e.type==='soundTurret'||e.type==='beatling'?'#a595c2':e.type==='loader'?'#c6a06d':e.type==='warden'||e.type==='jailer'?'#ac7880':'#b8b1a2';
 ctx.save();ctx.translate(e.x,e.y);ctx.fillStyle='#33433730';ctx.beginPath();ctx.ellipse(0,e.r+4,e.r+5,7,0,0,7);ctx.fill();ctx.fillStyle=color;ctx.strokeStyle='#565044';ctx.lineWidth=2;
 ctx.beginPath();ctx.roundRect(-e.r,-e.r,e.r*2,e.r*2,stationary?4:12);ctx.fill();ctx.stroke();
 if(stationary){ctx.fillStyle='#534f49';ctx.fillRect(-e.r-4,e.r-4,e.r*2+8,8);ctx.fillStyle='#eee1bc';ctx.beginPath();ctx.arc(0,-3,10,0,7);ctx.fill();ctx.fillStyle='#4d4c4a';ctx.beginPath();ctx.arc(0,-3,5,0,7);ctx.fill()}
 else{ctx.fillStyle='#f5ebd2';ctx.fillRect(-12,-8,8,10);ctx.fillRect(4,-8,8,10);ctx.fillStyle='#45483d';ctx.fillRect(-9,-5,3,6);ctx.fillRect(7,-5,3,6)}
 if(e.type==='milkleak'||e.type==='milkspitter'){ctx.fillStyle='#fff5d5';ctx.fillRect(-6,-e.r-12,12,14);ctx.fillStyle='#c3936c';ctx.fillRect(-8,-e.r-14,16,5)}
 if(e.type==='stitchling'||e.type==='dollTurret'){ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(0,-e.r);ctx.lineTo(0,e.r);ctx.stroke();ctx.setLineDash([])}
 if(e.type==='warden'||e.type==='jailer'){ctx.fillStyle='#514b59';ctx.fillRect(-e.r-2,-e.r-4,e.r*2+4,7)}
 ctx.font='10px system-ui';ctx.textAlign='center';ctx.fillStyle='#394538';ctx.fillText(THEMED_ENEMIES[e.type],0,-e.r-19);ctx.restore();
}
function pool(ctx,x,y,radius,fill,edge,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=fill;for(let yy=-radius;yy<=radius;yy+=4){const half=Math.sqrt(Math.max(0,radius*radius-yy*yy));ctx.fillRect(Math.round((x-half)/2)*2,Math.round((y+yy)/2)*2,Math.round(half)*2,4)}pixelRing(ctx,x,y,radius,edge,3);for(let i=0;i<6;i++){const a=i*2.4,r=radius*(.25+i*.07);ctx.fillStyle='#ffffff55';ctx.fillRect(Math.round(x+Math.cos(a)*r),Math.round(y+Math.sin(a)*r),6,2)}ctx.restore()}
export function drawContent(ctx,g,t){
 drawMobCues(ctx,g);
 for(const e of g.room.enemies)if(e.type==='soundTurret')drawScreech(ctx,e);
 ctx.save();ctx.textAlign='center';ctx.font='11px system-ui';
 drawHazards(ctx,g,t);
 for(const e of g.room.enemies)if(!e.dead&&e.gunCast){const a=e.gunCast.aim;ctx.fillStyle='#e6b56b';for(let d=30;d<130;d+=12)ctx.fillRect(Math.round(e.x+Math.cos(a)*d),Math.round(e.y-9+Math.sin(a)*d),4,4);}

 for(const fx of g.effects){
  if(fx.type==='milkPool')pool(ctx,fx.x,fx.y,fx.radius,fx.friendly?'#a3e1ca9c':'#fff2d3ad',fx.friendly?'#519a82':'#b76f72',Math.min(1,fx.life/.8));
  if(fx.type==='handImpact')pool(ctx,fx.x,fx.y,fx.radius,'#c7a18866','#976350',fx.life/fx.max);
  if(fx.type==='dollPod'){
   pool(ctx,fx.x,fx.y,fx.radius,'#be8eaa30','#ae617c');ctx.fillStyle='#8b425c';ctx.fillText('怪物落点',fx.x,fx.y+fx.radius+15);
   const a=1-fx.life/fx.max,x=fx.sx+(fx.x-fx.sx)*a,y=fx.sy+(fx.y-fx.sy)*a-Math.sin(a*Math.PI)*100;ctx.fillStyle='#d4b193';ctx.strokeStyle='#805b59';ctx.beginPath();ctx.roundRect(x-17,y-18,34,36,8);ctx.fill();ctx.stroke();ctx.fillStyle='#514240';ctx.fillRect(x-9,y-7,5,6);ctx.fillRect(x+5,y-7,5,6);
  }
 }
 for(const e of g.room.enemies){if(e.dead||!e.hands)continue;const h=e.hands;if(h.cancelled||['sweep','cargo','gate'].includes(h.mode))continue;const offset=h.mode==='block'?110:55;
  if(h.mode==='smash'){ctx.fillStyle='#944e43';ctx.fillText('追击砸手 '+(h.wave+1)+'/'+h.total+' · 落点锁定后移动',h.x,h.y-80);for(const x of [h.x-55,h.x+55]){ctx.setLineDash(h.t<h.wind?[7,6]:[]);ctx.strokeStyle='#b76656';ctx.beginPath();ctx.arc(x,h.y,65,0,Math.PI*2);ctx.stroke();ctx.setLineDash([])}}
  for(const s of [-1,1]){const x=h.x+s*offset,y=h.y;ctx.strokeStyle='#b59972';ctx.lineWidth=14;ctx.beginPath();ctx.moveTo(e.x+s*40,e.y);ctx.quadraticCurveTo(e.x+s*110,y-70,x,y);ctx.stroke();
   ctx.fillStyle=h.t<h.wind?'#d49f6e55':'#d6b083';ctx.strokeStyle=h.t<h.wind?'#c56e58':'#866643';ctx.lineWidth=3;const w=h.mode==='block'?62:90,hh=h.mode==='block'?174:110;ctx.beginPath();ctx.roundRect(x-w/2,y-hh/2,w,hh,15);ctx.fill();ctx.stroke();ctx.fillStyle='#75533f';ctx.font='11px system-ui';ctx.fillText(h.t<h.wind?'即将落手':h.mode==='block'?'炸弹可击退':'砸！',x,y);}
 }
 drawCatcherCombos(ctx,g);drawCraneGates(ctx,g);drawPuppetAttack(ctx,g);drawFinalFight(ctx,g);ctx.restore();
}
