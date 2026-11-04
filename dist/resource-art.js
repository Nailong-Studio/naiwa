import {roomNeighbors,suspiciousWalls} from './resource-scenes.js';
export function drawResources(ctx,g){ctx.save();ctx.textAlign='center';
 // Small stepped wall cracks and loose plaster are observable without buying intel.
 for(const d of suspiciousWalls(g)){
  ctx.save();ctx.translate(d.x,d.y);if(d.side==='left'||d.side==='right')ctx.rotate(Math.PI/2);
  ctx.fillStyle='#675c4c';for(const [x,y,w,h] of [[-10,-12,6,4],[-6,-8,4,10],[-2,-2,8,4],[4,2,4,9],[8,9,6,4]])ctx.fillRect(x,y,w,h);
  ctx.fillStyle='#dbcc9b';ctx.fillRect(-15,13,5,3);ctx.fillRect(13,-15,4,3);ctx.restore();
  if(Math.hypot(g.p.x-d.x,g.p.y-d.y)<105){ctx.fillStyle='#e9dfbd';ctx.fillRect(d.side==='left'?65:d.side==='right'?685:365,d.side==='top'?132:d.side==='bottom'?440:340,230,25);ctx.fillStyle='#625843';ctx.font='12px system-ui';ctx.fillText('墙灰松动了……也许值得检查',d.side==='left'?180:d.side==='right'?800:480,d.side==='top'?149:d.side==='bottom'?457:357)}
 }
 for(const d of roomNeighbors(g)){
  const r=g.rooms[d.id];if(r.hidden&&!r.revealed||!g.room.clear||!r.bombLocked&&!r.locked)continue;
  const vertical=d.side==='left'||d.side==='right',w=vertical?42:82,h=vertical?82:42;
  ctx.fillStyle=r.bombLocked?'#8b8477':'#cbb578';ctx.strokeStyle='#5b554c';ctx.lineWidth=3;ctx.fillRect(d.x-w/2,d.y-h/2,w,h);ctx.strokeRect(d.x-w/2,d.y-h/2,w,h);
  if(r.bombLocked){ctx.beginPath();ctx.moveTo(d.x-8,d.y-h/2+4);ctx.lineTo(d.x+7,d.y-7);ctx.lineTo(d.x-7,d.y+10);ctx.lineTo(d.x+6,d.y+h/2-4);ctx.stroke()}
  ctx.fillStyle='#fff1bd';ctx.font='bold 16px system-ui';ctx.fillText(r.bombLocked?'✹':'⚿',d.x,d.y+5);
  const x=d.side==='left'?112:d.side==='right'?848:480,y=d.side==='top'?92:d.side==='bottom'?520:255;
  ctx.fillStyle='#554d40';ctx.font='bold 12px system-ui';ctx.fillText(r.bombLocked?'B 炸墙 · 25% 空':r.type==='vault'?'1 钥匙 · 25% 空':'1 钥匙 · 道具房',x,y);
  if(r.type==='vault'||r.type==='cache'){ctx.fillStyle='#9b4f48';ctx.font='11px system-ui';ctx.fillText(r.type==='vault'?'4–6 名守卫伏击':'守卫 + 12 秒落物',x,y+15)}
 }
 if(g.room.type==='start'){
  ctx.fillStyle='#59745c';ctx.fillRect(360,225,240,60);ctx.fillStyle='#fff0bf';ctx.font='bold 18px system-ui';ctx.fillText('豆包的资源回收台',480,248);ctx.font='bold 15px system-ui';ctx.fillText('E · 钥匙 ⇄ 炸弹 / 换金币',480,272);
 }
 if(['vault','cache'].includes(g.room.type)){
  ctx.fillStyle=g.room.type==='vault'?'#b29a68':'#8a8f7d';ctx.fillRect(370,180,220,62);ctx.strokeStyle='#655b43';ctx.lineWidth=3;ctx.strokeRect(370,180,220,62);ctx.fillStyle='#fff2cf';ctx.font='bold 16px system-ui';ctx.fillText(g.room.type==='vault'?'钥匙补给库':'炸开的隐藏藏室',480,207);ctx.font='12px system-ui';ctx.fillText(!g.room.clear?(g.room.type==='vault'?'守卫伏击 · 25% 可能为空':'危险期 '+Math.ceil(g.room.dangerTime||0)+' 秒 · 清除守卫'):(g.room.resourceOutcome==='empty'?'空库 · 没有掉落':g.room.type==='vault'?'2 枚炸弹 + 3 金币':({coins:'藏着金币',tools:'藏着钥匙与炸弹',healing:'藏着回血补给',item:'发现一件道具'}[g.room.resourceOutcome]||'奖励尚未揭晓')),480,229);
 }
 ctx.restore();
}
