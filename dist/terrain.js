import {armBarrel} from './environment-props.js';
import {TACTICAL_LAYOUTS,selectLayouts,fillBridgeSlots} from './tactical-terrain.js';
import {encounterCount} from './encounter-budget.js';
import {CHAPTER_LAYOUTS} from './chapter-content.js';
import {installEncounters,describeEncounter,profileIndex,encounterRoster,formationTarget} from './encounter-profiles.js';
// Authored combat spaces; rotation is by room selection, not random scatter.
const CELL=52;
const tile=(c,r,kind)=>({x:116+c*CELL,y:92+r*CELL,w:48,h:48,r:24,kind,hp:kind==='crate'?3:Infinity});
const box=(c,r,w,h,kind)=>Array.from({length:w*h},(_,i)=>tile(c+i%w,r+Math.floor(i/w),kind));
export const LAYOUTS=[
 {id:'shelves',name:'四角货架',hint:'借货架挡弹，打碎货箱扩大走位空间',build:()=>[
  ...box(3,2,2,1,'crate'),...box(10,2,2,1,'crate'),...box(3,6,2,1,'crate'),...box(10,6,2,1,'crate'),tile(3,3,'rock'),tile(11,3,'rock'),tile(3,5,'rock'),tile(11,5,'rock')]},
 {id:'island',name:'中央断池',hint:'音波能越过坑洞，地面怪需要绕行',build:()=>[
  ...box(6,3,3,3,'pit'),tile(3,2,'pillar'),tile(11,6,'pillar'),tile(3,6,'crate'),tile(11,2,'crate')]},
 {id:'slalom',name:'错位窄道',hint:'绕过两道石墙，或用炸弹打通近路',build:()=>[
  ...box(5,1,1,5,'rock'),...box(9,3,1,5,'rock'),tile(3,6,'crate'),tile(11,2,'crate')]},
 {id:'cross',name:'十字交火',hint:'四块掩体分割火线，小心侧面包夹',build:()=>[
  ...box(3,2,2,2,'crate'),...box(10,2,2,2,'crate'),...box(3,5,2,2,'rock'),...box(10,5,2,2,'rock')]},
 {id:'bridge',name:'断池窄桥',hint:'中央窄桥能通行，也可沿两侧绕路',build:()=>[
  ...box(2,4,5,1,'pit'),...box(8,4,5,1,'pit'),tile(5,2,'pillar'),tile(9,6,'pillar'),tile(3,6,'crate'),tile(11,2,'crate')]},
 {id:'bunker',name:'双层掩体',hint:'固定柱不能炸毁，利用间隙换位射击',build:()=>[
  ...[3,6,8,11].flatMap(c=>[tile(c,2,'pillar'),tile(c,6,'pillar')]),...box(5,4,1,1,'crate'),tile(9,4,'crate')]},
 {id:'shortcut',name:'封箱近道',hint:'货箱封住直路，击碎后可穿过；外围始终可走',build:()=>[
  ...box(7,1,1,2,'pillar'),...box(7,3,1,3,'crate'),...box(7,6,1,2,'pillar'),tile(4,3,'rock'),tile(10,5,'rock')]},
 {id:'banks',name:'断续河岸',hint:'远程怪隔坑射击，追击怪从缺口绕来',build:()=>[
  ...box(3,2,3,1,'pit'),...box(9,6,3,1,'pit'),...box(5,5,2,1,'pit'),...box(8,3,2,1,'pit'),tile(3,6,'rock'),tile(11,2,'rock'),tile(6,2,'crate'),tile(8,6,'crate')]}
];

// More silhouettes for the new squads; all four door routes remain connected.
LAYOUTS.push(
 {id:'twin_nests',name:'双窝火力场',hint:'两侧掩体护住火力点，中路可换边突破',build:()=>[...box(3,2,2,1,'pillar'),...box(10,6,2,1,'pillar'),tile(4,5,'crate'),tile(10,3,'crate'),tile(7,2,'rock'),tile(7,6,'rock')]},
 {id:'broken_ring',name:'缺口围场',hint:'环形断墙留出四个缺口，别被追兵逼进内圈',build:()=>[...box(5,2,2,1,'rock'),...box(8,2,2,1,'crate'),...box(5,6,2,1,'crate'),...box(8,6,2,1,'rock'),tile(4,3,'pillar'),tile(4,5,'pillar'),tile(10,3,'pillar'),tile(10,5,'pillar')]},
 {id:'crate_steps',name:'阶梯箱阵',hint:'逐段打碎货箱，改变追兵路线和射击角度',build:()=>[...box(3,2,2,1,'crate'),...box(6,3,2,1,'crate'),...box(9,4,2,1,'crate'),...box(6,6,2,1,'crate'),tile(3,6,'pillar'),tile(11,2,'pillar')]},
 {id:'split_pools',name:'双池绕行场',hint:'地面怪沿池边绕行，飞扑怪直接越过水池',build:()=>[...box(4,2,2,2,'pit'),...box(9,5,2,2,'pit'),tile(3,6,'crate'),tile(11,2,'crate'),tile(7,3,'pillar'),tile(7,5,'pillar')]}
);

