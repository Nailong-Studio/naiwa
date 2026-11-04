const tile=(c,r,kind,extra={})=>({x:116+c*52,y:92+r*52,w:48,h:48,r:24,kind,hp:kind==='crate'?3:Infinity,...extra});
const row=(c,r,n,kind)=>Array.from({length:n},(_,i)=>tile(c+i,r,kind));
export const TACTICAL_LAYOUTS=[
 {id:'breach_court',name:'破箱突围庭',profiles:[1,3,7],hint:'箱墙隔断火线；击爆中间的桶可拆墙伤敌，注意红圈',build:()=>[...row(5,3,5,'crate'),...row(5,5,5,'crate'),tile(3,3,'pillar'),tile(11,5,'pillar'),tile(7,4,'barrel',{w:38,h:44,r:22,hp:2})],hazards:()=>[]},
 {id:'bridge_choice',name:'炸石搭桥渠',profiles:[2,5,6],hint:'外围可以绕行；炸掉标有箭头的桥石，可填平旁边坑洞开近路',build:()=>[...row(3,3,4,'pit'),...row(8,5,4,'pit'),tile(5,2,'rock',{bridgeTo:{x:376,y:248}}),tile(9,6,'rock',{bridgeTo:{x:584,y:352}}),tile(3,6,'crate'),tile(11,2,'crate')],hazards:()=>[]},
 {id:'hook_corridor',name:'双钩绕行廊',profiles:[0,4,6],hint:'石墙让追兵绕路；把怪引向爆裂桶，连锁爆炸有独立预警',build:()=>[...row(3,2,3,'rock'),tile(5,3,'rock'),tile(5,4,'crate'),...row(9,6,3,'rock'),tile(9,5,'rock'),tile(9,4,'crate'),tile(7,3,'barrel',{w:38,h:44,r:22,hp:2}),tile(7,5,'barrel',{w:38,h:44,r:22,hp:2})] ,hazards:()=>[]},
 {id:'cover_exchange',name:'错位换防场',profiles:[1,3,7],hint:'掩体之间留有横向通路，换掩体接近射手；拆箱也会暴露自己',build:()=>[...row(3,3,2,'pillar'),...row(10,5,2,'pillar'),...row(6,2,3,'crate'),...row(6,6,3,'crate'),tile(3,6,'rock'),tile(11,2,'rock')],hazards:()=>[]}
];
const preferences={
 shelves:[1,3,7],island:[2,5],slalom:[0,4,6],cross:[1,6,7],bridge:[2,5],bunker:[1,3],shortcut:[0,3,4],banks:[1,2,5],twin_nests:[1,3],broken_ring:[0,4,6],crate_steps:[0,3,7],split_pools:[2,5],
 milk_valves:[2,3],milk_reservoir:[2,5],milk_aisles:[0,4,6],milk_drain:[1,7],echo_lanes:[0,2,6],duet_stage:[1,3],sound_stage:[4,7],sound_wings:[1,5],reversing_sorter:[0,4,6],lift_conveyors:[1,7],belt_cross:[2,5],loading_bay:[3,4],assembly_feeders:[0,2,6],scrap_workshop:[3,4],press_line:[1,7],reject_bins:[2,5],power_cells:[2,3],prison_circuit:[1,7],cage_cells:[0,4],warden_cross:[5,6]
};
export function layoutAffinity(layout,profile){return (layout.profiles||preferences[layout.id]||[]).includes(profile)?1:0}
export function selectLayouts(g,common,chapters){
 const rooms=g.rooms.filter(r=>r.exists&&['fight','challenge'].includes(r.type)),remaining=[...rooms],result=new Map();
 function assign(layout){const best=Math.max(...remaining.map(r=>layoutAffinity(layout,r.encounterProfile))),options=remaining.filter(r=>layoutAffinity(layout,r.encounterProfile)===best);const room=options[Math.floor(g.random()*options.length)];result.set(room.id,layout);remaining.splice(remaining.indexOf(room),1)}
 // Chapter cover layouts are paired with suitable squads instead of map index.
 for(const layout of chapters)if(remaining.length)assign(layout);
 const tactical=TACTICAL_LAYOUTS.filter(l=>remaining.some(r=>layoutAffinity(l,r.encounterProfile)));
 if(remaining.length)assign(tactical[Math.floor(g.random()*tactical.length)]||TACTICAL_LAYOUTS[0]);
 const available=common.filter(l=>![...result.values()].includes(l));
 for(const room of remaining){const best=Math.max(...available.map(l=>layoutAffinity(l,room.encounterProfile))),options=available.filter(l=>layoutAffinity(l,room.encounterProfile)===best),layout=options[Math.floor(g.random()*options.length)];result.set(room.id,layout);available.splice(available.indexOf(layout),1)}
 return result;
}
export function fillBridgeSlots(room,broken){
 const filled=[];for(const rock of broken){if(!rock.bridgeTo)continue;const pit=room.obstacles.find(o=>o.kind==='pit'&&o.x===rock.bridgeTo.x&&o.y===rock.bridgeTo.y);if(!pit)continue;room.obstacles=room.obstacles.filter(o=>o!==pit);const bridge={x:pit.x,y:pit.y,w:pit.w,h:pit.h};(room.bridges??=[]).push(bridge);filled.push(bridge)}return filled;
}
