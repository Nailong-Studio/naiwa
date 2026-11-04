import {overlaps} from './terrain.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const lanes=[180,300,420];
export function installCatcherArena(g){g.room.hazards=[-1,1].map(s=>({kind:'belt',x:480+s*170,y:310,w:100,h:300,dx:0,dy:s,power:65,phase:0,reverse:true,catcherBelt:true}))}
function cleanup(g,e,interrupt=true){g.room.obstacles=g.room.obstacles.filter(o=>o.owner!==e);g.effects=g.effects.filter(f=>f.type!=='cargoWave'||f.owner!==e);if(interrupt)g.enemyBullets=g.enemyBullets.filter(b=>b.catcherPressure!==e)}
export function catcherPhase(g,e,dt){
 if(e.dead){cleanup(g,e);return}
 if(e.hp<e.maxHp*.5&&!e.catcherRage){e.catcherRage=true;g.emit('toast',{text:'分拣线超载！传送带加速，货物开始双向夹击。'})}
 for(const h of g.room.hazards||[])if(h.catcherBelt)h.power=e.catcherRage?100:65;
 for(const f of g.effects)if(f.type==='cargoWave'&&f.owner===e){
  if(e.handDisabled>0||e.hands?.cancelled){f.life=0;continue}
  f.x+=f.vx*dt;
  if(overlaps({x:f.x,y:f.y,w:48,h:64},g.p.x,g.p.y,g.p.r))g.hurt();
 }
}
export function startCatcherCombo(g,e,cycle){
 if(cycle!==2&&cycle!==3&&cycle!==6)return false;
 const mode=cycle===2?'sweep':'cargo';
 e.hands={mode,x:480,y:clamp(g.p.y,105,495),t:0,wind:.9,placed:false,cancelled:false,fired:0,safe:(e.cargoCycle||0)%3,rage:e.hp<e.maxHp*.5};
 if(mode==='cargo')e.cargoCycle=(e.cargoCycle||0)+1;
 e.cd=mode==='sweep'?3.2:e.hands.rage?5.9:4.6;
 g.emit('toast',{text:mode==='sweep'?'双臂横扫！离开标记带，或穿入双掌之间。':'货物列阵！绿色通道避开货物，还要横移躲点射；炸手可中断。'});return true;
}
function place(g,e,h,arms){g.room.obstacles=[...g.room.obstacles.filter(o=>o.owner!==e),...arms.map(a=>({...a,kind:'hand',owner:e,r:32}))];h.placed=true;
 for(const a of arms)if(overlaps(a,g.p.x,g.p.y,g.p.r)){g.hurt();g.p.y=clamp(a.y+(g.p.y<a.y?-1:1)*(a.h/2+g.p.r+6),75,525)}
}
export function updateCatcherCombo(g,e,dt){
 const h=e.hands;if(!h||!['sweep','cargo'].includes(h.mode))return false;
 if(e.dead||h.cancelled||e.handDisabled>0){cleanup(g,e);e.hands=null;return true}
 h.t+=dt;
 // Lock each aim before firing, so the cargo lane still offers room to sidestep.
 const pressureLimit=h.mode==='sweep'?(h.rage?2:1):h.rage?4:3;
 if(!h.pressure&&h.t>=1.05+(h.pressureCount||0)*1.05&&(h.pressureCount||0)<pressureLimit){h.pressure={aim:Math.atan2(g.p.y-e.y,g.p.x-e.x),wind:.65};}
 if(h.pressure){h.pressure.wind-=dt;if(h.pressure.wind<=0){
  const aim=h.pressure.aim,speed=h.rage?270:245;for(const off of h.rage?[-.32,-.16,0,.16,.32]:[-.16,0,.16])g.enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(aim+off)*speed,vy:Math.sin(aim+off)*speed,r:6,life:4.5,catcherPressure:e});
  h.pressure=null;h.pressureCount=(h.pressureCount||0)+1;
 }}
 if(h.mode==='sweep'){
  if(h.t>=h.wind){const progress=clamp((h.t-h.wind)/1.5,0,1);const arms=[{x:85+progress*290,y:h.y,w:70,h:110},{x:875-progress*290,y:h.y,w:70,h:110}];
   place(g,e,h,arms);
   for(const arm of arms)if(overlaps(arm,g.p.x,g.p.y,g.p.r)){
    g.hurt();const direction=g.p.y<h.y?-1:1;g.p.y=clamp(h.y+direction*(55+g.p.r+5),75,525);
   }
  }

  if(h.t>=2.9){cleanup(g,e,false);e.hands=null}
 }else{
  if(h.t>=h.wind&&!h.placed)place(g,e,h,[{x:90,y:300,w:44,h:90},{x:870,y:300,w:44,h:90}]);
  const waves=h.rage?2:1;
  if(h.fired<waves&&h.t>=h.wind+h.fired*1.3){const direction=h.fired%2?-1:1;for(let i=0;i<3;i++)if(i!==h.safe)g.effects.push({type:'cargoWave',owner:e,x:direction>0?85:875,y:lanes[i],vx:direction*250,life:3.3,max:3.3});h.fired++}
  if(h.t>=(h.rage?5.6:4.3)){cleanup(g,e,false);e.hands=null}
 }
 return true;
}
export function drawCatcherCombos(ctx,g){ctx.save();ctx.textAlign='center';ctx.font='bold 12px system-ui';
 for(const e of g.room.enemies){if(e.kind!=='catcher'||e.dead)continue;
  if(e.handDisabled>0){ctx.fillStyle='#a84842';ctx.fillText('双臂炸退 · 易伤 +50% · '+e.handDisabled.toFixed(1)+'秒',e.x,e.y-110)}
  const h=e.hands;if(!h||h.cancelled||!['sweep','cargo'].includes(h.mode))continue;
  if(h.mode==='sweep'){ctx.fillStyle=h.t<h.wind?'#d5836c38':'#d5836c18';ctx.strokeStyle='#b76656';ctx.setLineDash([8,8]);for(const x of [50,550]){ctx.fillRect(x,h.y-55,360,110);ctx.strokeRect(x,h.y-55,360,110)}ctx.setLineDash([]);ctx.fillStyle='#86c89835';ctx.fillRect(410,h.y-55,140,110);ctx.fillStyle='#944e43';ctx.fillText('双掌 →      留隙      ← 双掌',480,clamp(h.y-68,75,520))}
  else for(let i=0;i<3;i++){const safe=i===h.safe;ctx.fillStyle=safe?'#86c89835':'#cb8c712b';ctx.fillRect(115,lanes[i]-32,730,64);ctx.fillStyle=safe?'#416d48':'#9b574b';ctx.fillText(safe?'货物安全线 · 留意瞄准':h.rage?'→ 货物夹击 ←':'货物 →',480,lanes[i]+4)}
  if(h.pressure){ctx.strokeStyle='#a64e45';ctx.lineWidth=2;ctx.setLineDash([7,7]);for(const off of h.rage?[-.32,0,.32]:[-.16,0,.16]){const a=h.pressure.aim+off;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+Math.cos(a)*850,e.y+Math.sin(a)*850);ctx.stroke()}ctx.setLineDash([]);ctx.fillStyle='#9b574b';ctx.fillText('点射瞄准 · 横移躲开',e.x,e.y-85)}
  let arms=g.room.obstacles.filter(o=>o.owner===e);
  if(!h.placed)arms=h.mode==='sweep'?[{x:85,y:h.y,w:70,h:110},{x:875,y:h.y,w:70,h:110}]:[{x:90,y:300,w:44,h:90},{x:870,y:300,w:44,h:90}];
  for(const a of arms){ctx.strokeStyle='#aa8f68';ctx.lineWidth=13;ctx.beginPath();ctx.moveTo(e.x+(a.x<e.x?-40:40),e.y);ctx.quadraticCurveTo(a.x,e.y-80,a.x,a.y);ctx.stroke();ctx.fillStyle=h.placed?'#d6b083':'#d6b08380';ctx.strokeStyle='#80613e';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(a.x-a.w/2,a.y-a.h/2,a.w,a.h,12);ctx.fill();ctx.stroke();ctx.fillStyle='#6d4e37';ctx.fillText('炸退',a.x,a.y+4)}
 }
 for(const f of g.effects)if(f.type==='cargoWave'&&f.life>0){ctx.fillStyle='#b99564';ctx.strokeStyle='#6e5336';ctx.lineWidth=3;ctx.fillRect(f.x-24,f.y-32,48,64);ctx.strokeRect(f.x-24,f.y-32,48,64);ctx.beginPath();ctx.moveTo(f.x-20,f.y-28);ctx.lineTo(f.x+20,f.y+28);ctx.moveTo(f.x+20,f.y-28);ctx.lineTo(f.x-20,f.y+28);ctx.stroke()}
 ctx.restore();
}
