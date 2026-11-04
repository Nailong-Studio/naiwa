import {drawBarrel} from './environment-props.js';
const themes=[
 {crate:'#c6a477',edge:'#77583c',rock:'#9a9d86',pillar:'#858d7c',pit:'#384d4a',label:'奶箱'},
 {crate:'#a799ba',edge:'#665675',rock:'#93909e',pillar:'#626578',pit:'#343447',label:'音箱'},
 {crate:'#b5986e',edge:'#6c573b',rock:'#9f987f',pillar:'#74796c',pit:'#443f34',label:'货箱'},
 {crate:'#aaaabc',edge:'#68677d',rock:'#9b9ca8',pillar:'#707c8c',pit:'#343e4a',label:'零件'},
 {crate:'#b18a8b',edge:'#704d58',rock:'#9e9292',pillar:'#7c6872',pit:'#46313d',label:'封箱'}
];
export function drawTerrain(ctx,room,floor){
 const theme=themes[floor-1];ctx.save();
 for(const b of room.bridges||[]){ctx.fillStyle=theme.rock;ctx.fillRect(b.x-26,b.y-26,52,52);ctx.strokeStyle=theme.edge;ctx.lineWidth=2;for(let i=-18;i<=18;i+=12){ctx.beginPath();ctx.moveTo(b.x-22,b.y+i);ctx.lineTo(b.x+22,b.y+i+5);ctx.stroke()}}
 for(const o of room.obstacles){if(o.kind!=='pit')continue;
  const neighbor=(dx,dy)=>room.obstacles.some(p=>p.kind==='pit'&&p.x===o.x+dx&&p.y===o.y+dy);
  ctx.fillStyle='#182728';ctx.fillRect(o.x-26,o.y-26,52,52);
  ctx.fillStyle=theme.pit;ctx.fillRect(o.x-26,o.y-14,52,31);
  ctx.strokeStyle='#c2bda0';ctx.lineWidth=3;ctx.beginPath();
  if(!neighbor(0,-52)){ctx.moveTo(o.x-26,o.y-26);ctx.lineTo(o.x+26,o.y-26)}
  if(!neighbor(0,52)){ctx.moveTo(o.x-26,o.y+26);ctx.lineTo(o.x+26,o.y+26)}
  if(!neighbor(-52,0)){ctx.moveTo(o.x-26,o.y-26);ctx.lineTo(o.x-26,o.y+26)}
  if(!neighbor(52,0)){ctx.moveTo(o.x+26,o.y-26);ctx.lineTo(o.x+26,o.y+26)}
  ctx.stroke();ctx.strokeStyle='#131d2555';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(o.x-10,o.y+4);ctx.lineTo(o.x+10,o.y+4);ctx.stroke();
 }
 for(const o of room.obstacles){if(o.kind==='pit'||o.kind==='hand'||o.wardrobe)continue;const w=o.w||o.r*2,h=o.h||o.r*2,x=o.x-w/2,y=o.y-h/2;
  if(o.kind==='barrel'){drawBarrel(ctx,o,floor);continue}
  if(o.device){
   ctx.fillStyle=o.disabled>0?'#777d78':o.kind==='milkValve'?'#ecdfb0':o.kind==='assembler'?'#b79a7f':'#a18ab9';ctx.strokeStyle='#51485b';ctx.lineWidth=3;ctx.beginPath();ctx.rect(x,y,w,h);ctx.fill();ctx.stroke();
   ctx.fillStyle='#423d47';ctx.fillRect(x+6,y+7,w-12,h-14);ctx.fillStyle=o.disabled>0?'#8c9690':o.kind==='assembler'&&o.timer<.9?'#f2a07f':'#e6d59e';ctx.beginPath();ctx.arc(o.x,o.y,9,0,7);ctx.fill();
   ctx.textAlign='center';ctx.font='bold 11px system-ui';ctx.fillStyle='#56415b';const name={milkValve:'奶阀',resonator:'共振器',assembler:'造怪口',relay:'供电柱'}[o.kind];ctx.fillText(o.disabled>0?name+' · 停 '+Math.ceil(o.disabled)+'秒':name+(o.kind==='assembler'?' '+o.spawned+'/3':''),o.x,y-9);
   ctx.fillStyle='#625c6b';ctx.fillRect(x,y+h+6,w,4);ctx.fillStyle='#e9c681';ctx.fillRect(x,y+h+6,w*Math.max(0,o.hp/o.maxHp),4);continue;
  }
  ctx.fillStyle='#28393230';ctx.fillRect(x+4,y+9,w,h);
  ctx.fillStyle=o.kind==='crate'?theme.crate:o.kind==='pillar'?theme.pillar:theme.rock;
  ctx.strokeStyle=theme.edge;ctx.lineWidth=2;ctx.beginPath();ctx.rect(x,y,w,h);ctx.fill();ctx.stroke();
  ctx.fillStyle='#ffffff18';ctx.fillRect(x+3,y+3,w-6,7);
  if(o.kind==='crate'){
   ctx.strokeStyle=theme.edge;ctx.lineWidth=3;ctx.strokeRect(x+5,y+5,w-10,h-10);for(let n=6;n<w-6;n+=4){ctx.fillStyle=theme.edge;ctx.fillRect(x+n,y+h-n-4,4,4)}
   ctx.fillStyle='#f5e9c7';ctx.fillRect(o.x-12,o.y-9,24,17);ctx.fillStyle=theme.edge;ctx.textAlign='center';ctx.font='9px system-ui';ctx.fillText(theme.label,o.x,o.y+3);
   if(o.hp<3){ctx.strokeStyle='#573b36';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(o.x-3,y+3);ctx.lineTo(o.x+4,o.y-5);ctx.lineTo(o.x-4,o.y+7);ctx.lineTo(o.x+2,y+h-2);ctx.stroke()}
  }else if(o.kind==='pillar'){
   ctx.strokeStyle='#e7e7dc45';ctx.strokeRect(x+7,y+7,w-14,h-14);ctx.fillStyle='#e3dcc0';for(const dx of [-14,14])for(const dy of [-14,14]){ctx.beginPath();ctx.arc(o.x+dx,o.y+dy,2,0,Math.PI*2);ctx.fill()}
  }else{
   ctx.strokeStyle='#525947';ctx.beginPath();ctx.moveTo(o.x-5,y+4);ctx.lineTo(o.x+3,o.y-4);ctx.lineTo(o.x-4,o.y+6);ctx.lineTo(o.x+10,y+h-6);ctx.stroke();
   if(o.bridgeTo){ctx.fillStyle='#f5df99';ctx.textAlign='center';ctx.font='bold 21px system-ui';ctx.fillText(o.bridgeTo.y>o.y?'↓':'↑',o.x,o.y+8);ctx.font='10px system-ui';ctx.fillText('桥石',o.x,y-5)}
   if(o.stash){ctx.strokeStyle='#7ae2eb';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x+8,y+8);ctx.lineTo(o.x+4,o.y-2);ctx.lineTo(x+w-7,y+7);ctx.moveTo(o.x+4,o.y-2);ctx.lineTo(o.x-2,y+h-6);ctx.stroke();ctx.fillStyle='#b7f4ec';ctx.textAlign='center';ctx.font='bold 10px system-ui';ctx.fillText('藏',o.x,y+h-7)}
  }
 }
 ctx.restore();
}
