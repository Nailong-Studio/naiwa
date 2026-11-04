import {overlaps} from './terrain.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const target=g=>({x:clamp(g.p.x,100,860),y:clamp(g.p.y,100,500)});
function throwPods(g,e,requested){
 const alive=g.room.enemies.filter(m=>!m.dead&&m!==e).length,pending=g.effects.filter(f=>f.type==='dollPod'&&f.owner===e&&!f.landed&&f.life>0).length;
 const amount=Math.max(0,Math.min(requested,5-alive-pending));
 for(let i=0;i<amount;i++)g.effects.push({type:'dollPod',owner:e,x:clamp(g.p.x+(i?65:-20),100,860),y:clamp(g.p.y,100,500),sx:e.x,sy:e.y,radius:75,life:1+i*.28,max:1+i*.28,spawnType:['brute','runner','stitchling'][((e.podCount||0)+i)%3]});
 e.podCount=(e.podCount||0)+amount;return amount;
}
export function startPuppetAttack(g,e){
 if(e.puppetSkill){e.cd=Math.max(e.cd,.25);return true}
 const cycle=(e.puppetCycle||0)%4;e.puppetCycle=(e.puppetCycle||0)+1;
 const rage=e.hp<e.maxHp*.5;
 if(cycle===0){
  if(throwPods(g,e,rage?2:1)){e.cd=rage?.65:.85;return true}
 }
 // A full summon budget replaces only the throw; it never blocks the rotation.
 const mode=cycle===3?'loom':cycle===2?'stitch':'needle';
 e.puppetSkill={mode,t:0,age:0,wave:0,fired:0,rage,...target(g),aim:Math.atan2(g.p.y-e.y,g.p.x-e.x),nextAimAt:.8};
 e.cd=mode==='loom'?(rage?4.2:3.4):mode==='stitch'?(rage?4.95:3.35):(rage?3.3:2.5);
 g.emit('toast',{text:mode==='loom'?'拼装奶偶 · 织机夹射！上下针幕留有通道，小心落点。':mode==='needle'?'拼装奶偶 · 缝针连射！离开虚线指向。':'拼装奶偶 · 缝线空投！斜向离开标记带，同时躲开投怪落点。'});return true;
}
export function updatePuppet(g,e,dt){
 if(e.dead){e.puppetSkill=null;g.enemyBullets=g.enemyBullets.filter(b=>b.puppetOwner!==e);return}
 const s=e.puppetSkill;if(!s)return;s.t+=dt;s.age+=dt;
 if(s.mode==='loom'){
  if(s.t>=1+s.fired*.75&&s.fired<(s.rage?4:3)){
   const gap=clamp(s.x,170,790),left=s.fired%2===0;
   for(let x=75;x<=885;x+=27)if(Math.abs(x-gap)>100)g.enemyBullets.push({x,y:left?65:535,vx:0,vy:(left?1:-1)*(s.rage?290:250),r:6,life:3,needle:true,puppetOwner:e});
   s.fired++;
  }
  if(s.t>=1.25&&!s.podThrown){throwPods(g,e,1);s.podThrown=true}
  if(s.t>=(s.rage?3.9:3.15))e.puppetSkill=null;
 }else if(s.mode==='needle'){
  const bursts=s.rage?4:3,count=s.rage?7:5;
  if(s.fired>0&&s.fired<bursts&&s.t>=s.nextAimAt){s.aim=Math.atan2(g.p.y-e.y,g.p.x-e.x);s.nextAimAt=Infinity}
  if(s.fired<bursts&&s.t>=.7+s.fired*.8){
   for(let i=0;i<count;i++){const a=s.aim+(i-(count-1)/2)*.19,speed=s.rage?315:285;g.enemyBullets.push({x:e.x+Math.cos(a)*(e.r+6),y:e.y+Math.sin(a)*(e.r+6),vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:6,life:4,needle:true,puppetOwner:e})}s.fired++;s.nextAimAt=.8+(s.fired-1)*.8;
  }
  if(s.t>=.7+(bursts-1)*.8+.15)e.puppetSkill=null;
 }else{
  if(s.age>=1.3&&!s.podThrown&&(s.rage||s.wave===0)){throwPods(g,e,1);s.podThrown=true}
  if(s.age>=.95&&s.age<1.25&&(overlaps({x:480,y:s.y,w:850,h:28},g.p.x,g.p.y,g.p.r)||overlaps({x:s.x,y:300,w:28,h:490},g.p.x,g.p.y,g.p.r)))g.hurt();
  if(s.age>=1.6){if(s.wave<(s.rage?2:1)){s.wave++;s.age=0;s.podThrown=false;Object.assign(s,target(g))}else e.puppetSkill=null}
 }
}
export function drawPuppetAttack(ctx,g){
 for(const e of g.room.enemies){const s=e.puppetSkill;if(e.dead||!s)continue;ctx.save();ctx.font='bold 13px system-ui';ctx.textAlign='center';
  if(s.mode==='loom'){
   const gap=clamp(s.x,170,790);ctx.fillStyle='#874e9650';ctx.fillRect(55,55,gap-155,490);ctx.fillRect(gap+100,55,805-gap,490);ctx.fillStyle='#8fcfa62b';ctx.fillRect(gap-100,55,200,490);ctx.strokeStyle='#f0c48c';ctx.lineWidth=4;ctx.strokeRect(gap-100,55,200,490);
   for(let x=75;x<900;x+=27){ctx.fillStyle='#8b5a7e';ctx.fillRect(x-4,55,8,16);ctx.fillRect(x-4,529,8,16)}
   ctx.fillStyle='#623b65';ctx.fillText('织机夹射 · 留出中缝，避开投怪落点',480,100);
  }else if(s.mode==='needle'){
   ctx.strokeStyle=s.t<.7+s.fired*.8?'#ae5684':'#b15b8b77';ctx.lineWidth=2;ctx.setLineDash([9,7]);
   for(const offset of [-(s.rage?3:2)*.19,0,(s.rage?3:2)*.19]){const a=s.aim+offset;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+Math.cos(a)*350,e.y+Math.sin(a)*350);ctx.stroke()}
   ctx.setLineDash([]);ctx.fillStyle='#773f66';ctx.fillText(s.t<.7+s.fired*.8?'缝针蓄势 · 向侧面躲':'缝针连射',e.x,e.y-65);
  }else{
   const active=s.age>=.95&&s.age<1.25,warning=s.age<.95;ctx.fillStyle=active?'#bf4d8fc9':'#c8789b30';ctx.strokeStyle=active?'#79335f':'#a55780';ctx.lineWidth=2;ctx.globalAlpha=warning||active?1:.35;ctx.setLineDash(warning?[8,6]:[]);
   for(const r of [{x:55,y:s.y-14,w:850,h:28},{x:s.x-14,y:55,w:28,h:490}]){ctx.fillRect(r.x,r.y,r.w,r.h);ctx.strokeRect(r.x,r.y,r.w,r.h)}
   ctx.setLineDash([]);ctx.strokeStyle=active?'#fff0d6':'#a55780';ctx.lineWidth=2;
   for(let x=65;x<900;x+=22){ctx.beginPath();ctx.moveTo(x-5,s.y-8);ctx.lineTo(x+5,s.y+8);ctx.stroke()}
   for(let y=65;y<540;y+=22){ctx.beginPath();ctx.moveTo(s.x-8,y-5);ctx.lineTo(s.x+8,y+5);ctx.stroke()}
   ctx.fillStyle='#773f66';ctx.fillText(active?'缝合！':s.wave?'追击缝线 · 再次躲开':'十字缝线 · 斜向躲开',240,112);
  }ctx.restore();
 }
}
