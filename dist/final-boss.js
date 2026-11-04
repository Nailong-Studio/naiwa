const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const isFinal=e=>e.kind==='bull'||e.kind==='meishu';
const rage=e=>e.enraged||e.hp<e.maxHp*.5;
const aim=(g,e)=>Math.atan2(g.p.y-e.y,g.p.x-e.x);
function bullet(g,e,a,speed=245,x=e.x,y=e.y,combo=false){g.enemyBullets.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:7,life:4.4,finalOwner:e,finalCombo:combo})}
function fan(g,e,s){const count=e.kind==='bull'?5:7;for(let i=0;i<count;i++){const a=s.aim+(i-(count-1)/2)*.22;bullet(g,e,a,s.rage?275:245,e.x+Math.cos(a)*(e.r+9),e.y+Math.sin(a)*(e.r+9))}}
function lockCharge(g,e,s){s.x=e.x;s.y=e.y;s.aim=aim(g,e);s.tx=clamp(e.x+Math.cos(s.aim)*390,55+e.r,905-e.r);s.ty=clamp(e.y+Math.sin(s.aim)*390,55+e.r,545-e.r);s.age=0}
function lockTraps(g,s){s.traps=Array.from({length:s.rage?4:3},(_,i)=>({x:clamp(g.p.x+(i===0?0:i===1?-105:i===2?105:0),110,850),y:clamp(g.p.y+(i===3?-110:0),110,490),delay:i*.2}));s.age=0}
function begin(g,e,mode,combo=false){
 const s={mode,combo,rage:rage(e),t:0,age:0,fired:0,wave:0,aim:aim(g,e),x:e.x,y:e.y};
 if(mode==='charge'){s.total=combo?3:s.rage?3:2;lockCharge(g,e,s)}
 if(mode==='traps')lockTraps(g,s);
 if(mode==='stomp'){s.rings=Array.from({length:s.rage?2:1},(_,i)=>({delay:.85+i*.8,hit:false}));s.debris=[]}
 e.finalSkill=s;e.vx=e.vy=0;e.cd=999;g.emit('bossVoice',{kind:e.kind,skill:mode,owner:e});return s;
}
function finish(e){e.finalSkill=null;e.cd=rage(e)?.32:.45;e.vx=e.vy=0}
export function startFinalAttack(g,e){
 if(e.dead)return true;
 const f=g.room.finalFight;
 if(e.finalSkill||f?.combo||f?.pending){e.cd=Math.max(.25,e.cd);return true}
 const order=e.kind==='bull'?['charge','stomp','fan']:['traps','cross','fan'];
 const mode=order[(e.finalCycle||0)%order.length];e.finalCycle=(e.finalCycle||0)+1;begin(g,e,mode);
 const labels={charge:'牛来 · 连环冲撞！每次红线锁定后侧移。',stomp:'牛来 · 震塌牢顶！躲开落石标记，蛙跳穿过震荡环。',traps:'美鼠 · 连环夹击！半血后会再次追踪落点。',cross:'美鼠 · 旋转十字弹！绕开预警方向。',fan:'追踪扇射 · 每次瞄准后向侧面躲开！'};
 g.emit('toast',{text:labels[mode]});return true;
}
function segmentDistance(p,x,y,tx,ty){const dx=tx-x,dy=ty-y,t=clamp(((p.x-x)*dx+(p.y-y)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(p.x-x-t*dx,p.y-y-t*dy)}
function tickSkill(g,e,dt){
 const s=e.finalSkill;if(!s)return;const previous=s.age;s.t+=dt;s.age+=dt;
 if(s.mode==='charge'){
  if(e.repelled>0){e.finalSkill=null;e.cd=.8;return}
  const wind=s.combo?1.05:.8;
  if(s.age>=wind){const progress=clamp((s.age-wind)/.55,0,1),x=e.x,y=e.y;e.x=s.x+(s.tx-s.x)*progress;e.y=s.y+(s.ty-s.y)*progress;
   if(s.age<=wind+.55+dt&&segmentDistance(g.p,x,y,e.x,e.y)<e.r+g.p.r-5)g.hurt();
  }
  if(s.age>=wind+.55+.2){s.wave++;if(s.wave<s.total)lockCharge(g,e,s);else finish(e)}
 }else if(s.mode==='stomp'){
  if(s.debris.length<(s.rage?2:1)&&s.age>=.15+s.debris.length*.8)s.debris.push({x:clamp(g.p.x,100,860),y:clamp(g.p.y,100,500),at:s.age,hit:false});
  for(const rock of s.debris)if(!rock.hit&&s.age>=rock.at+.9){rock.hit=true;if(Math.hypot(g.p.x-rock.x,g.p.y-rock.y)<60+g.p.r)g.hurt()}
  for(const ring of s.rings)if(s.age>=ring.delay&&s.age<=ring.delay+.95){const min=65+Math.max(0,previous-ring.delay)*260,max=65+(s.age-ring.delay)*260,d=Math.hypot(g.p.x-s.x,g.p.y-s.y);if(!ring.hit&&d>=min-g.p.r-9&&d<=max+g.p.r+9){g.hurt();ring.hit=true}}
  if(s.age>=s.rings.at(-1).delay+1.15)finish(e);
 }else if(s.mode==='traps'){
  for(const trap of s.traps){const age=s.age-trap.delay;if(age>=1&&age<1.65&&Math.hypot(g.p.x-trap.x,g.p.y-trap.y)<48+g.p.r)g.hurt()}
  if(s.age>=s.traps.at(-1).delay+1.9){if(s.rage&&s.wave===0){s.wave++;lockTraps(g,s)}else finish(e)}
 }else if(s.mode==='fan'){
  const total=s.rage?4:3;
  if(s.fired>0&&s.fired<total&&s.age>=.85+(s.fired-1)*.8&&!s.reaimed){s.aim=aim(g,e);s.reaimed=true}
  if(s.fired<total&&s.age>=.7+s.fired*.8){fan(g,e,s);s.fired++;s.reaimed=false}
  if(s.age>=.7+(total-1)*.8+.25)finish(e);
 }else if(s.mode==='cross'){
  const total=s.rage?6:4;while(s.fired<total&&s.age>=.85+s.fired*.25){for(let i=0;i<4;i++){const a=s.aim+i*Math.PI/2+s.fired*.2;bullet(g,e,a,s.rage?245:220,e.x+Math.cos(a)*(e.r+9),e.y+Math.sin(a)*(e.r+9))}s.fired++}if(s.age>=.85+(total-1)*.25+.3)finish(e);
 }else if(s.mode==='curtain'){
  while(s.fired<2&&s.age>=1.15+s.fired*.7){const left=s.fired===0;for(let y=75;y<=525;y+=30)if(Math.abs(y-s.gap)>120)bullet(g,e,left?0:Math.PI,210,left?65:895,y,true);s.fired++}
  if(s.age>=6)finish(e);
 }
}
export function updateFinalFight(g,dt){
 const bosses=g.room.enemies.filter(isFinal);if(!bosses.length)return;
 const live=bosses.filter(e=>!e.dead),f=g.room.finalFight??={next:8,pending:false,combo:null};
 for(const e of bosses)if(e.dead){e.finalSkill=null;e.vx=e.vy=0}
 g.enemyBullets=g.enemyBullets.filter(b=>!b.finalOwner?.dead);
 if(live.length===1&&!live[0].enraged){const e=live[0];e.enraged=true;e.finalSkill=null;e.vx=e.vy=0;e.cd=.9;f.combo=null;f.pending=false;g.enemyBullets=g.enemyBullets.filter(b=>!b.finalCombo);g.emit('toast',{text:(e.kind==='bull'?'牛来':'美鼠')+'独自暴走！连招加强，恢复时间缩短。'})}
 if(!live.length){f.combo=null;f.pending=false;return}
 if(live.length===2){
  if(f.combo){f.combo.t+=dt;if(f.combo.t>=6.1){f.combo=null;f.next=8;for(const e of live)e.cd=e.kind==='bull'?.45:.8}}
  else {f.next-=dt;if(f.next<=0)f.pending=true;
   if(f.pending&&live.every(e=>!e.finalSkill)){
    const bull=live.find(e=>e.kind==='bull'),mouse=live.find(e=>e.kind==='meishu');const gap=clamp(g.p.y,180,420);
    f.combo={t:0,gap};f.pending=false;begin(g,bull,'charge',true);const curtain=begin(g,mouse,'curtain',true);curtain.gap=gap;
    g.emit('toast',{text:'牛鼠合击 · 三连冲撞！弹墙留出绿色通道，每次红线锁定后侧移。'});
   }
  }
 }
 for(const e of live)tickSkill(g,e,dt);
}
export function finalSpeed(g,e){if(!isFinal(e))return undefined;return e.finalSkill||g.room.finalFight?.combo?0:e.enraged?90:e.kind==='bull'?65:48}
export function drawFinalFight(ctx,g){
 ctx.save();ctx.beginPath();ctx.rect(50,50,860,500);ctx.clip();ctx.font='bold 13px system-ui';ctx.textAlign='center';
 const combo=g.room.finalFight?.combo;
 if(combo){ctx.fillStyle='#8bc69b35';ctx.fillRect(55,combo.gap-120,850,240);ctx.fillStyle='#3c6d46';ctx.fillText('弹墙通道 · 仍需避开牛来冲撞',480,combo.gap-92);for(const x of [65,895]){ctx.strokeStyle='#ad567e';ctx.lineWidth=5;ctx.setLineDash([8,6]);ctx.beginPath();ctx.moveTo(x,55);ctx.lineTo(x,combo.gap-120);ctx.moveTo(x,combo.gap+120);ctx.lineTo(x,545);ctx.stroke();ctx.setLineDash([])}}
 for(const e of g.room.enemies){if(!isFinal(e)||e.dead)continue;const s=e.finalSkill;
  if(e.enraged){ctx.strokeStyle='#c94f52';ctx.lineWidth=3;ctx.beginPath();ctx.arc(e.x,e.y,e.r+10,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#8a303f';ctx.fillText('暴走',clamp(e.x-e.r-30,85,875),e.y+4)}
  if(!s)continue;ctx.strokeStyle=e.kind==='bull'?'#b45d45':'#a14c87';ctx.fillStyle=e.kind==='bull'?'#bb6a4333':'#ad65952a';ctx.lineWidth=3;
  if(s.mode==='charge'){const warning=s.age<(s.combo?1.05:.8);ctx.strokeStyle=warning?'#b9574f88':'#b9574f33';ctx.lineWidth=e.r*2;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.tx,s.ty);ctx.stroke();ctx.strokeStyle='#a2433e';ctx.lineWidth=3;ctx.setLineDash([9,8]);ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.tx,s.ty);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#833e37';ctx.fillText(warning?'冲撞预警 '+(s.wave+1)+'/'+s.total:'冲撞！',s.x,clamp(s.y+95,110,520));}
  else if(s.mode==='stomp'){if(s.age<.85){ctx.setLineDash([9,9]);ctx.beginPath();ctx.arc(s.x,s.y,80,0,Math.PI*2);ctx.stroke();ctx.setLineDash([])}for(const ring of s.rings){const t=s.age-ring.delay;if(t>=0&&t<=.95){ctx.lineWidth=18;ctx.beginPath();ctx.arc(s.x,s.y,65+t*260,0,Math.PI*2);ctx.stroke()}}ctx.fillStyle='#833e37';ctx.fillText('跺地震荡 · 蛙跳穿环',s.x,clamp(s.y+95,110,520));for(const rock of s.debris){const age=s.age-rock.at;if(age>1.2)continue;ctx.lineWidth=2;ctx.setLineDash(age<.9?[7,6]:[]);ctx.fillStyle=age<.9?'#b96f4930':'#b96f4990';ctx.beginPath();ctx.arc(rock.x,rock.y,60,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#833e37';ctx.fillText(age<.9?'落石预警 · 移动':'落石！',rock.x,rock.y-70)}}
  else if(s.mode==='traps'){for(const trap of s.traps){const t=s.age-trap.delay;if(t<0||t>1.65)continue;ctx.setLineDash(t<1?[7,6]:[]);ctx.fillStyle=t<1?'#b95c8e25':'#c14b8c99';ctx.beginPath();ctx.arc(trap.x,trap.y,48,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#7d3b6a';ctx.fillText(t<1?'夹击预警':'夹！',trap.x,trap.y+4)}}
  else if(s.mode==='fan'||s.mode==='cross'){ctx.setLineDash([8,8]);const angles=s.mode==='cross'?[0,Math.PI/2,Math.PI,Math.PI*1.5]:[-(e.kind==='bull'?2:3)*.22,0,(e.kind==='bull'?2:3)*.22];for(const offset of angles){const a=s.aim+offset;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+Math.cos(a)*300,e.y+Math.sin(a)*300);ctx.stroke()}ctx.setLineDash([]);ctx.fillStyle='#773d62';ctx.fillText(s.mode==='cross'?'旋转十字弹':'追踪扇射 · 锁定后侧移',e.x,clamp(e.y+80,110,510));}
 }
 ctx.restore();
}
