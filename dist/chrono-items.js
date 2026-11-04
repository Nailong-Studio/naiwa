import {moveOnTerrain,safeSpot,shotLaneOpen} from './terrain.js';
export const CHRONO_ITEMS=[
 {id:'gojohalf',icon:'✦',name:'二点五条悟',desc:'蛙跳召出分体五条悟 3.5 秒，结束自动消失，奶蛙本体不变。上半身按你的四向射击补发穿透弹，伤害为基础攻击的 85%（上限 8），每 0.32 秒最多一次；下半身在蛙跳途中踢击沿途敌人，造成 150% 伤害（上限 10），每次蛙跳每个敌人只命中一次，击退普通怪。召唤冷却 8 秒。',short:'分体 3.5 秒 · 穿透补射 + 蛙跳踢击 · 冷却 8 秒'},
 {id:'sandevistan',icon:'ϟ',name:'斯安威斯坦',desc:'每个未清理战斗房首次实际受伤后，进入 3 秒超速：短暂停顿后世界约以 18% 速度运行，自身移速 +35%；前 2 秒攻速提升至 3 倍（超频间隔下限 0.055 秒，原本更快则不降速），最后 1 秒攻击间隔 -20%，期间不再受伤。触发的那次伤害仍扣血，致命伤不触发。',short:'受击超速 3 秒 · 前 2 秒三倍攻速 · 每战斗房一次'}
];
export const sandyActive=g=>(g.sandy?.left||0)>0;
export const sandyBurst=g=>sandyActive(g)&&g.sandy.age<2;
export const chronoAttackInterval=(g,base)=>sandyBurst(g)?Math.max(Math.min(base,.055),base/3):base*(sandyActive(g)?.8:1);
export function resetChronoRoom(g){g.sandy=null;g.sandyTrails=[];g.gojo=null;g.chronoDash=false;}
export function triggerSandy(g){
 if(!g.has('sandevistan')||g.room.clear||g.room.sandyUsed||g.p.hp<=0||g.mode!=='play')return false;
 g.room.sandyUsed=true;g.sandy={left:3,age:0,origin:{x:g.p.x,y:g.p.y,face:g.p.face},sample:0};g.sandyTrails=[];g.p.shot=Math.min(g.p.shot,g.attackInterval?.()??g.p.rate/3);g.emit('sandyStart');return true;
}
export function chronoStep(g,dt){
 if(!(dt>0))return 1;
 g.actionClock=(g.actionClock||0)+dt;
 g.sandyTrails=(g.sandyTrails||[]).filter(s=>(s.age+=dt)<.8);
 if(!sandyActive(g))return 1;
 const s=g.sandy,activeDt=Math.min(dt,s.left);s.left=Math.max(0,s.left-dt);s.age+=activeDt;
 if(s.left===0)g.emit('sandyEnd');
 const scale=s.age<.12?.03:s.left<.3?.18+.82*(1-s.left/.3):.18;
 return (activeDt*scale+(dt-activeDt))/dt;
}
export function afterChronoStep(g,dt,origin){
 const clock=g.actionClock||0;
 if(sandyActive(g)){const s=g.sandy;s.sample-=dt;const last=g.sandyTrails?.at(-1);if(s.sample<=0&&(!last||Math.hypot(g.p.x-last.x,g.p.y-last.y)>6)){s.sample=.045;g.sandyTrails.push({x:g.p.x,y:g.p.y,face:g.p.face,frame:g.p.dash>0?13:4+Math.floor(clock*12)%4,age:0});g.sandyTrails=g.sandyTrails.slice(-18);}}
 const dash=g.p.dash>0,newDash=dash&&!g.chronoDash;
 if(newDash&&!g.room.clear&&g.has('gojohalf')&&!(g.gojoReadyAt>clock)){g.gojoReadyAt=clock+8;g.gojo={x:origin.x,y:origin.y,left:3.5,cd:0,cast:null,flash:0,face:g.p.face};g.emit('gojoSplit');}
 g.chronoDash=dash;
 const s=g.gojo;if(!s)return;s.left-=dt;s.cd=Math.max(0,s.cd-dt);s.flash=Math.max(0,s.flash-dt);
 if(s.left<=0){g.gojo=null;return}
 const feet=s.feet??={...safeSpot(g.room,origin.x-g.p.face*26,origin.y+16,10),r:10,type:'pet',hits:new Set(),flash:0};
 const fx=feet.x,fy=feet.y;feet.x=Math.max(60,Math.min(900,g.p.x-g.p.face*26));feet.y=Math.max(60,Math.min(540,g.p.y+16));moveOnTerrain(g.room,feet,fx,fy);feet.flash=Math.max(0,feet.flash-dt);feet.face=g.p.face;
 if(newDash)feet.hits.clear();
 if(dash)for(const e of [...g.room.enemies]){const dx=feet.x-fx,dy=feet.y-fy,t=Math.max(0,Math.min(1,((e.x-fx)*dx+(e.y-fy)*dy)/(dx*dx+dy*dy||1))),near={x:fx+t*dx,y:fy+t*dy};if(e.dead||e.airborne||feet.hits.has(e)||Math.hypot(e.x-near.x,e.y-near.y)>e.r+18||!shotLaneOpen(g.room,near,e))continue;feet.hits.add(e);feet.flash=.18;g.damageEnemy(e,Math.min(10,g.p.damage*1.5),false);if(e.type!=='boss'){const a=Math.atan2(e.y-near.y,e.x-near.x);e.vx=Math.cos(a)*220;e.vy=Math.sin(a)*220;e.repelled=.18}g.effects.push({type:'petImpact',x:e.x,y:e.y,life:.2,max:.2,radius:22});}
 if(s.cast){s.cast.t+=dt;if(s.cast.t>=.12){const b=s.cast;s.cast=null;s.flash=.18;const x=s.x+(b.dx?s.face*18:0),y=s.y-14;g.bullets.push({x,y,vx:b.dx*440,vy:b.dy*440,r:7,life:1.2,damage:b.damage,pierce:true,bounce:0,hits:new Set(),pet:true,gojo:true});g.effects.push({type:'petMuzzle',x,y,life:.18,max:.18,radius:12})}}
}
export function queueGojo(g,dx,dy){const s=g.gojo;if(!s||s.cd>0||s.cast||!dx&&!dy)return;const horizontal=Math.abs(dx)>=Math.abs(dy);dx=horizontal?Math.sign(dx):0;dy=horizontal?0:Math.sign(dy);s.face=dx||s.face;s.cd=.32;s.cast={dx,dy,t:0,damage:Math.min(8,g.p.damage*.85)};}
