import {BOMB_DAMAGE} from './combat-values.js';
import {bindFloorEconomy} from './floor-economy.js';
import {installRoomWardrobe,canUseRoomWardrobe} from './room-wardrobe.js';
import {castItemVfx,hitItemVfx,bounceItemVfx} from './item-vfx.js';
import {PHOEBE_ITEMS,resetPhoebe,clearPhoebe,preparePhoebeShot,guardPhoebe,updatePhoebe} from './phoebe-items.js';
import {DEEPSEEK_ITEMS,resetDeepseek,enterDeepseek,deepStats,prepareDeepseekShot,hitDeepseek,clearDeepseek,updateDeepseek} from './deepseek-items.js';
import {CHRONO_ITEMS,sandyActive,chronoAttackInterval,resetChronoRoom,triggerSandy,chronoStep,afterChronoStep} from './chrono-items.js';
import {MEME_ITEMS,prepareMemeShot,memeInterval,hitMeme,bounceMeme,hurtMeme,clearMeme,updateMeme,mambaActive,footZoneScale,ghostDamageScale} from './meme-items.js';
import {updateFollowers,resetFollowers} from './follower-combat.js';
import {startRescue,rescueLaugh,updateRescue} from './rescue.js';
import {followerPoint} from './followers.js';
import {COMBO_ITEMS,prepareGearShot,bouncedGear,hitGear,killedGear,mendGear,saveWithButton,clearGear,updateGear,gearInterval} from './item-combos.js';
import {updateBarrels} from './environment-props.js';
import {VOICE_ITEMS,shapeVoice,updateVoice,voiceStats,hitVoice} from './voice-builds.js';
import {installCatcherArena} from './catcher-combos.js';
import {updateFinalFight,finalSpeed} from './final-boss.js';
import {shopServices,chooseService} from './shop-services.js';
import {installResourceRooms,enterResourceRoom,claimResourceRoom,updateResourceRoom,blastResourceDoors,offerExchange,chooseExchange} from './resource-scenes.js';
import {hitDevice,updateDevices,blastDevices} from './chapter-mechanics.js';
import {CHAPTER_MOBS,mobSpeed,mobAttack,updateMobs,mobKilled,mobContact} from './chapter-mobs.js';
import {STATIONARY,specialAttack,updateActors,updateGround,updateActive,movementScale,groundDrift,onMilk,milkPool,killedSpecial} from './combat-content.js';
import {installLayouts,overlaps,safeSpot,steer,moveOnTerrain,terrainProjectile,blastTerrain,spawnEncounter} from './terrain.js';
import {Game as Base,ITEMS,W,H} from './engine.js';
import {startSpeakerAttack,updateSpeaker} from './speaker.js';
export {ITEMS,W,H};
export const CHAPTERS=['奶瓶街','禁笑剧场','奶伴运输站','假奶豆工厂','最后的牢笼'];
export const BOSS_NAMES=['奶瓶收缴员','静音箱','分拣巨钳','拼装奶偶','牛来与美鼠'];
for(const item of [...VOICE_ITEMS,...COMBO_ITEMS,...MEME_ITEMS,...CHRONO_ITEMS,...DEEPSEEK_ITEMS,...PHOEBE_ITEMS])if(!ITEMS.some(i=>i.id===item.id))ITEMS.push(item);
const extra=[
 ['milkboots','♧','豆包雨靴','免疫奶迹伤害与减速；传送带推力减半；每 8 秒抵挡一次地面机关伤害'],
 ['milkfilter','◉','奶迹滤芯','声波伤害常驻 +8%；站在奶迹上时改为 +40%，两者不叠加'],
 ['spillcup','▣','打翻的奶杯','主动爆笑完成后留下持续伤害敌人的友方奶迹'],
 ['milkfoam','◌','奶泡发声器','笑声命中敌人时有 20% 概率留下友方奶迹'],
 ['mouse','◖','奶鼠的奶酪','奶鼠近身啃咬地面敌人，基础伤害固定 1.5，不随攻击属性增长，冷却 3.2 秒，对落地 Boss 也有效。命中可偷补给，每房 1 次、每层最多 3 次：钥匙见底优先给 1 把，其次炸弹见底给 1 枚，否则给 2 金币（已有地面掉落也算库存）。保留 360 范围拾取和真实隐藏门引导，仍需炸弹开门。'],
 ['dog','♧','奶狗项圈','奶狗主动扑击 360 范围内敌人，命中造成 3.2 + 基础攻击×0.9 伤害（上限 8），扑击冷却 0.75 秒'],
 ['egg','●','奶蛋摇篮','奶蛋蓄势后发射穿透声波，冷却 1.25 秒；伤害为 2 + 基础攻击×0.9（上限 7）'],
 ['turtle','◉','奶龟小壳','奶龟以原速绕身旋转，挡弹半径扩大至 32；碰到它的敌弹立即消除，没有挡弹间隔；接触地面敌人造成 1.4 + 基础攻击的 60% 伤害（上限 4），同一敌人每 0.5 秒最多受伤一次，不穿障碍'],
 ['rabbit','♧','奶兔闹钟','大爆笑触发奶兔跳跃波纹，追击 280 范围内敌人；伤害为 4 + 基础攻击×1.5（上限 9），不穿墙，不为大爆笑自充能'],
 ['lunch','▣','豆包的便当','每清空 3 个战斗房，恢复 1 点生命'],
 ['scarf','♡','奶豆的小围兜','声波伤害常驻 +10%；生命不高于 2 点时改为 +70%，两者不叠加'],
 ['megaphone','▷','大笑扩音器','声波射程 +40%，体积增大'],
 ['battery','ϟ','笑声电池','大爆笑所需伤害充能从 45 降为 30'],
 ['homing','✦','回家的方向','笑声自动转向附近敌人'],
 ['split','✳','笑到分叉','命中后分裂两束各 35% 伤害的小声波；分裂弹不再分裂'],
 ['bargain','¤','豆包优惠券','商店道具价格从 10 金币降至 7 金币']
];
for(const [id,icon,name,desc] of extra)if(!ITEMS.some(i=>i.id===id))ITEMS.push({id,icon,name,desc,short:desc});
for(const i of ITEMS){i.desc=i.desc.replaceAll('泪滴','声波').replaceAll('毒泪','毒笑');i.short=i.short.replaceAll('泪滴','声波').replaceAll('毒泪','毒笑')}
Object.assign(ITEMS.find(i=>i.id==='double'),{name:'双声道喇叭',desc:'同时发出两道声波，各造成 70% 伤害，可与扇形叠加',short:'双发 · 每束 70% 伤害'});
const SUPPLIES=[{id:'supply_key',icon:'⚿',name:'钥匙 · 3 金币',desc:'购买 1 把钥匙',resource:'keys'},{id:'supply_bomb',icon:'✹',name:'炸弹 · 3 金币',desc:'购买 1 枚炸弹',resource:'bombs'},{id:'supply_heart',icon:'♥',name:'补血包 · 3 金币',desc:'恢复 2 点生命',resource:'health'}];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export class Game extends Base{
 constructor(random=Math.random){super(random);this.finalFloor=5;this.coins=0;this.keys=1;this.bombs=2;this.activeCharge=0;this.clears=0;this.resources=[];this.explosives=[];this.bombLatch=false;this.useLatch=false;this.activeLatch=false;this.petTimers={};this.seedLabel=Math.floor(this.rand(100000,999999));}
 neighbors(i){return [i%5>0?i-1:-1,i%5<4?i+1:-1,i>=5?i-5:-1,i<20?i+5:-1].filter(n=>n>=0)}
 generate(){resetChronoRoom(this);resetFollowers(this);resetDeepseek(this);resetPhoebe(this);this.keyDryRooms=0;this.gridSize=5;const ids=new Set([12]);while(ids.size<12+Math.min(this.floor,3)){const edge=[...ids].flatMap(i=>this.neighbors(i)).filter(i=>!ids.has(i));ids.add(edge[Math.floor(this.rand(0,edge.length))]);}const dist={12:0},q=[12];while(q.length){const i=q.shift();for(const n of this.neighbors(i))if(ids.has(n)&&dist[n]===undefined){dist[n]=dist[i]+1;q.push(n)}}const ordered=[...ids].filter(i=>i!==12).sort((a,b)=>dist[b]-dist[a]);const boss=ordered.shift();const treasure=ordered.find(candidate=>{const reached=new Set([12]),todo=[12];while(todo.length){for(const n of this.neighbors(todo.shift()))if(ids.has(n)&&n!==candidate&&!reached.has(n)){reached.add(n);todo.push(n)}}return reached.size===ids.size-1});ordered.splice(ordered.indexOf(treasure),1);const shop=ordered.pop(),challenge=ordered.shift();this.rooms=Array.from({length:25},(_,i)=>({id:i,exists:ids.has(i),type:i===12?'start':i===boss?'boss':i===treasure?'treasure':i===shop?'shop':i===challenge?'challenge':'fight',visited:i===12,seen:i===12||this.neighbors(12).includes(i),clear:i===12||i===shop||i===treasure,enemies:null,reward:false,locked:i===treasure&&this.floor>1,obstacles:[],seed:this.rand(0,1000),loot:[],shopStock:null}));installResourceRooms(this);bindFloorEconomy(this);installLayouts(this);installRoomWardrobe(this);this.roomId=12;this.rooms[12].enemies=[];this.p.x=480;this.p.y=300;this.p.inv=1;this.bullets=[];this.enemyBullets=[];this.particles=[];this.effects=[];this.pickup=null;this.explosives=[];this.doorMessage=0;this.emit('room');}
 doors(){const i=this.roomId,visible=n=>this.rooms[n]?.exists&&(!this.rooms[n].hidden||this.rooms[n].revealed);return {left:i%5>0&&visible(i-1),right:i%5<4&&visible(i+1),top:i>=5&&visible(i-5),bottom:i<20&&visible(i+5)}}
 enter(id,side){const next=this.rooms[id];if(!next?.exists)return;const p=this.p;if(next.bombLocked){p.x=clamp(p.x,70,890);p.y=clamp(p.y,70,530);this.emit('toast',{text:'危险藏室：B 炸墙，清怪并躲落物 12 秒；25% 可能为空。'});return}if(next.locked){if(!this.keys){p.x=clamp(p.x,70,890);p.y=clamp(p.y,70,530);this.emit('toast',{text:next.type==='vault'?'守卫补给库：1 把钥匙入场，清除伏击后有 75% 概率获补给，25% 为空。':'道具房上锁：需要 1 把钥匙。可以先探索其他房间。'});return}this.keys--;next.locked=false;}
 resetChronoRoom(this);resetFollowers(this);resetDeepseek(this);resetPhoebe(this);this.footZones=[];this.ghostDecoy=null;this.wasMemeDash=this.p.dash>0;const fresh=!next.enemies;this.room.savedPickup=this.pickup;this.explosives=[];const oldFloor=this.floor;super.enter(id,side);if(this.room.savedPickup)this.pickup=this.room.savedPickup;this.room.enteredAt=this.elapsed;this.room.seen=true;for(const n of this.neighbors(id))if(this.rooms[n].exists)this.rooms[n].seen=true;
 if(fresh&&['fight','challenge'].includes(this.room.type)){this.room.enemies=spawnEncounter(this,this.room);}
 if(this.room.type==='boss'&&!this.room.clear){const types=['collector','speaker','catcher','puppet'];if(oldFloor===5)this.room.enemies=[this.makeBoss('bull',340,220),this.makeBoss('meishu',660,220)];else if(!this.room.bossSet)this.room.enemies=[this.makeBoss(types[oldFloor-1],480,220)];this.room.bossSet=true;if(oldFloor===3&&!this.room.hazards?.some(h=>h.catcherBelt))installCatcherArena(this);}
 enterResourceRoom(this);enterDeepseek(this);
 if(fresh&&!this.room.clear){this.room.warmStart=this.elapsed+2;this.room.warmUntil=this.elapsed+7;}
 this.p.inv=Math.max(this.p.inv,2);for(const enemy of this.room.enemies){enemy.cd=Math.max(enemy.cd||0,1.5);enemy.attack=Math.max(enemy.attack||0,1.5);enemy.chargeCD=Math.max(enemy.chargeCD||0,1.5)}

 if(this.room.type==='shop'){this.room.enemies=[];this.room.clear=true;this.emit('toast',{text:'商店：走近柜台，按 E 选购；金币不会自动扣除。'})}
 this.emit('room',{room:this.room});}
 spawn(type,x,y){if(type==='slime'||type==='shield')type='brute';if(type==='fly')type='hopper';const e=super.spawn(type,x,y);e.artChapter=this.floor;e.hp=e.maxHp=type==='brute'?4+this.floor:type==='runner'?2+this.floor:3+this.floor;if(type==='runner')e.r=17;e.wind=0;e.attack=0;e.dx=1;e.dy=0;if(['fight','challenge','vault','cache'].includes(this.room.type)){const extraHp=({brute:2,forklift:3,stitchling:2,warden:2,loader:1})[type]||0;e.hp=e.maxHp=e.maxHp+extraHp;e.cd=this.rand(.65,1.2)}return e;}
 enemySpeed(e){if(e.repelled>0)return 0;const finaleSpeed=finalSpeed(this,e);if(finaleSpeed!==undefined)return finaleSpeed;const chapterSpeed=mobSpeed(this,e);if(chapterSpeed!==undefined)return chapterSpeed;if(STATIONARY.has(e.type))return 0;if(e.type==='tiny')return 175;if(e.type==='milkleak')return 140;if(e.type==='loader')return 100;if(e.type==='stitchling')return 170;if(e.type==='jailer')return 185;if(e.kind==='collector'&&e.longCharge)return 0;if(e.kind==='speaker')return e.sound?0:45;if(e.kind==='puppet'&&e.puppetSkill)return 0;if(e.kind==='catcher')return e.hands||e.handDisabled>0?0:25;if(e.type==='boss')return e.wind>0?0:e.enraged?85:e.hp<e.maxHp*.5?75:55;if(e.type==='runner')return 190+this.floor*4;if(e.type==='hopper')return e.wind>0?0:155+this.floor*4;if(e.type==='brute')return 120+this.floor*5;if(e.type==='shooter')return 65+this.floor*3;}
 enemyAttack(e){
 if(e.type!=='boss'&&e.phoneMutedUntil>this.elapsed){e.cd=Math.max(.1,e.phoneMutedUntil-this.elapsed);return true}
  e.artAttackUntil=this.elapsed+.3;
  let handled=mobAttack(this,e);
  if(!handled&&e.kind==='speaker'){startSpeakerAttack(this,e);handled=true}
  if(!handled)handled=specialAttack(this,e);
  if(e.type!=='boss'&&['fight','challenge','vault','cache'].includes(this.room.type))e.cd*=.85;
  return handled;
 }
 updateMilkBottles(dt){
  for(const fx of [...this.effects]){
   if(fx.type!=='milkBottle')continue;
   if(fx.owner.dead){fx.life=0;continue}
   if(fx.life>0&&fx.life<=dt&&!fx.exploded){
    fx.exploded=true;if(fx.leavesMilk)milkPool(this,fx.x,fx.y,false,fx.radius*.6,3.5);
    this.effects.push({type:'milkSplash',x:fx.x,y:fx.y,radius:fx.radius,life:.35,max:.35});
    this.burst(fx.x,fx.y,'#fff3cf',22);
    if(Math.hypot(this.p.x-fx.x,this.p.y-fx.y)<fx.radius+this.p.r)this.hurt();
   }
  }
 }
 makeBoss(kind,x,y){const e=super.spawn('boss',x,y);e.kind=kind;e.hp=e.maxHp=({collector:100,speaker:150,catcher:220,puppet:290,bull:280,meishu:250})[kind];e.cd=kind==='meishu'?2.2:1.4;e.wind=0;e.attack=0;return e;}
 offer(title){if(this.room.type==='fight')return;if(this.room.type==='shop'){this.room.shopStock??=this.drawItems(3);this.choices=[...this.room.shopStock.map(i=>({...i,name:i.name+' · '+this.price()+' 金币'})),...SUPPLIES,...shopServices(this)];this.mode='choice';this.emit('choice',{title:`商店 · 持有 ${this.coins} 金币`,choices:this.choices});return}this.choices=this.drawItems(this.room.type==='challenge'?3:1);this.mode='choice';this.emit('choice',{title:this.room.type==='treasure'?'发现道具 · 拿取或留在原地':title,choices:this.choices});}
 drawItems(n){const available=ITEMS.filter(i=>!this.has(i.id)&&i.id!=='tadpole');for(let i=available.length-1;i>0;i--){const j=Math.floor(this.rand(0,i+1));[available[i],available[j]]=[available[j],available[i]]}return available.slice(0,n)}
 price(){return this.has('bargain')?7:10}
 choose(id){const service=chooseService(this,id);if(service!==null)return service;const exchanged=chooseExchange(this,id);if(exchanged!==null)return exchanged;const supply=SUPPLIES.find(i=>i.id===id);if(supply){if(this.room.type!=='shop'||this.mode!=='choice'||!this.choices.some(i=>i.id===id))return false;if(this.coins<3){this.emit('toast',{text:'补给需要 3 金币。'});return false}if(supply.resource==='health'&&this.p.hp>=this.p.maxHp){this.emit('toast',{text:'生命已满，不需要购买补血包。'});return false}this.coins-=3;if(supply.resource==='health')this.p.hp=Math.min(this.p.maxHp,this.p.hp+2);else this[supply.resource]++;this.mode='play';this.emit('room');this.emit('toast',{text:'补给已放入背包。'});return true;}if(this.room.type==='shop'){if(this.mode!=='choice'||!this.choices.some(i=>i.id===id))return false;if(!this.room.shopStock?.some(i=>i.id===id))return false;if(this.coins<this.price()){this.emit('toast',{text:'金币不足，可以稍后回来。'});return false}this.coins-=this.price();this.room.shopSold.push(this.room.shopStock.find(i=>i.id===id));this.room.shopStock=this.room.shopStock.filter(i=>i.id!==id)}const ok=super.choose(id);if(ok)this.activeCharge=Math.min(this.activeCost(),this.activeCharge);if(ok&&this.room.type!=='shop')this.room.pendingItem=false;return ok;}
 leaveChoice(){if(this.mode!=='choice')return;if(this.room.type==='start'){this.mode='play';return}if(this.room.type!=='shop'){this.room.pendingItem=true;this.room.savedChoices=this.choices}this.mode='play';}
 interact(){if(this.mode!=='play')return;if(canUseRoomWardrobe(this)){this.emit('wardrobe');return}if(this.room.type==='start'&&Math.hypot(this.p.x-480,this.p.y-260)<145&&!this.room.loot.some(l=>l.type==='chest'&&Math.hypot(l.x-this.p.x,l.y-this.p.y)<70)){offerExchange(this);return}if(this.room.type==='shop'&&Math.hypot(this.p.x-480,this.p.y-260)<145){this.offer('商店');return}if(this.room.pendingItem){this.choices=this.room.savedChoices;this.mode='choice';this.emit('choice',{title:'留下的道具',choices:this.choices});return}const chest=this.room.loot.find(l=>l.type==='chest'&&Math.hypot(l.x-this.p.x,l.y-this.p.y)<70);if(chest){if(!this.keys){this.emit('toast',{text:'宝箱需要 1 把钥匙。'});return}this.keys--;this.room.loot=this.room.loot.filter(l=>l!==chest);this.drop('coin',chest.x-25,chest.y,5);this.drop('bomb',chest.x+25,chest.y,1);this.drop('heart',chest.x,chest.y+35,2);this.emit('room')}}
 drop(type,x,y,amount=1){const point=safeSpot(this.room,x,y);this.room.loot.push({type,x:point.x,y:point.y,amount})}
 resolveTerrain(actor,x,y){moveOnTerrain(this.room,actor,x,y)}
 enemyContact(e){return mobContact(this,e)}
 enemyHeading(e){const ghost=this.ghostDecoy,target=ghost&&ghost.until>this.elapsed&&e.type!=='boss'&&!this.canEnemyShoot(e)&&e.type!=='shooter'&&Math.hypot(e.x-ghost.x,e.y-ghost.y)<300?ghost:this.p;return steer(this.room,e,target)}
 hitDevice(o,damage){return hitDevice(this,o,damage)}
 projectileBlocked(b,hostile){if(!hostile&&b.ghost)return false;if(b.rollingRock&&this.room.obstacles.some(o=>o.kind==='pit'&&overlaps(o,b.x,b.y,b.r)))return true;return terrainProjectile(this,b,hostile)}
 canBulletHit(e,b){return !(b.rollingRock&&(b.hits.size>=3||e.airborne||['fly','hopper'].includes(e.type)))}
 canEnemyShoot(e){return CHAPTER_MOBS[e.type]?.shoot||STATIONARY.has(e.type)||e.type==='loader'}
 moveScale(actor){const scale=actor.type==='milkSkater'?1:movementScale(this,actor);return scale*(actor===this.p&&this.tempuraBuff>0?1.15:1)*(actor===this.p&&this.phoebeBoost>0?1.2:1)*(actor===this.p&&sandyActive(this)?1.35:1)*(actor===this.p&&mambaActive(this)?1.25:1)*footZoneScale(this,actor)*(actor!==this.p&&actor.rallied>0?1.3:1)*(actor!==this.p&&actor.type!=='boss'&&['fight','challenge','vault','cache'].includes(this.room.type)?1.1:1)}
 groundDrift(actor){return groundDrift(this,actor)}
 onEnemyKilled(e){e.deadAt=this.elapsed;killedGear(this,e);mobKilled(this,e);killedSpecial(this,e)}
 shoot(dx,dy,pet=false){const before=this.bullets.length;super.shoot(dx,dy,pet);for(const b of this.bullets.slice(before)){b.r+=3;if(!pet&&this.has('milkfilter')){const wet=onMilk(this,this.p);b.damage*=wet?1.4:1.08;b.milkBoost=wet;}b.life=(this.has('tongue')?2.7:1.35)*(this.has('megaphone')?1.4:1);if(!pet&&this.has('scarf'))b.damage*=this.p.hp<=2?1.7:1.1;b.split=this.has('split')&&!pet;b.homing=this.has('homing');}prepareGearShot(this,before,pet);if(!pet)shapeVoice(this,before);prepareMemeShot(this,before,pet);prepareDeepseekShot(this,before,pet);preparePhoebeShot(this,before,pet);castItemVfx(this,before,pet);}
 attackInterval(){return chronoAttackInterval(this,this.p.rate*voiceStats(this).interval*gearInterval(this)*memeInterval(this)*deepStats(this).interval)}
 onBulletBounce(b){bouncedGear(this,b);bounceMeme(this,b);bounceItemVfx(this,b);if(!b.pet&&this.has('milkfoam'))milkPool(this,b.x,b.y,true,42,2.5)}
 hurt(){if(sandyActive(this))return;const hp=this.p.hp;if(!saveWithButton(this))super.hurt();if(this.p.hp<hp&&this.p.hp>0){hurtMeme(this);triggerSandy(this)}}
 hurtGround(){if(this.p.inv>0||this.p.dash>0)return;if(this.has('milkboots')&&!(this.bootGuardCD>0)){this.bootGuardCD=8;this.p.inv=.65;this.emit('toast',{text:'豆包雨靴挡住了地面机关！8 秒后恢复。'});return}if(guardPhoebe(this))return;this.hurt()}
 activeCost(){return Math.max(25,(this.has('battery')?30:45)-(this.has('quietbadge')?10:0))}
 damageEnemy(e,n,credit=true){const before=Math.max(0,e.hp);super.damageEnemy(e,n*ghostDamageScale(this,e)*(e.kind==='catcher'&&e.handDisabled>0?1.5:1));const dealt=Math.max(0,before-Math.max(0,e.hp));if(credit)mendGear(this,dealt);if(credit&&!this.releasingLaugh&&dealt>0)this.activeCharge=Math.min(this.activeCost(),(this.activeCharge||0)+dealt)}
 bulletDamage(e,b){return b.damage*(!b.pet&&this.has('starbadge')&&e.starMark>0?1.2:1)}
 onBulletHit(e,b){hitItemVfx(this,e,b);if(b.rollingRock){if(b.hits.size>=3)b.life=0;if(e.type!=='boss'){const a=Math.atan2(b.vy,b.vx);e.vx=Math.cos(a)*180;e.vy=Math.sin(a)*180;e.repelled=.2}}hitVoice(this,e,b);hitGear(this,e,b);hitMeme(this,e,b);hitDeepseek(this,e,b);if(!b.pet&&this.has('milkfoam')&&this.random()<.2)milkPool(this,e.x,e.y,true,48,3);if(!b.split)return;b.split=false;for(const sign of [-1,1]){const a=Math.atan2(b.vy,b.vx)+sign*.7;this.bullets.push({...b,vx:Math.cos(a)*420,vy:Math.sin(a)*420,damage:b.damage*.35,r:5,life:.6,shotSpeed:420,age:0,returnAfter:.25,returned:b.returned,returning:false,hits:new Set(b.hits),split:false})}}
 canClearRoom(r){return !(r.type==='cache'&&r.dangerTime>0)}
 onRoomCleared(r){
  if(r.clearRewarded)return;clearMeme(this,r);resetChronoRoom(this);r.clearRewarded=true;clearGear(this,r);clearDeepseek(this,r);clearPhoebe(this);this.shrimpMeals=[];claimResourceRoom(this);
  for(const e of r.enemies){e.sound=null;e.muted=false;e.hands=null}r.obstacles=r.obstacles.filter(o=>o.kind!=='hand');
  this.effects=this.effects.filter(fx=>!['milkBottle','milkSplash','dollPod','milkPool','mobZone','mobHeal','cargoWave'].includes(fx.type));
  this.clears++;
  if(this.has('lunch')&&this.clears%3===0)this.p.hp=Math.min(this.p.maxHp,this.p.hp+1);
  if(r.type==='fight'){
   const needsKey=this.keys===0&&!this.rooms.some(room=>room.loot.some(l=>l.type==='key'));
   this.keyDryRooms=needsKey?(this.keyDryRooms||0)+1:0;
   const roll=this.random();
   const type=this.keyDryRooms>=3?'key':roll<.4?null:roll<.75?'coin':roll<.85?'key':roll<.93?'bomb':'heart';
   if(type){this.drop(type,480,320,type==='coin'&&this.random()>=.75?2:1);if(type==='key')this.keyDryRooms=0;}
  }else if(r.type==='challenge'){
   if(this.random()<.5)this.drop('chest',480,370);
   else this.offer('挑战完成 · 选择一件奖励');
  }else if(r.type==='boss'&&this.floor<5)this.offer('关末奖励 · 带上它继续救奶豆');
  this.emit('room');
 }
 boom(x,y,radius=130,damage=BOMB_DAMAGE){this.effects.push({type:'bombBlast',x,y,radius,life:.6,max:.6});this.burst(x,y,'#f4dd99',30);for(const e of this.room.enemies||[])if(!e.dead&&Math.hypot(e.x-x,e.y-y)<radius+e.r)this.damageEnemy(e,damage);blastResourceDoors(this,x,y,radius);blastDevices(this,x,y,radius);blastTerrain(this,x,y,radius);this.effects=this.effects.filter(f=>f.type!=='milkPool'||Math.hypot(f.x-x,f.y-y)>radius+f.radius);if(Math.hypot(this.p.x-x,this.p.y-y)<radius-15)this.hurt();this.emit('room')}
 onFinalBossDefeated(){startRescue(this)}
 rescueLaugh(){return rescueLaugh(this)}
 update(dt,input={}){if(this.mode==='rescue'){updateRescue(this,dt);return}if(this.mode!=='play')return;dt=Math.min(dt,.04);const playerDt=dt,origin={x:this.p.x,y:this.p.y};dt*=chronoStep(this,playerDt);const p=this.p,r=this.room;for(const e of r.enemies){e.artX=e.x;e.artY=e.y}
 if(input.bomb&&!this.bombLatch&&this.bombs>0){this.bombs--;this.explosives.push({x:p.x,y:p.y,t:1.3});this.emit('room')}this.bombLatch=!!input.bomb;
 if(input.use&&!this.useLatch)this.interact();this.useLatch=!!input.use;if(this.mode!=='play')return;
 updateGear(this,dt);this.bootGuardCD=Math.max(0,(this.bootGuardCD||0)-dt);
 updateActive(this,playerDt,input);
 updateBarrels(this,dt);if(this.mode!=='play')return;
 updateResourceRoom(this,dt);updateDevices(this,dt);updateActors(this,dt);updateFinalFight(this,dt);updateMobs(this,dt);updateGround(this,dt);
 for(const bomb of this.explosives){bomb.t-=dt;if(bomb.t<=0)this.boom(bomb.x,bomb.y)}this.explosives=this.explosives.filter(b=>b.t>0);
 for(const e of r.enemies||[]){if(e.dead)continue;const dx=p.x-e.x,dy=p.y-e.y,len=Math.hypot(dx,dy)||1;
 e.repelled=Math.max(0,(e.repelled||0)-dt);if(e.type==='brute')e.r=23;if(!(e.repelled>0)&&e.type==='hopper'){e.attack=(e.attack||0)-dt;if(e.attack<=0&&e.wind<=0){e.wind=e.type==='hopper'?.65:.75;e.dx=dx/len;e.dy=dy/len;e.attack=e.type==='hopper'?2.6:e.enraged?2.2:2.7}if(e.wind>0){e.wind-=dt;if(e.wind<=0){e.vx=e.dx*(e.type==='hopper'?600:800);e.vy=e.dy*(e.type==='hopper'?600:800)}}}
 if(e.kind==='speaker'){e.r=54;updateSpeaker(this,e,dt)}
 }
 this.updateMilkBottles(dt);
 for(const fx of this.effects)if(fx.type==='trap'&&fx.life<.3&&Math.hypot(p.x-fx.x,p.y-fx.y)<60)this.hurt();
 const enemies=r.enemies.filter(e=>!e.dead);updateFollowers(this,dt);updateDeepseek(this,dt,playerDt,input);
 for(const b of this.bullets){const shotDt=b.pet?dt:playerDt;if(b.rollingRock)b.age+=dt;updateVoice(this,b,shotDt);if(b.homing&&!b.returning&&enemies.length){const e=enemies.reduce((a,e)=>Math.hypot(a.x-b.x,a.y-b.y)<Math.hypot(e.x-b.x,e.y-b.y)?a:e),a=Math.atan2(e.y-b.y,e.x-b.x);b.vx+=(Math.cos(a)*(b.shotSpeed||490)-b.vx)*shotDt*3;b.vy+=(Math.sin(a)*(b.shotSpeed||490)-b.vy)*shotDt*3}}
 const oldFloor=this.floor;super.update(dt,input,playerDt);if(this.room===r&&this.mode==='play'){updateMeme(this,playerDt,origin);afterChronoStep(this,playerDt,origin);updatePhoebe(this,dt,playerDt,origin);}for(const e of r.enemies){const dx=e.x-(e.artX??e.x),dy=e.y-(e.artY??e.y);e.artMoving=Math.hypot(dx,dy)>.08;if(Math.abs(dx)>.08)e.artFacing=dx>0?1:-1}if(this.floor!==oldFloor){this.emit('toast',{text:`第 ${this.floor} 章：${CHAPTERS[this.floor-1]}。继续寻找奶豆。`});return}

 if(this.mode!=='play'||this.room!==r)return;
 r.loot=r.loot.filter(l=>{if(l.type==='chest')return true;const mouse=this.followerStates?.mouse,collectedByMouse=mouse&&['coin','key','bomb'].includes(l.type)&&Math.hypot(mouse.x-l.x,mouse.y-l.y)<20;if(Math.hypot(p.x-l.x,p.y-l.y)>32&&!collectedByMouse)return true;if(collectedByMouse){mouse.flash=.25;this.effects.push({type:'petCollect',x:l.x,y:l.y,life:.3,max:.3,radius:20})}if(l.type==='heart'){if(p.hp>=p.maxHp)return true;p.hp=Math.min(p.maxHp,p.hp+l.amount)}else if(l.type==='coin')this.coins+=l.amount;else if(l.type==='key')this.keys+=l.amount;else if(l.type==='bomb')this.bombs+=l.amount;this.emit('room');return false});
 }
}
