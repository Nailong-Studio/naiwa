const names={ring:'环形音波',fan:'扇形连发',bass:'低音震荡',slam:'高空跳砸'};
const colors={ring:'#66c9bf',fan:'#b38be8',bass:'#ef9474',slam:'#ee847e'};

export function startSpeakerAttack(g,e){
 if(e.dead)return;
 const rage=e.hp<e.maxHp*.5,order=rage?['ring','fan','bass','slam']:['ring','fan','bass'];
 const kind=order[(e.soundCycle||0)%order.length];
 e.soundCycle=(e.soundCycle||0)+1;
 const wind=kind==='slam'?.8:kind==='bass'?.9:kind==='fan'?.7:.65;
 const volleys=kind==='ring'?(rage?2:1):kind==='fan'?(rage?4:3):0;
 const duration=kind==='slam'?1.4:kind==='bass'?wind+1.45:wind+Math.max(0,volleys-1)*.3+.2;
 e.sound={kind,rage,wind,volleys,duration,t:0,fired:0,x:e.x,y:e.y,aim:Math.atan2(g.p.y-e.y,g.p.x-e.x),hit:false};
 if(kind==='slam'){e.airborne=true;e.sound.targetX=Math.max(120,Math.min(840,g.p.x));e.sound.targetY=Math.max(120,Math.min(480,g.p.y))}
 e.cd=duration+(rage?.32:.4);e.vx=0;e.vy=0;
 g.emit('bossSound',{kind});
}

function fireVolley(g,s){
 const count=s.kind==='ring'?(s.rage?14:10):(s.rage?7:5),speed=s.kind==='ring'?200:255;
 for(let i=0;i<count;i++){
  const angle=s.kind==='ring'?s.aim+(i+.5+s.fired*.5)*Math.PI*2/count:s.aim+(i-(count-1)/2)*.21;
  g.enemyBullets.push({x:s.x+Math.cos(angle)*58,y:s.y+Math.sin(angle)*58,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:8,life:5,sound:s.kind});
 }
}

export function updateSpeaker(g,e,dt){
 const s=e.sound;e.muted=false;
 if(e.dead){e.sound=null;e.airborne=false;return}
 if(!s)return;
 const previous=s.t;s.t+=dt;
 e.muted=s.kind==='ring'&&s.t<s.wind;
 if(e.muted)g.bullets=g.bullets.filter(b=>Math.hypot(b.x-e.x,b.y-e.y)>85);
 if(s.kind==='slam'){
  if(s.t>=s.wind&&!s.landed){s.landed=true;e.airborne=false;e.x=s.targetX;e.y=s.targetY;
   if(Math.hypot(g.p.x-e.x,g.p.y-e.y)<85+g.p.r)g.hurt();
   for(let i=0;i<22;i++){const a=(i+.5)*Math.PI*2/22;g.enemyBullets.push({x:e.x+Math.cos(a)*58,y:e.y+Math.sin(a)*58,vx:Math.cos(a)*190,vy:Math.sin(a)*190,r:7,life:5,sound:'fan'})}
  }
 }else if(s.kind==='bass'){
  if(s.t>=s.wind){
   const min=70+Math.max(0,previous-s.wind)/1.45*330;
   const max=70+Math.min(1,(s.t-s.wind)/1.45)*330;
   const distance=Math.hypot(g.p.x-s.x,g.p.y-s.y),margin=g.p.r+9;
   if(!s.hit&&distance>=min-margin&&distance<=max+margin){g.hurt();s.hit=true}
  }
 }else{
  while(s.fired<s.volleys&&s.t>=s.wind+s.fired*.3){fireVolley(g,s);s.fired++}
 }
 if(s.t>=s.duration){e.sound=null;e.muted=false;e.airborne=false}
}

export function drawSpeakerAttack(ctx,e){
 const s=e.sound;if(!s||e.dead)return;
 const warning=s.t<s.wind,color=colors[s.kind];
 ctx.save();ctx.beginPath();ctx.rect(47,47,866,506);ctx.clip();ctx.strokeStyle=color;ctx.fillStyle=color+'25';ctx.lineWidth=3;
 if(s.kind==='slam'){
  ctx.fillStyle=warning?'#ef847e35':'#ffe2bf99';ctx.beginPath();ctx.arc(s.targetX,s.targetY,85,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#ad4847';ctx.font='bold 13px system-ui';ctx.textAlign='center';ctx.fillText(warning?'跳砸落点 · 快躲开':'落地弹幕！',s.targetX,s.targetY+105);
 }else if(s.kind==='fan'){
  const spread=s.rage?.73:.52;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.arc(s.x,s.y,330,s.aim-spread,s.aim+spread);ctx.closePath();ctx.fill();ctx.setLineDash([8,10]);ctx.stroke();ctx.setLineDash([]);
 }else if(s.kind==='bass'){
  const radius=warning?400:70+Math.min(1,(s.t-s.wind)/1.45)*330;
  if(warning)ctx.setLineDash([10,12]);ctx.beginPath();ctx.arc(s.x,s.y,radius,0,Math.PI*2);ctx.lineWidth=warning?3:18;ctx.stroke();ctx.setLineDash([]);
  if(!warning){ctx.beginPath();ctx.arc(s.x,s.y,radius,0,Math.PI*2);ctx.strokeStyle='#fff3d9';ctx.lineWidth=3;ctx.stroke()}
 }else{
  ctx.beginPath();ctx.arc(s.x,s.y,85,0,Math.PI*2);ctx.fill();ctx.stroke();
 }
 ctx.fillStyle='#fff3d4';ctx.textAlign='center';ctx.font='bold 14px system-ui';
 ctx.fillText(names[s.kind]+(warning?' · 蓄能中':s.kind==='bass'?' · 蛙跳穿环':' · 发射'),s.x,s.y-110);
 if(warning){ctx.beginPath();ctx.arc(s.x,s.y,65,-Math.PI/2,-Math.PI/2+Math.PI*2*s.t/s.wind);ctx.strokeStyle=color;ctx.lineWidth=5;ctx.stroke()}
 ctx.restore();
}
