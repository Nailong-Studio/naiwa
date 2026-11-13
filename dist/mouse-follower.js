import {roomNeighbors} from './resource-scenes.js';
import {shotLaneOpen} from './terrain.js';

export const MOUSE={damage:1.5,cooldown:3.2,range:400,stashLimit:3};
import {itemCombatEncounter} from './combat-values.js';
const combat=g=>itemCombatEncounter(g.room);
const grounded=e=>e&&!e.dead&&!e.airborne&&!['fly','hopper'].includes(e.type);
function recover(s,cd=MOUSE.cooldown){s.phase='recover';s.clock=0;s.cd=cd;s.target=null}
function steal(g,s){
 const r=g.room;
 // The room ledger survives leaving, saving, and reloading; a new floor has new rooms.
 if(r.mouseSupplied||g.rooms.filter(room=>room.mouseSupplied).length>=MOUSE.stashLimit)return;
 const available=type=>g.rooms.reduce((n,room)=>n+room.loot.filter(l=>l.type===type).reduce((a,l)=>a+l.amount,0),0);
 const type=g.keys+available('key')===0?'key':g.bombs+available('bomb')===0?'bomb':'coin',amount=type==='coin'?2:1;
 r.mouseSupplied=true;
 g.drop(type,s.x,s.y,amount);
 g.effects.push({type:'mouseSteal',x:s.x,y:s.y-12,resource:type,amount,life:.9,max:.9});
 g.emit('room');
}

export function updateMouse(g,s,home,dt,travel){
 s.secretDoor=null;
 const active=combat(g),target=s.target;
 if((s.phase==='windup'||s.phase==='lunge')&&(!active||!grounded(target)||!g.room.enemies.includes(target)||Math.hypot(target.x-g.p.x,target.y-g.p.y)>500))recover(s,.65);
 if(s.phase==='windup'){
  s.face=target.x>s.x?1:-1;
  if(s.clock>=.16){s.phase='lunge';s.clock=0}
  return;
 }
 if(s.phase==='lunge'){
  if(s.clock>1.4){recover(s,.65);return}
  travel(g,s,target,440,dt);
  if(Math.hypot(target.x-s.x,target.y-s.y)<target.r+12&&shotLaneOpen(g.room,s,target)){
   // Contact is required. Stealing is utility; the bite never inherits player attack boosts.
   steal(g,s);g.damageEnemy(target,MOUSE.damage);
   g.effects.push({type:'petImpact',x:s.x,y:s.y,life:.2,max:.2,radius:17});
   recover(s);
  }
  return;
 }
 if(s.phase==='recover'&&s.clock<.28){travel(g,s,home,330,dt);return}
 const loot=g.room.loot.filter(l=>['coin','key','bomb'].includes(l.type)&&Math.hypot(l.x-g.p.x,l.y-g.p.y)<360).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y))[0];
 if(loot){s.phase='collect';travel(g,s,loot,390,dt);return}
 if(active&&s.cd<=0){
  const next=g.room.enemies.filter(e=>grounded(e)&&Math.hypot(e.x-g.p.x,e.y-g.p.y)<MOUSE.range).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y))[0];
  if(next){s.target=next;s.phase='windup';s.clock=0;s.face=next.x>s.x?1:-1;return}
 }
 const door=g.room.clear?roomNeighbors(g).find(d=>{const r=g.rooms[d.id];return r.hidden&&r.bombLocked&&!r.revealed}):null;
 const sniff=door?{x:Math.max(78,Math.min(882,door.x)),y:Math.max(78,Math.min(522,door.y))}:null;
 travel(g,s,sniff||home,280,dt);s.phase=sniff?'sniff':'idle';s.secretDoor=door;
 if(door&&Math.hypot(s.x-sniff.x,s.y-sniff.y)<25&&g.room.mouseHint!==door.id){g.room.mouseHint=door.id;g.emit('toast',{text:'奶鼠闻到了隐藏门！跟着奶鼠，到它指向的墙边放炸弹。'})}
}
