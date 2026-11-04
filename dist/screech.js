const names={ring:'错位环射',fan:'瞄准扇射',cross:'旋转十字'};
export function startScreech(g,e){
 if(e.screech||e.dead)return;
 const cycle=e.screechCycle||0,kind=['ring','fan','cross'][cycle%3],aim=Math.atan2(g.p.y-e.y,g.p.x-e.x),rotation=Math.floor(cycle/3)*Math.PI/6;
 const count=kind==='ring'?6:kind==='fan'?5:4;
 const angles=Array.from({length:count},(_,i)=>kind==='fan'?aim+(i-2)*.22:aim+rotation+(kind==='cross'?Math.PI/4:0)+i*Math.PI*2/count);
 e.screech={kind,angles,t:0,wind:.5};e.screechCycle=cycle+1;e.cd=1.35;
}
export function updateScreech(g,e,dt){
 if(e.dead||e.repelled>0){e.screech=null;return}
 const s=e.screech;if(!s)return;s.t+=dt;if(s.t<s.wind)return;
 const speed=s.kind==='fan'?205:175;
 for(const a of s.angles)g.enemyBullets.push({x:e.x+Math.cos(a)*(e.r+5),y:e.y+Math.sin(a)*(e.r+5),vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:7,life:5,sound:s.kind==='ring'?'ring':'fan'});
 e.screech=null;
}
export function drawScreech(ctx,e){
 const s=e.screech;if(e.dead||!s)return;
 ctx.save();ctx.strokeStyle='#a77aab';ctx.fillStyle='#75537e';ctx.lineWidth=2;ctx.setLineDash([5,7]);
 for(const a of s.angles){ctx.beginPath();ctx.moveTo(e.x+Math.cos(a)*28,e.y+Math.sin(a)*28);ctx.lineTo(e.x+Math.cos(a)*150,e.y+Math.sin(a)*150);ctx.stroke()}
 ctx.setLineDash([]);ctx.beginPath();ctx.arc(e.x,e.y,e.r+8,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,s.t/s.wind));ctx.lineWidth=4;ctx.stroke();
 ctx.font='11px system-ui';ctx.textAlign='center';ctx.fillText(names[s.kind]+' · 预警',e.x,e.y-e.r-35);ctx.restore();
}
