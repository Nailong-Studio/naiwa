export const SERVICES=[
 {id:'service_reroll',icon:'↻',name:'刷新道具 · 4 金币',desc:'替换商店剩余的被动道具，每层限 2 次',cost:4,limit:2},
 {id:'service_shield',icon:'◈',name:'一次性护盾 · 5 金币',desc:'抵挡下一次伤害，每层限 1 次；已有护盾时不可买',cost:5,limit:1},
 {id:'service_charge',icon:'ϟ',name:'爆笑充能 · 4 金币',desc:'补满 Q 主动爆笑，每层限 1 次；已满时不可买',cost:4,limit:1},
 {id:'service_map',icon:'⌘',name:'隐藏房间情报 · 3 金币',desc:'直接标记本层真藏室，省去辨认真假墙缝；仍需炸墙，奖励可能为空，每层限 1 次',cost:3,limit:1}
];
export function shopServices(g){return SERVICES.filter(s=>(g.room.serviceUses?.[s.id]||0)<s.limit).map(s=>({...s,desc:s.desc+' · 剩余 '+(s.limit-(g.room.serviceUses?.[s.id]||0))+' 次'}))}
export function chooseService(g,id){const s=SERVICES.find(s=>s.id===id);if(!s)return null;
 if(g.room.type!=='shop'||g.mode!=='choice'||!g.choices.some(c=>c.id===id))return false;
 const used=g.room.serviceUses?.[id]||0;if(used>=s.limit)return false;
 const refuse=text=>{g.emit('toast',{text});return false};
 if(g.coins<s.cost)return refuse('金币不足，需要 '+s.cost+' 金币。');
 if(id==='service_shield'&&g.p.shield)return refuse('已有护盾，无法重复购买。');
 if(id==='service_charge'&&g.activeCharge>=g.activeCost())return refuse('爆笑已经充满，不需要购买。');
 if(id==='service_map'&&!g.rooms.some(r=>r.exists&&r.type==='cache'&&!r.revealed&&!r.visited))return refuse('本层隐藏藏室已经发现，不需要购买情报。');
 let stock;
 if(id==='service_reroll'){
  if(!g.room.shopStock?.length)return refuse('道具已售罄，没有可刷新的货架。');
  const previous=new Set(g.room.shopStock.map(i=>i.id));stock=g.drawItems(100).filter(i=>!previous.has(i.id)).slice(0,g.room.shopStock.length);
  if(stock.length<g.room.shopStock.length)return refuse('可替换道具不足，保留金币。');
 }
 g.coins-=s.cost;g.room.serviceUses??={};g.room.serviceUses[id]=used+1;
 if(id==='service_reroll')g.room.shopStock=stock;
 if(id==='service_shield')g.p.shield=true;
 if(id==='service_charge')g.activeCharge=g.activeCost();
 if(id==='service_map')for(const r of g.rooms)if(r.exists&&r.type==='cache'){r.seen=true;r.revealed=true}
 g.mode='play';g.emit('room');g.emit('toast',{text:id==='service_reroll'?'货架已刷新，按 E 查看新道具。':'已购买：'+s.name});return true;
}
