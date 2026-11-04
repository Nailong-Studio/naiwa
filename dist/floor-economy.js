// Trading state belongs to the run and floor, not to a room's entry lifecycle.
export function bindFloorEconomy(g){
 g.floorEconomy??={};
 const state=g.floorEconomy[g.floor]??={exchanges:{},stock:null,services:{},sold:[]};
 for(const room of g.rooms){
  if(!room.exists)continue;
  const fields=room.type==='start'?{exchanges:'exchanges'}:room.type==='shop'?{shopStock:'stock',serviceUses:'services',shopSold:'sold'}:{};
  for(const [field,key] of Object.entries(fields))Object.defineProperty(room,field,{enumerable:true,configurable:true,get:()=>state[key],set:value=>{state[key]=value}});
 }
}
