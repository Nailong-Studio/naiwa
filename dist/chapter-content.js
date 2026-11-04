import {MECHANIC_LAYOUTS} from './mechanic-layouts.js';
import {CHAPTER_MOBS} from './mob-catalog.js';
const tile=(c,r,kind)=>({x:116+c*52,y:92+r*52,w:48,h:48,r:24,kind,hp:kind==='crate'?3:Infinity});
const box=(c,r,w,h,kind)=>Array.from({length:w*h},(_,i)=>tile(c+i%w,r+Math.floor(i/w),kind));
export const CHAPTER_LAYOUTS=[
 [{id:'milk_aisles',name:'奶瓶货巷',hint:'奶箱里可能藏补给，留意地上的奶迹',build:()=>[...box(4,1,1,3,'crate'),...box(10,5,1,3,'crate'),...box(4,5,1,2,'rock'),...box(10,1,1,2,'rock')]},
  {id:'milk_drain',name:'溢奶排水沟',hint:'排水沟隔开火线，从中间缺口绕到投瓶怪身后',build:()=>[...box(3,3,4,1,'pit'),...box(8,5,4,1,'pit'),tile(3,6,'crate'),tile(11,2,'crate'),tile(7,2,'rock')]}],
 [{id:'sound_stage',name:'共振舞台',hint:'亮起的共振区即将爆发，趁暗下来换位',build:()=>[...box(3,2,1,2,'pillar'),...box(11,5,1,2,'pillar'),...box(6,2,3,1,'crate'),...box(6,6,3,1,'crate')]},
  {id:'sound_wings',name:'侧幕回廊',hint:'利用舞台侧翼挡音波，小心站桩音箱',build:()=>[...box(4,1,1,3,'pillar'),...box(10,5,1,3,'pillar'),...box(8,2,2,1,'pit'),...box(5,6,2,1,'pit'),tile(3,6,'crate'),tile(11,2,'crate')]}],
 [{id:'belt_cross',name:'交叉输送线',hint:'顺着传送带拉开距离，逆着走会更慢',build:()=>[...box(3,2,2,1,'crate'),...box(10,6,2,1,'crate'),tile(5,6,'pillar'),tile(9,2,'pillar')]},
  {id:'loading_bay',name:'分拣装卸口',hint:'搬运怪守着缺口，打碎货箱打开第二条路',build:()=>[...box(5,1,1,3,'rock'),...box(9,5,1,3,'rock'),...box(5,4,1,2,'crate'),...box(9,3,1,2,'crate')]}],
 [{id:'press_line',name:'拼装压机线',hint:'红框倒计时后压机落下，也会砸伤怪物',build:()=>[...box(3,2,1,2,'pillar'),...box(11,5,1,2,'pillar'),...box(5,6,2,1,'crate'),...box(8,2,2,1,'crate')]},
  {id:'reject_bins',name:'次品回收池',hint:'拼装怪会裂成小怪，利用回收池分开追兵',build:()=>[...box(4,2,2,2,'pit'),...box(9,5,2,2,'pit'),...box(3,6,2,1,'crate'),...box(10,2,2,1,'crate'),tile(7,4,'rock')]}],
 [{id:'cage_cells',name:'牢笼隔间',hint:'等电网熄灭再穿过去，站桩守卫射得很快',build:()=>[...box(4,1,1,3,'pillar'),...box(10,5,1,3,'pillar'),...box(4,5,1,2,'rock'),...box(10,2,1,2,'rock'),tile(7,2,'crate')]},
  {id:'warden_cross',name:'守卫交叉口',hint:'用牢柱隔开守卫火线，别在电网旁停留',build:()=>[...box(3,2,2,1,'pillar'),...box(10,6,2,1,'pillar'),...box(5,5,2,1,'pit'),...box(8,3,2,1,'pit'),tile(3,6,'crate'),tile(11,2,'crate')]}]
];
export {ENCOUNTERS} from './encounter-profiles.js';
export const THEMED_ENEMIES={milkleak:'漏奶怪',milkspitter:'投瓶哨兵',turret:'站桩炮台',soundTurret:'尖啸音箱',beatling:'节拍怪',loader:'铆钉装卸工',dollTurret:'拼装炮台',stitchling:'拼缝娃娃',tiny:'碎布小怪',warden:'牢笼哨兵',jailer:'追捕守卫'};

Object.assign(THEMED_ENEMIES,Object.fromEntries(Object.entries(CHAPTER_MOBS).map(([id,d])=>[id,d.name])));

// Keep the authored cover arrangements, but retire persistent floor machinery.
// Boss arenas and enemy-created hazards are installed by their own combat code.
const roomDetails={
 milk_valves:['错位奶箱间','打碎奶箱打开火线，沿石堆绕行'],milk_reservoir:['双沟储奶间','利用坑沟分开追兵，从缺口换位'],
 milk_aisles:['奶瓶货巷','打碎奶箱开路，石堆挡住追兵与火线'],milk_drain:['断沟回廊','从坑沟缺口绕到远程怪侧面'],
 echo_lanes:['侧台追逐廊','借两侧掩体换位，避免被追兵夹击'],duet_stage:['双柱舞台','利用两根舞台柱切断远程火线'],
 sound_stage:['箱阵舞台','打碎箱阵获得新的射击路线'],sound_wings:['侧幕回廊','利用侧翼挡音波，从缺口换边'],
 reversing_sorter:['错位分拣间','利用错位货堆拆分追击路线'],lift_conveyors:['纵横货栈','打碎中间货箱，切断投包裹工的视线'],
 belt_cross:['交叉堆货场','绕过货堆换边，保持退路'],loading_bay:['分拣装卸口','打碎货箱打开第二条路'],
 assembly_feeders:['零件堆放间','利用箱堆与石堆切断火线'],scrap_workshop:['废偶返修间','打碎箱墙开路，优先处理缝补工'],
 press_line:['拼装车间','沿立柱绕行，从侧面接近炮台'],reject_bins:['次品回收池','利用回收池分开追兵'],
 power_cells:['双柱牢房','利用牢柱挡弹，留意两侧追兵'],prison_circuit:['错位牢箱廊','拆开封箱改变通路，从侧面接近守卫'],
 cage_cells:['牢笼隔间','利用牢柱分割守卫火线'],warden_cross:['守卫交叉口','沿掩体换位，别被追兵堵在坑边']
};
for(let i=0;i<5;i++){
 const covers=MECHANIC_LAYOUTS[i].map(({id,build})=>({id,build:()=>build().filter(o=>!o.device)}));
 CHAPTER_LAYOUTS[i].unshift(...covers);
 for(const layout of CHAPTER_LAYOUTS[i]){const [name,hint]=roomDetails[layout.id];Object.assign(layout,{name,hint})}
}
