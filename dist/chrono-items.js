import {itemCombatActive} from './combat-values.js';
import {updateGojoFusion} from './gojo-fusion.js';
export const CHRONO_ITEMS=[
 {id:'gojohalf',icon:'✦',name:'二点五条悟',desc:'蛙跳在起跳点留下上半身、落地点留下下半身。下半身先向随机方向发射赫（6 点伤害），赫飞出后停住；上半身随后发射苍（4 点伤害）追向赫并轻微吸附普通怪。苍赫每个敌人各命中一次，碰撞合成茈，预警 0.85 秒后在 130 范围爆炸，造成普通炸弹两倍的 40 点伤害，也会对奶蛙造成 1 格自伤，可用蛙跳无敌帧躲避。冷却 8 秒，换房清除。',short:'随机赫 → 苍追击 → 茈爆炸 40 伤害 · 注意自伤'},
 {id:'sandevistan',icon:'ϟ',name:'斯安威斯坦',desc:'每个未清理战斗房首次实际受伤后，进入 3 秒超速：短暂停顿后世界约以 18% 速度运行，自身移速 +35%；前 2 秒攻速提升至 3 倍（超频间隔下限 0.055 秒，原本更快则不降速），最后 1 秒攻击间隔 -20%，期间不再受伤。触发的那次伤害仍扣血，致命伤不触发。',short:'受击超速 3 秒 · 前 2 秒三倍攻速 · 每战斗房一次'}
];
export const sandyActive=g=>(g.sandy?.left||0)>0;
export const sandyBurst=g=>sandyActive(g)&&g.sandy.age<2;
export const chronoAttackInterval=(g,base)=>sandyBurst(g)?Math.max(Math.min(base,.055),base/3):base*(sandyActive(g)?.8:1);
export function resetChronoRoom(g){g.sandy=null;g.sandyTrails=[];g.gojo=null;g.chronoDash=false;}
export function triggerSandy(g){
 if(!g.has('sandevistan')||!itemCombatActive(g.room)||g.room.sandyUsed||g.p.hp<=0||g.mode!=='play')return false;
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
 updateGojoFusion(g,dt,origin);
}
