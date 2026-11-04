const tile=(c,r,kind)=>({x:116+c*52,y:92+r*52,w:48,h:48,r:24,kind,hp:kind==='crate'?3:Infinity});
const row=(c,r,n,kind)=>Array.from({length:n},(_,i)=>tile(c+i,r,kind));
const device=(x,y,kind,channel='a')=>({x,y,w:40,h:40,r:20,device:true,kind,channel,hp:kind==='assembler'?6:4,maxHp:kind==='assembler'?6:4,disabled:0,timer:3.5,spawned:0});
const h=(x,y,w,height,kind,extra={})=>({x,y,w,h:height,kind,phase:0,...extra});
export const MECHANIC_LAYOUTS=[
 [
  {id:'milk_valves',name:'泄奶阀间',hint:'打破奶阀，清走附近敌方奶迹并反向喷奶',build:()=>[device(350,190,'milkValve'),device(610,410,'milkValve'),...row(3,5,3,'crate'),...row(9,2,3,'rock')]},
  {id:'milk_reservoir',name:'奶池泄流口',hint:'绕过两座奶池，从侧面打掉奶阀清出安全地面',build:()=>[...row(3,3,4,'pit'),...row(8,5,4,'pit'),device(610,195,'milkValve'),device(350,410,'milkValve'),tile(7,2,'crate')]}
 ],
 [
  {id:'echo_lanes',name:'三拍共振廊',hint:'三条音波带依次亮起；打掉共振器能停机 4 秒',build:()=>[device(220,200,'resonator'),...row(10,2,2,'crate'),...row(3,6,2,'pillar')],hazards:()=>[0,1,2].map(i=>h(480,200+i*100,340,40,'resonance',{phase:i*1.1,channel:'a'}))},
  {id:'duet_stage',name:'双声道舞台',hint:'左右舞台交错共振，分别击打两侧音箱关闭对应区域',build:()=>[device(220,180,'resonator','a'),device(740,420,'resonator','b'),tile(7,2,'pillar'),tile(7,6,'pillar')],hazards:()=>[h(300,320,200,110,'resonance',{channel:'a'}),h(660,280,200,110,'resonance',{phase:1.9,channel:'b'})]}
 ],
 [
  {id:'reversing_sorter',name:'换向分拣带',hint:'两条传送带每 4 秒换向；借顺风绕开叉车的锁定路线',build:()=>[...row(5,2,2,'crate'),...row(8,6,2,'crate'),tile(3,2,'pillar'),tile(11,6,'pillar')],hazards:()=>[h(310,300,100,300,'belt',{dx:1,dy:0,reverse:true,power:120}),h(650,300,100,300,'belt',{dx:-1,dy:0,reverse:true,power:120})]},
  {id:'lift_conveyors',name:'纵横转运口',hint:'竖向传送带会把你送向侧路，利用货箱切断投包裹工的视线',build:()=>[...row(4,4,2,'crate'),...row(9,4,2,'crate'),tile(7,2,'pillar'),tile(7,6,'pillar')],hazards:()=>[h(280,300,95,300,'belt',{dx:0,dy:1,reverse:true,power:110}),h(680,300,95,300,'belt',{dx:0,dy:-1,reverse:true,power:110})]}
 ],
 [
  {id:'assembly_feeders',name:'造偶投料线',hint:'造怪口会吐出碎布怪；打掉 6 血的机器，或引怪走进压机',build:()=>[device(240,190,'assembler'),...row(8,2,3,'crate'),...row(3,6,3,'rock')],hazards:()=>[h(400,300,95,150,'press'),h(660,300,95,150,'press',{phase:2.25})]},
  {id:'scrap_workshop',name:'废偶返修间',hint:'优先摧毁造怪口、打断缝补工；两组压机交替落下',build:()=>[device(720,190,'assembler'),tile(4,2,'pillar'),tile(10,6,'pillar'),...row(5,5,3,'crate')],hazards:()=>[h(300,290,130,90,'press'),h(660,390,130,90,'press',{phase:2.25})]}
 ],
 [
  {id:'power_cells',name:'双路供电牢房',hint:'击坏紫色供电柱可关闭对应电网 4 秒，趁断电穿越火线',build:()=>[device(230,190,'relay','a'),device(730,410,'relay','b'),tile(7,2,'pillar'),tile(7,6,'pillar')],hazards:()=>[h(330,300,55,260,'electric',{channel:'a'}),h(630,300,55,260,'electric',{phase:1.9,channel:'b'})]},
  {id:'prison_circuit',name:'巡灯断电廊',hint:'探照眼交叉射击；炸弹也能打断供电，中央留有换位缺口',build:()=>[device(220,400,'relay'),device(740,200,'relay','b'),...row(4,2,2,'crate'),...row(9,6,2,'crate')],hazards:()=>[h(310,260,220,45,'electric',{channel:'a'}),h(650,340,220,45,'electric',{phase:1.9,channel:'b'})]}
 ]
];
