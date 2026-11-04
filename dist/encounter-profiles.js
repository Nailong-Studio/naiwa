// A room has a clear combat theme; its roster is fixed when the floor is built.
export const ENCOUNTER_PROFILES=[
 {id:'pursuit',name:'追击群',formation:'pincer',hint:'地面追兵为主，边移动边清出退路。'},
 {id:'battery',name:'炮台阵地',formation:'rear',hint:'固定火力守后排，借掩体逐个突破。'},
 {id:'hazard',name:'封路小队',formation:'split',hint:'优先处理制造危险区域的怪，别让退路被封住。'},
 {id:'escort',name:'核心护卫',formation:'escort',hint:'核心怪躲在护卫后方，绕侧面先处理它。'},
 {id:'heavy',name:'重装队',formation:'line',hint:'耐打的前排推进，利用障碍分开它们。'},
 {id:'airborne',name:'飞扑巢',formation:'ring',hint:'飞扑怪能越过坑洞，保持移动，不要依赖地形挡追兵。'},
 {id:'flank',name:'两翼夹攻',formation:'pincer',hint:'两侧都有追兵，先集中清掉一翼。'},
 {id:'skirmish',name:'游击小队',formation:'split',hint:'移动射手配合近身怪，追击时留意背后。'}
];
// Six authored slots, followed by repeats from this same small roster.
// Runners and support units remain limited to one; rapid stationary fire to three.
export const ENCOUNTERS=[
 [
  ['runner','milkSkater','milkleak','milkSkater','milkleak','milkSkater'],
  ['milkspitter','turret','milkspitter','shooter','shooter','shooter'],
  ['curdling','milkleak','milkSkater','curdling','milkleak','milkSkater'],
  ['milkspitter','brute','milkSkater','brute','milkSkater','brute'],
  ['brute','curdling','brute','curdling','brute','curdling'],
  ['hopper','hopper','milkSkater','hopper','hopper','milkSkater'],
  ['runner','curdling','milkSkater','curdling','milkSkater','curdling'],
  ['shooter','milkleak','shooter','milkleak','shooter','milkleak']
 ],
 [
  ['runner','beatling','beatling','brute','beatling','beatling'],
  ['echoBell','soundTurret','echoBell','shooter','shooter','shooter'],
  ['soundTurret','beatling','echoBell','beatling','beatling','beatling'],
  ['conductor','brute','beatling','brute','beatling','brute'],
  ['brute','brute','soundTurret','brute','brute','brute'],
  ['hopper','hopper','beatling','hopper','hopper','beatling'],
  ['runner','beatling','echoBell','beatling','echoBell','beatling'],
  ['shooter','conductor','beatling','shooter','beatling','shooter']
 ],
 [
  ['runner','loader','loader','forklift','loader','loader'],
  ['turret','parcelThrower','turret','parcelThrower','turret','parcelThrower'],
  ['parcelThrower','forklift','loader','parcelThrower','loader','loader'],
  ['parcelThrower','brute','loader','brute','loader','brute'],
  ['forklift','brute','forklift','brute','brute','brute'],
  ['hopper','hopper','loader','hopper','hopper','loader'],
  ['runner','forklift','loader','forklift','loader','loader'],
  ['shooter','loader','parcelThrower','loader','shooter','loader']
 ],
 [
  ['runner','stitchling','scrapMine','stitchling','scrapMine','stitchling'],
  ['dollTurret','shooter','dollTurret','shooter','dollTurret','shooter'],
  ['scrapMine','scrapMine','stitchling','scrapMine','scrapMine','stitchling'],
  ['stitchMedic','brute','stitchling','brute','stitchling','brute'],
  ['brute','stitchling','brute','stitchling','brute','stitchling'],
  ['hopper','hopper','scrapMine','hopper','hopper','scrapMine'],
  ['runner','stitchling','dollTurret','stitchling','dollTurret','stitchling'],
  ['shooter','scrapMine','shooter','stitchling','shooter','scrapMine']
 ],
 [
  ['runner','jailer','jailer','brute','jailer','jailer'],
  ['prismEye','warden','prismEye','shooter','shooter','shooter'],
  ['lockSentry','jailer','lockSentry','jailer','lockSentry','jailer'],
  ['lockSentry','brute','jailer','brute','jailer','brute'],
  ['brute','warden','brute','brute','warden','brute'],
  ['hopper','hopper','jailer','hopper','hopper','jailer'],
  ['runner','jailer','prismEye','jailer','prismEye','jailer'],
  ['shooter','jailer','lockSentry','shooter','jailer','shooter']
 ]
];
const CHAPTER_NAMES=[
 ['滑奶追逐场','投瓶炮台阵','溢奶封路间','奶瓶护送队','胀奶重装队','奶棚飞扑巢','街角两面夹击','漏奶游击队'],
 ['节拍追逐场','回声炮台阵','尖啸封路间','指挥护卫队','剧场重装队','侧幕飞扑巢','双翼夹奏间','流动乐队'],
 ['搬运追逐场','装卸火力点','包裹封路间','投包护卫队','叉车重装队','高架飞扑巢','两线包抄队','运输游击队'],
 ['废偶追逐场','拼装炮台阵','自爆废料间','缝补护卫队','次品重装队','废料飞扑巢','两翼拼缝队','废偶游击队'],
 ['狱卒追逐场','探照炮台阵','封锁巡逻间','封路护卫队','牢笼重装队','牢顶飞扑巢','双侧追捕队','巡逻游击队']
];
export function profileIndex(room){return room.encounterProfile??Math.floor(room.seed||0)%ENCOUNTER_PROFILES.length}
export function describeEncounter(room,floor){const index=profileIndex(room);room.encounterName=CHAPTER_NAMES[floor-1][index];room.encounterHint=floor===2?['鼓仔停顿后会冲刺，侧移躲开再反击。','回声会折返；借掩体挡音箱，别急着回到原位。','留意音箱火线与回声的回程，绕开交叉区域。','先打指挥，取消尚未发动的合拍冲刺。','重装怪逼近时留意音箱蓄势，绕柱分开处理。','飞扑与踩拍冲刺轮流进攻，抓住落拍空档。','两侧鼓仔会冲刺，回声还会折返，先清掉一翼。','指挥会催动附近鼓仔，先处理辅助再追射手。'][index]:ENCOUNTER_PROFILES[index].hint;return ENCOUNTER_PROFILES[index]}
export function installEncounters(g){
 const used=Array(ENCOUNTER_PROFILES.length).fill(0);let previous=-1;
 for(const room of g.rooms.filter(r=>r.exists&&['fight','challenge'].includes(r.type))){
  const neighborProfiles=new Set(g.neighbors(room.id).map(id=>g.rooms[id].encounterProfile));
  let options=used.map((_,i)=>i).filter(i=>i!==previous&&!neighborProfiles.has(i));
  const least=Math.min(...options.map(i=>used[i]));options=options.filter(i=>used[i]===least);
  const index=options[Math.floor(g.random()*options.length)];room.encounterProfile=index;used[index]++;previous=index;describeEncounter(room,g.floor);
 }
}
const LIMITED=new Set(['runner','conductor','stitchMedic']);
const FIXED_FIRE=new Set(['turret','milkspitter','soundTurret','dollTurret','warden','echoBell','prismEye']);
export function encounterRoster(room,floor,count){
 const types=ENCOUNTERS[floor-1][profileIndex(room)],result=[];
 for(let i=0;i<count;i++){
  const candidates=i<types.length?[types[i]]:types.slice(1);
  const allowed=candidates.filter(t=>(!LIMITED.has(t)||!result.includes(t))&&(!FIXED_FIRE.has(t)||result.filter(v=>FIXED_FIRE.has(v)).length<3));
  // Every profile includes a repeatable mobile unit, including artillery rooms.
  const fallback=types.filter(t=>!LIMITED.has(t)&&!FIXED_FIRE.has(t));
  const pool=allowed.length?allowed:fallback;result.push(pool[(i+Math.floor((room.seed||0)/8))%pool.length]);
 }
 return result;
}
export function formationTarget(profile,i,count,player){
 // Orient front/back against the entry side, leaving the player's entrance clear.
 const dx=480-player.x,dy=300-player.y,horizontal=Math.abs(dx)>=Math.abs(dy),sign=(horizontal?dx:dy)>=0?1:-1;
 let depth=0,lateral=0;
 if(profile.formation==='rear'){depth=.65-(i%3)*.18;lateral=-.8+1.6*Math.floor(i/3)/Math.max(1,Math.ceil(count/3)-1)}
 else if(profile.formation==='escort'){depth=i===0?.75:.1+(Math.floor((i-1)/2)%3)*.2;lateral=i===0?0:(i%2?-.55:.55)}
 else if(profile.formation==='pincer'){depth=-.1+Math.floor(i/2)*.16;lateral=i%2?-.7:.7}
 else if(profile.formation==='line'){depth=-.05+Math.floor(i/3)*.22;lateral=(i%3-1)*.6}
 else if(profile.formation==='ring'){const angle=i*Math.PI*2/count;depth=Math.cos(angle)*.6+.1;lateral=Math.sin(angle)*.78}
 else{depth=i%2?.6:0;lateral=-.8+1.6*Math.floor(i/2)/Math.max(1,Math.ceil(count/2)-1)}
 return horizontal?{x:480+sign*depth*300,y:300+lateral*190}:{x:480+lateral*310,y:300+sign*depth*190};
}