LAYOUTS.push(...TACTICAL_LAYOUTS);

export function installLayouts(g){
 installEncounters(g);
 const selected=selectLayouts(g,LAYOUTS,CHAPTER_LAYOUTS[g.floor-1]);
 for(const room of g.rooms){room.obstacles=[];room.hazards=[];if(!selected.has(room.id))continue;
  const layout=selected.get(room.id);room.layoutId=layout.id;room.layoutName=layout.name;room.layoutHint=layout.hint;room.obstacles=layout.build();
  // Normal rooms use cover and enemy formations; only combat skills add hazards.
  const nodes=navigationSnapshot(room),wide=nodes.filter(n=>n.free&&n.distance>=0&&!blocked(room,n.x,n.y,44)).length;
  room.crowdingPenalty=wide/nodes.length<.66?2:wide/nodes.length<.72?1:0;

 }
 const caches=g.rooms.filter(r=>r.exists&&r.obstacles.some(o=>o.kind==='rock'&&!o.bridgeTo));
 if(caches.length){const room=caches[Math.floor(g.random()*caches.length)],rocks=room.obstacles.filter(o=>o.kind==='rock'&&!o.bridgeTo);rocks[Math.floor(g.random()*rocks.length)].stash=true;}
}

export function overlaps(o,x,y,r){
 if(!o.w)return Math.hypot(o.x-x,o.y-y)<o.r+r;
 const dx=Math.max(Math.abs(x-o.x)-o.w/2,0),dy=Math.max(Math.abs(y-o.y)-o.h/2,0);
 return dx*dx+dy*dy<r*r;
}
export function blocked(room,x,y,r=24,flying=false){return room.obstacles.some(o=>!(flying&&o.kind==='pit')&&overlaps(o,x,y,r))}
const NX=33,NY=19,STEP=26;
const point=i=>({x:64+(i%NX)*STEP,y:66+Math.floor(i/NX)*STEP});
const index=(x,y)=>Math.max(0,Math.min(NX-1,Math.round((x-64)/STEP)))+Math.max(0,Math.min(NY-1,Math.round((y-66)/STEP)))*NX;
function adjacent(i){const c=i%NX,r=Math.floor(i/NX);return [c>0?i-1:-1,c<NX-1?i+1:-1,r>0?i-NX:-1,r<NY-1?i+NX:-1].filter(n=>n>=0)}
function grid(room,flying){
 if(room.nav?.obstacles!==room.obstacles)room.nav={obstacles:room.obstacles};
 const key=flying?'air':'ground';if(!room.nav[key]){
  const free=Array.from({length:NX*NY},(_,i)=>{const p=point(i);return !blocked(room,p.x,p.y,24,flying)});
  room.nav[key]={free,target:-1,dist:null};
 }return room.nav[key];
}
function closestFree(free,x,y){let best=-1,d=Infinity;for(let i=0;i<free.length;i++)if(free[i]){const p=point(i),n=(p.x-x)**2+(p.y-y)**2;if(n<d){d=n;best=i}}return best}
function field(room,target,flying=false){
 const data=grid(room,flying);let end=index(target.x,target.y);if(!data.free[end])end=closestFree(data.free,target.x,target.y);
 if(data.target!==end||!data.dist){const dist=new Int16Array(NX*NY).fill(-1),q=[end];dist[end]=0;
  for(let j=0;j<q.length;j++)for(const n of adjacent(q[j]))if(data.free[n]&&dist[n]<0){dist[n]=dist[q[j]]+1;q.push(n)}
  data.target=end;data.dist=dist;
 }return data;
}
export function safeSpot(room,x,y,r=24,avoid=null,used=[],score=null){
 if(!room.layoutId)return {x,y};
 const {free,dist}=field(room,{x:95,y:300});let best=null,d=Infinity;
 for(let i=0;i<free.length;i++)if(free[i]&&dist[i]>=0){const p=point(i);
  if(blocked(room,p.x,p.y,r)||(room.hazards||[]).some(h=>h.kind!=='belt'&&overlaps(h,p.x,p.y,r))||avoid&&Math.hypot(p.x-avoid.x,p.y-avoid.y)<150||used.some(e=>Math.hypot(p.x-e.x,p.y-e.y)<60))continue;
  const n=(p.x-x)**2+(p.y-y)**2+(score?score(p):0);if(n<d){best=p;d=n}
 }
 return best||{x:95,y:300};
}
export function shotLaneOpen(room,a,b){
 return !room.obstacles.some(o=>{if(o.kind==='pit')return false;let near=0,far=1;for(const axis of ['x','y']){const delta=b[axis]-a[axis],half=(axis==='x'?(o.w||o.r*2):(o.h||o.r*2))/2+7,low=o[axis]-half,high=o[axis]+half;if(Math.abs(delta)<.0001){if(a[axis]<low||a[axis]>high)return false;continue}const t1=(low-a[axis])/delta,t2=(high-a[axis])/delta;near=Math.max(near,Math.min(t1,t2));far=Math.min(far,Math.max(t1,t2));if(near>far)return false}return far>=0&&near<=1});
}
function positionCost(room,type,player){
 if(['conductor','stitchMedic'].includes(type))return p=>shotLaneOpen(room,p,player)?70000:0;
 if(!['shooter','turret','soundTurret','dollTurret','warden','echoBell','prismEye'].includes(type))return null;
 return p=>{const cover=room.obstacles.some(o=>o.kind!=='pit'&&Math.hypot(o.x-p.x,o.y-p.y)<140);return (shotLaneOpen(room,p,player)?0:90000)+(Math.hypot(p.x-player.x,p.y-player.y)<250?50000:0)-(cover?4000:0)};
}
function clearLine(room,a,b,flying){const length=Math.hypot(b.x-a.x,b.y-a.y),steps=Math.ceil(length/13);for(let i=1;i<=steps;i++)if(blocked(room,a.x+(b.x-a.x)*i/steps,a.y+(b.y-a.y)*i/steps,a.r+1,flying))return false;return true}
export function steer(room,e,p){
 const dx=p.x-e.x,dy=p.y-e.y,length=Math.hypot(dx,dy)||1,flying=e.type==='hopper';
 if(e.type==='boss'||!room.obstacles.length||clearLine(room,e,p,flying)){e.route=null;return {x:dx/length,y:dy/length}}
 const {free,dist,target}=field(room,p,flying);
 // Keep a real route, then look ahead only along segments the monster's body fits through.
 if(!e.route||e.route.target!==target||e.route.obstacles!==room.obstacles||!e.route.points.length){
  let at=-1,best=Infinity;
  for(let i=0;i<free.length;i++)if(free[i]&&dist[i]>=0){const node=point(i),distance=Math.hypot(node.x-e.x,node.y-e.y);
   if(distance>90||!clearLine(room,e,node,flying))continue;
   const cost=dist[i]*STEP+distance;if(cost<best){best=cost;at=i}
  }
  if(at<0)at=closestFree(free,e.x,e.y);
  const points=[point(at)];let guard=NX*NY;
  while(dist[at]>0&&guard-->0){const next=adjacent(at).find(n=>dist[n]>=0&&dist[n]<dist[at]);if(next===undefined)break;at=next;points.push(point(at))}
  e.route={target,obstacles:room.obstacles,points};
 }
 const route=e.route.points;
 while(route.length>1&&Math.hypot(route[0].x-e.x,route[0].y-e.y)<10)route.shift();
 let next=0;for(let i=route.length-1;i>0;i--)if(clearLine(room,e,route[i],flying)){next=i;break}
 if(next)route.splice(0,next);
 const to=route[0],vx=to.x-e.x,vy=to.y-e.y,len=Math.hypot(vx,vy)||1;
 if(!clearLine(room,e,to,flying)){e.route=null;return {x:0,y:0}}
 return {x:vx/Math.max(10,len),y:vy/Math.max(10,len)};
}
export function moveOnTerrain(room,actor,fromX,fromY){
 if(actor.type==='boss'&&room.obstacles.some(o=>o.owner===actor))room={...room,obstacles:room.obstacles.filter(o=>o.owner!==actor)};
 const flying=actor.type==='hopper',dx=actor.x-fromX,dy=actor.y-fromY,n=Math.max(1,Math.ceil(Math.hypot(dx,dy)/8));
 let x=fromX,y=fromY;
 if(blocked(room,x,y,actor.r,flying)){const safe=safeSpot(room,x,y,actor.r);x=safe.x;y=safe.y}
 for(let i=0;i<n;i++){if(!blocked(room,x+dx/n,y,actor.r,flying))x+=dx/n;if(!blocked(room,x,y+dy/n,actor.r,flying))y+=dy/n}
 actor.x=x;actor.y=y;
}
export function terrainProjectile(g,b,hostile){
 const obstacle=g.room.obstacles.find(o=>o.kind!=='pit'&&!(hostile&&o.kind==='hand'&&o.owner===b.catcherPressure)&&overlaps(o,b.x,b.y,b.r));if(!obstacle)return false;
 if(obstacle.kind==='barrel'){if(!hostile&&obstacle.fuse===undefined){obstacle.hp-=b.damage;if(obstacle.hp<=0)armBarrel(g,obstacle)}return true}
 if(obstacle.device){if(!hostile)g.hitDevice(obstacle,b.damage);return true}
 if(obstacle.kind==='crate'&&!hostile){obstacle.hp-=b.damage;if(obstacle.hp<=0){g.room.obstacles=g.room.obstacles.filter(o=>o!==obstacle);crateLoot(g,obstacle);g.burst(obstacle.x,obstacle.y,'#cfad79',8)}}
 if(!hostile&&b.bounce>0){
  const px=b.previousX??b.x-b.vx*.02,py=b.previousY??b.y-b.vy*.02;
  const horizontal=Math.abs(px-obstacle.x)/(obstacle.w/2+b.r)>=Math.abs(py-obstacle.y)/(obstacle.h/2+b.r);
  if(horizontal)b.vx*=-1;else b.vy*=-1;b.x=px;b.y=py;b.bounce--;g.onBulletBounce?.(b);return false;
 }
 return true;
}
function crateLoot(g,o){
 if(o.lootRolled)return;o.lootRolled=true;
 if(g.random()>=.15)return;
 const roll=g.random(),type=roll<.5?'coin':roll<.7?'key':roll<.85?'bomb':'heart';
 g.drop(type,o.x,o.y,1);
}
export function blastTerrain(g,x,y,radius){
 const owners=new Set(g.room.obstacles.filter(o=>o.kind==='hand'&&overlaps(o,x,y,radius)).map(o=>o.owner));
 if(owners.size){for(const e of owners){e.handDisabled=3;if(e.hands)e.hands.cancelled=true}g.room.obstacles=g.room.obstacles.filter(o=>!owners.has(o.owner));g.emit('toast',{text:'双手被炸退！趁现在突破封锁。'})}
 const broken=[];g.room.obstacles=g.room.obstacles.filter(o=>{
  if(o.kind==='barrel'){if(overlaps(o,x,y,radius))armBarrel(g,o);return true}
  if(o.device||o.kind==='pit'||o.kind==='pillar'||!overlaps(o,x,y,radius))return true;
  broken.push(o);return false;
 });
 if(fillBridgeSlots(g.room,broken).length)g.emit('toast',{text:'桥石填平坑洞！近路打开了。'});
 for(const o of broken){
  if(o.kind==='crate')crateLoot(g,o);
  if(o.stash&&!o.lootRolled){o.lootRolled=true;const roll=g.random(),type=roll<.5?'coin':roll<.75?'key':'bomb';g.drop(type,o.x,o.y,type==='coin'?3:1);g.emit('toast',{text:'蓝纹石里藏着补给！'})}
 }
 if(broken.some(o=>o.kind==='rock'&&!o.stash)&&g.random()<.15)g.drop('coin',x,y,1);
 for(const o of broken)g.burst(o.x,o.y,'#b4a187',6);
}
export function spawnEncounter(g,room){
 const count=encounterCount(room,g.floor);room.encounterSize=count;
 const profile=describeEncounter(room,g.floor);room.encounterVariant=profileIndex(room);
 const types=encounterRoster(room,g.floor,count),enemies=[];
 for(let i=0;i<count;i++){
  const target=formationTarget(profile,i,count,g.p),p=safeSpot(room,target.x,target.y,24,g.p,enemies,positionCost(room,types[i],g.p));
  const enemy=g.spawn(types[i],p.x,p.y);
  // Stagger the opening fire; a battery must not release every shot at once.
  enemy.cd=Math.max(enemy.cd,.65+(i%4)*.22);enemies.push(enemy);
 }
 return enemies;
}

export function navigationSnapshot(room){const data=field(room,{x:95,y:300});return data.free.map((free,i)=>({...point(i),free,distance:data.dist[i]}))}
