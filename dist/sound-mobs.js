export function beginBeat(g,e,source=null){
 e.beat={t:0,wind:.65,aim:Math.atan2(g.p.y-e.y,g.p.x-e.x),source};e.vx=0;e.vy=0;
}
export function conductSquad(g,conductor){
 let orders=0;
 for(const m of g.room.enemies.filter(m=>m!==conductor&&!m.dead&&m.type!=='boss'&&Math.hypot(m.x-conductor.x,m.y-conductor.y)<175)){
  m.rallied=2;m.rallyOwner=conductor;
  if(orders>=3||m.repelled>0)continue;
  if(m.type==='beatling'&&!m.beat){beginBeat(g,m,conductor);orders++}
  else if(['echoBell','soundTurret'].includes(m.type)&&!m.mobCast&&!m.screech){m.cd=Math.min(m.cd,.35);orders++}
 }
}
export function updateSoundMobs(g,dt){
 for(const e of g.room.enemies){
  if(e.rallyOwner?.dead){e.rallied=0;e.rallyOwner=null}
  if(e.type!=='beatling')continue;
  if(e.dead||e.repelled>0){e.beat=null;e.beatDelay=1.1;if(e.dead){e.vx=0;e.vy=0}continue}
  const s=e.beat;
  if(!s){e.beatDelay=(e.beatDelay??(.6+(e.t||0)%1))-dt;if(e.beatDelay<=0)beginBeat(g,e);continue}
  if(s.source?.dead&&s.t<s.wind){e.beat=null;e.beatDelay=1.1;continue}
  s.t+=dt;
  if(s.t>=s.wind&&s.t<s.wind+.3){e.vx=Math.cos(s.aim)*340;e.vy=Math.sin(s.aim)*340}
  else{e.vx=0;e.vy=0}
  if(s.t>=s.wind+.75){e.beat=null;e.beatDelay=e.rallied>0?.65:1.1}
 }
 for(const b of g.enemyBullets){
  if(!b.echoOwner)continue;
  if(b.echoOwner.dead||b.echoOwner.repelled>0){b.life=0;continue}
  b.echoAge=(b.echoAge||0)+dt;
  if(b.echoAge>=1.35&&b.echoAge<1.65){b.vx=0;b.vy=0;b.echoTurning=true}
  else if(b.echoAge>=1.65&&!b.echoReturned){b.vx=-b.echoVX;b.vy=-b.echoVY;b.echoReturned=true;b.echoTurning=false}
 }
}
export function drawSoundMobs(ctx,g){
 ctx.save();ctx.font='bold 11px system-ui';ctx.textAlign='center';
 for(const e of g.room.enemies){if(e.dead)continue;
  if(e.type==='beatling'&&e.beat){const s=e.beat;ctx.strokeStyle=s.source?'#b16ed0':'#9874b3';ctx.fillStyle='#755084';ctx.lineWidth=2;
   if(s.t<s.wind){ctx.setLineDash([7,6]);ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+Math.cos(s.aim)*130,e.y+Math.sin(s.aim)*130);ctx.stroke();ctx.setLineDash([]);ctx.fillText(s.source?'合拍冲刺 · 预警':'踩拍蓄势 · 侧移',e.x,e.y-44)}
   else if(s.t>=s.wind+.3)ctx.fillText('落拍 · 破绽',e.x,e.y-44);
  }
  if(e.type==='conductor'&&e.mobCast?.kind==='conduct'){
   ctx.strokeStyle='#b08bcd';ctx.lineWidth=2;ctx.setLineDash([4,6]);
   for(const m of g.room.enemies)if(m!==e&&!m.dead&&m.type!=='boss'&&Math.hypot(m.x-e.x,m.y-e.y)<175){ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(m.x,m.y);ctx.stroke()}
   ctx.setLineDash([]);
  }
 }
 for(const b of g.enemyBullets)if(b.echoOwner&&b.life>0){ctx.strokeStyle=b.echoReturned?'#f2cf8d':'#bd9bdf';ctx.lineWidth=b.echoTurning?3:1.5;ctx.beginPath();ctx.arc(b.x,b.y,b.r+(b.echoTurning?10:4),0,Math.PI*2);ctx.stroke();if(b.echoTurning){ctx.fillStyle='#815c91';ctx.fillText('返',b.x,b.y-17)}}
 ctx.restore();
}
