export const BARREL_RADIUS=105;
export function armBarrel(g,barrel){
 if(barrel.kind!=='barrel'||barrel.fuse!==undefined)return;
 barrel.fuse=.85;g.emit('toast',{text:'爆裂桶点燃！离开红圈，可引怪进入爆炸范围。'});
}
export function updateBarrels(g,dt){
 // Snapshot already lit barrels: a chain reaction gives the next barrel its own full warning.
 const lit=g.room.obstacles.filter(o=>o.kind==='barrel'&&o.fuse!==undefined);
 for(const barrel of lit){barrel.fuse-=dt;if(barrel.fuse>0)continue;
  g.room.obstacles=g.room.obstacles.filter(o=>o!==barrel);
  g.boom(barrel.x,barrel.y,BARREL_RADIUS,12);
 }
}
export function drawBarrel(ctx,o,floor){
 const names=['发酵奶桶','过载音箱','燃料货桶','废料爆桶','警戒电池'];
 if(o.fuse!==undefined){ctx.fillStyle='#d8543925';ctx.strokeStyle='#e27048';ctx.lineWidth=2;ctx.beginPath();ctx.arc(o.x,o.y,BARREL_RADIUS,0,Math.PI*2);ctx.fill();ctx.stroke();}
 ctx.fillStyle=o.fuse!==undefined?'#df8d5d':'#ac7054';ctx.strokeStyle='#5c4337';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(o.x-19,o.y-22,38,44,8);ctx.fill();ctx.stroke();
 ctx.fillStyle='#f5d98d';ctx.fillRect(o.x-17,o.y-13,34,6);ctx.fillRect(o.x-17,o.y+7,34,6);ctx.textAlign='center';ctx.font='bold 18px system-ui';ctx.fillStyle='#5c302b';ctx.fillText('!',o.x,o.y+6);ctx.font='10px system-ui';ctx.fillText(o.fuse!==undefined?Math.max(0,o.fuse).toFixed(1)+'秒':names[floor-1],o.x,o.y-29);
}
