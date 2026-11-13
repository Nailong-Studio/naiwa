import {empowerShot} from './empowered-shots.js';
import {steer,moveOnTerrain,safeSpot,shotLaneOpen} from './terrain.js';
export const DEEPSEEK_ITEMS=[
 {id:'ricewhale',name:'吃白饭的蓝色大肥鱼',desc:'鲸鱼娘奶伴：抬勺蓄势后投出饭团，约每 1.4 秒攻击一次，伤害随基础攻击成长（上限 7.5）。清理战斗房后吃饱，接下来 3 次饭团伤害 +40%。',short:'鲸鱼娘奶伴 · 吃饱强化饭团'},
 {id:'ricebowl',name:'就一碗白饭',desc:'每清理 4 个战斗房恢复 1 点生命；满血时改得 1 金币，每层最多结算 2 次。与大肥鱼搭配，她的攻击间隔缩短 15%。',short:'清房吃饭 · 满血换金币 · 喂养鲸鱼娘'},
 {id:'tokenbag',name:'Token 太多用不完啦',desc:'每 6 轮普通射击有效命中，额外获得 4 点大爆笑充能；每个战斗房最多 3 次。双发、扇形、穿透和分裂共用一轮计数。',short:'有效命中攒 Token · 额外爆笑充能'},
 {id:'deepthink',name:'已思考三秒',desc:'战斗中停火 3 秒，接下来 3 轮普通射击获得穿透和 150% 额外伤害；强化打完后才能再次思考。移动不打断思考；不能在安全房提前蓄力。',short:'停火思考 · 连续三轮强化穿透'},
 {id:'wrongmodel',name:'用户别走，我上错模型了',desc:'新战斗房交替切换模型：思考档伤害 +35%、攻击间隔 +20%；快速档伤害 -20%、攻击间隔 -30%。回访不切换。',short:'逐房切换 · 重击慢射 / 轻击快射'}
].map(i=>({...i,icon:'✦'}));
import {itemCombatEncounter as combat} from './combat-values.js';
export function resetDeepseek(g){g.whale=null;g.deepThink=0;g.deepReady=false;g.deepBurst=0;}
export function enterDeepseek(g){if(!g.has('wrongmodel')||!combat(g.room)||g.room.deepModel)return;g.room.deepModel=(g.deepModelIndex||0)%2?'fast':'think';g.deepModelIndex=(g.deepModelIndex||0)+1;g.emit('toast',{text:'上错模型了：本房为'+(g.room.deepModel==='fast'?'快速档':'思考档')});}
export function deepStats(g){const mode=g.has('wrongmodel')?g.room.deepModel:null;return {damage:mode==='think'?1.35:mode==='fast'?.8:1,interval:mode==='think'?1.2:mode==='fast'?.7:1};}
export function prepareDeepseekShot(g,start,pet){
 if(pet||g.bullets.length<=start)return;const group={counted:false},ready=g.has('deepthink')&&(g.deepReady||g.deepBurst>0),stats=deepStats(g);if(g.deepReady&&g.has('deepthink'))g.deepBurst=3;g.deepReady=false;if(ready)g.deepBurst--;g.deepThink=0;
 for(const b of g.bullets.slice(start)){b.deepVolley=group;b.damage*=stats.damage;if(ready){empowerShot(b,2.5);b.pierce=true;b.deepCharged=true;b.r+=2}}
}
export function hitDeepseek(g,e,b){
 const r=g.room;if(b.pet||e.airborne||!combat(r)||!g.has('tokenbag')||!b.deepVolley||b.deepVolley.counted)return;b.deepVolley.counted=true;
 if((r.tokenGrants||0)>=3)return;r.tokenHits=(r.tokenHits||0)+1;if(r.tokenHits<6)return;r.tokenHits=0;r.tokenGrants=(r.tokenGrants||0)+1;g.activeCharge=Math.min(g.activeCost(),g.activeCharge+4);g.effects.push({type:'deepToken',x:e.x,y:e.y,tx:g.p.x,ty:g.p.y,life:.45,max:.45});
}
export function clearDeepseek(g,r){
 if(!['fight','challenge','boss','vault','cache'].includes(r.type))return;g.deepThink=0;g.deepReady=false;g.deepBurst=0;
 if(g.has('ricewhale')){g.whaleFed=3;if(g.whale){g.whale.phase='eat';g.whale.t=0}g.emit('toast',{text:'大肥鱼吃饱了！接下来 3 次饭团强化。'})}
 if(!g.has('ricebowl'))return;g.riceClears=(g.riceClears||0)+1;if(g.riceFloor!==g.floor){g.riceFloor=g.floor;g.riceUses=0}if(g.riceClears%4||g.riceUses>=2)return;g.riceUses++;
 if(g.p.hp<g.p.maxHp){g.p.hp++;g.emit('heal');g.emit('toast',{text:'白饭真好吃：恢复 1 点生命。'})}else{g.coins++;g.emit('toast',{text:'已经吃饱：白饭换得 1 金币。'})}
}
export function updateDeepseek(g,dt,playerDt,input){
 if(g.has('deepthink')&&combat(g.room)){if(input.fire){g.deepThink=0;}else if(!g.deepReady&&!(g.deepBurst>0)){g.deepThink=Math.min(3,(g.deepThink||0)+playerDt);if(g.deepThink>=3){g.deepReady=true;g.emit('toast',{text:'已思考三秒：接下来三轮强化穿透！'})}}}else{g.deepThink=0;g.deepReady=false;g.deepBurst=0}
 if(!g.has('ricewhale'))return;
 const home={x:Math.max(70,Math.min(890,g.p.x-72)),y:Math.max(75,Math.min(525,g.p.y+44))},s=g.whale??={...safeSpot(g.room,home.x,home.y,10),type:'pet',r:10,cd:.5,t:0,phase:'idle',face:1,moving:false};s.t+=dt;s.cd=Math.max(0,s.cd-dt);
 if(s.phase==='idle'){
  const d=Math.hypot(home.x-s.x,home.y-s.y),v=steer(g.room,s,home),x=s.x,y=s.y;s.x+=v.x*Math.min(d,270*dt);s.y+=v.y*Math.min(d,270*dt);moveOnTerrain(g.room,s,x,y);s.moving=Math.hypot(s.x-x,s.y-y)>.1;
  const target=g.room.enemies.filter(e=>!e.dead&&!e.airborne&&Math.hypot(e.x-s.x,e.y-s.y)<450&&shotLaneOpen(g.room,s,e)).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y))[0];
  if(target&&s.cd<=0){s.target=target;s.face=target.x>=s.x?1:-1;s.phase='windup';s.t=0}
 }else if(s.phase==='windup'&&s.t>=.32){
  s.phase='attack';s.t=0;s.cd=1.4*(g.has('ricebowl')?.85:1);const e=s.target;if(!e||e.dead||e.airborne)return;
  const x=s.x+s.face*26,y=s.y-18,a=Math.atan2(e.y-y,e.x-x),fed=(g.whaleFed||0)>0;if(fed)g.whaleFed--;
  g.bullets.push({x,y,vx:Math.cos(a)*330,vy:Math.sin(a)*330,r:7,life:1.5,damage:Math.min(7.5,2+g.p.damage)*(fed?1.4:1),bounce:0,pierce:false,pet:true,rice:true,fed,hits:new Set()});g.effects.push({type:'petMuzzle',x,y,life:.18,max:.18,radius:10});
 }else if(s.phase==='attack'&&s.t>=.25||s.phase==='eat'&&s.t>=.8){s.phase='idle';s.t=0}
}
export function deepCombos(g){return [['白饭开工',['ricewhale','ricebowl']],['思考大声点',['deepthink','heavyvoice']],['Token 快充',['tokenbag','battery']]].filter(([,ids])=>ids.every(id=>g.has(id))).map(([name])=>name);}
