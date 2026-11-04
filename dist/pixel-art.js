import {drawEnhancedShot} from './item-vfx.js';
import {drawAnimatedEnemy,drawBrightRoom} from './sprite-art.js';
// Pixel silhouettes and a restrained palette keep combat cues readable at phone sizes.
const ink='#29313d',cream='#fff1c8';
export const PIXEL_THEMES=[
 {floor:'#b6bfa0',tile:'#a8b590',wall:'#526759',edge:'#344944',light:'#d4d9b4',accent:'#e9d49a'},
 {floor:'#aaa5bc',tile:'#9c96af',wall:'#514c69',edge:'#333348',light:'#d2c6db',accent:'#d9b3d6'},
 {floor:'#b8ad91',tile:'#a99e83',wall:'#685b45',edge:'#3e3b36',light:'#d8c69d',accent:'#e9b95d'},
 {floor:'#a6b4bd',tile:'#97a6b1',wall:'#4c6072',edge:'#303d4e',light:'#cbd5d9',accent:'#dfb0bd'},
 {floor:'#af9ca8',tile:'#a08b9a',wall:'#594858',edge:'#322d3c',light:'#d1b8c6',accent:'#d7a378'}
];
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h)};
function box(c,x,y,w,h,color){rect(c,x,y,w,h,ink);rect(c,x+1,y+1,w-2,h-2,color);rect(c,x+2,y+1,w-4,1,'#fff7df55')}
function body(c,color,w=20,h=18){rect(c,-w/2+3,-h/2-1,w-6,h+2,ink);rect(c,-w/2,-h/2+3,w,h-6,ink);rect(c,-w/2+1,-h/2+2,w-2,h-4,color);rect(c,-w/2+3,-h/2,w-6,h,color);rect(c,-w/2+4,-h/2+1,w-8,2,'#fff3c655');rect(c,-w/2+3,h/2-2,w-6,2,'#29313d33')}
function eyes(c,y=-4,angry=false){for(const x of [-6,3]){rect(c,x,y,4,5,cream);rect(c,x+2,y+1,2,3,ink);if(angry)rect(c,x,y-1,4,1,ink)}}
function speaker(c){box(c,-10,-12,20,25,'#655b81');for(const y of [-6,5]){box(c,-6,y-4,12,9,'#b8a4cb');box(c,-3,y-2,6,5,ink)}rect(c,-11,13,22,3,ink)}
export function drawPixelEnemy(c,e,t=0){
 if(drawAnimatedEnemy(c,e,t))return;
 c.save();c.translate(Math.round(e.x),Math.round(e.y));const boss=e.type==='boss',s=boss?3:2;
 rect(c,boss?-44:-22,boss?34:18,boss?88:44,boss?10:6,'#25343935');
 const bob=boss?0:Math.round(Math.sin((e.t||t)*7));
 const lift=e.airborne?Math.sin(Math.min(1,(e.sound?.t||0)/.8)*Math.PI)*130:0;
 c.translate(0,bob-lift);c.scale(s,s);
 const k=e.kind||e.type;
 if(boss){
  body(c,({collector:'#dfc27c',speaker:'#786c8e',catcher:'#bc9868',puppet:'#c79ba5',bull:'#c08859',meishu:'#c9ae65'})[k]||'#b2ae92',30,28);
  if(k==='speaker'){c.save();c.scale(1.3,1.3);speaker(c);c.restore();rect(c,-18,-7,3,15,'#b594c9');rect(c,15,-7,3,15,'#b594c9')}
  else{eyes(c,-6,true);box(c,-7,3,14,6,ink);rect(c,-5,4,10,2,cream)}
  if(k==='collector'){box(c,-18,9,36,9,'#5e6c6d');for(const x of [-14,9])box(c,x,16,7,5,ink);box(c,-4,-24,8,12,cream);rect(c,-3,-26,6,3,'#df8f69')}
  if(k==='catcher'){for(const d of [-1,1]){rect(c,d<0?-26:15,-3,11,5,'#916d51');box(c,d<0?-29:24,0,5,13,'#c6a97c');box(c,d<0?-31:23,10,8,7,'#e6c69a')}rect(c,-11,-17,22,4,'#e6b24f');rect(c,-2,-20,4,4,cream)}
  if(k==='puppet'){for(let y=-13;y<14;y+=4){rect(c,0,y,1,3,ink);rect(c,-2,y+1,5,1,ink)}box(c,-11,-9,7,7,'#d4c8b2');rect(c,-9,-7,3,3,ink);rect(c,9,7,5,6,'#92b9af');rect(c,-3,-21,6,6,'#8f657c');rect(c,0,-27,1,6,ink)}
  if(k==='bull'){for(const d of [-1,1]){rect(c,d<0?-20:14,-20,6,10,cream);rect(c,d<0?-22:19,-25,3,10,cream)}box(c,-10,0,20,10,'#d5ab7b');rect(c,-6,3,3,3,ink);rect(c,3,3,3,3,ink);rect(c,-13,-15,26,3,'#a74c4d')}
  if(k==='meishu'){for(const x of [-15,8]){box(c,x,-27,7,16,'#d9bc76');rect(c,x+2,-24,3,10,'#d38b99')}rect(c,-14,-8,28,6,ink);rect(c,-10,-7,7,2,'#d2e4df');rect(c,3,-7,7,2,'#d2e4df');rect(c,14,6,7,3,'#c294ae');rect(c,19,1,3,7,'#c294ae')}
 }else if(['soundTurret','echoBell','beatling','conductor'].includes(k)){
  if(k==='soundTurret')speaker(c);
  if(k==='echoBell'){rect(c,-2,-16,4,4,ink);body(c,'#b8a0d1',16,19);rect(c,-12,7,24,4,ink);rect(c,-10,7,20,2,'#e0c4ed');rect(c,-2,11,4,3,'#e8cb8b');eyes(c,-4)}
  if(k==='beatling'){box(c,-12,-8,24,17,'#b785a6');rect(c,-11,-7,22,3,'#ecd3bd');rect(c,-11,5,22,3,'#ecd3bd');for(const x of [-9,-3,3,9])rect(c,x,-3,1,7,ink);box(c,-10,-16,3,9,'#e5ce9b');box(c,7,-16,3,9,'#e5ce9b');eyes(c,-3)}
  if(k==='conductor'){body(c,'#9684bb',17,20);rect(c,-11,-12,22,3,ink);box(c,-7,-20,14,9,'#625574');eyes(c,-5);rect(c,-1,2,2,9,cream);rect(c,9,-8,10,2,cream);rect(c,17,-12,2,5,cream)}
 }else if(['turret','milkspitter','dollTurret','warden','prismEye'].includes(k)){
  const color=k==='milkspitter'?'#eddbb6':k==='dollTurret'?'#b58b9e':k==='warden'?'#9d89aa':'#7e9d97';box(c,-11,-11,22,23,color);rect(c,-13,11,26,4,ink);box(c,-7,-7,14,14,'#e8dec3');box(c,-3,-3,6,6,ink);
  if(k==='milkspitter'){box(c,-4,-19,8,8,cream);rect(c,-4,-20,8,3,'#cc8b67')}
  if(k==='warden'){rect(c,-13,-14,26,4,ink);rect(c,-2,-14,4,3,'#e2b969')}
  if(k==='prismEye'){rect(c,-2,-18,4,6,'#d9b66a');rect(c,-2,14,4,4,'#d9b66a');rect(c,-18,-2,6,4,'#d9b66a');rect(c,12,-2,6,4,'#d9b66a');rect(c,-1,-2,2,4,'#eb8590')}
 }else if(k==='forklift'){
  box(c,-12,-9,24,19,'#d4b45c');box(c,-8,-15,16,10,'#697d85');rect(c,-6,-13,12,3,'#c9d8cb');for(const x of [-12,7])box(c,x,8,5,6,ink);rect(c,-13,1,26,3,ink);rect(c,10,5,10,3,'#e4ce97');rect(c,17,-1,3,6,'#e4ce97');rect(c,-2,-18,4,3,'#dd805c')
 }else{
  const palette={brute:'#91ac6e',hopper:'#6e8792',runner:'#cf916b',milkleak:'#e4c78e',curdling:'#eddfaf',milkSkater:'#93bdb0',loader:'#bfa471',parcelThrower:'#bf986e',stitchling:'#c4a2ab',tiny:'#c6b7a7',stitchMedic:'#a8bdb0',scrapMine:'#c98985',jailer:'#ae90a2',lockSentry:'#9786b2'};
  if(k==='hopper'){rect(c,-18,-10,12,5,'#e0eee4');rect(c,6,-10,12,5,'#e0eee4');rect(c,-16,-5,8,3,'#abc8cd');rect(c,8,-5,8,3,'#abc8cd')}
  body(c,palette[k]||'#91a68b',k==='tiny'?12:21,k==='tiny'?12:20);eyes(c,-4,k==='runner'||k==='jailer');rect(c,-3,5,6,2,ink);
  const stride=Math.sin((e.t||t)*12)>0?1:-1;rect(c,-8,10+stride,6,3,ink);rect(c,3,10-stride,6,3,ink);
  if(['milkleak','curdling'].includes(k)){box(c,-4,-17,8,8,cream);rect(c,-5,-19,10,3,'#d89e76');rect(c,-6,4,4,6,cream);rect(c,4,6,4,4,cream)}
  if(k==='milkSkater'){rect(c,-13,12,26,3,ink);rect(c,-10,15,4,3,'#719a9c');rect(c,6,15,4,3,'#719a9c');rect(c,-11,-11,22,3,'#e5cc87')}
  if(k==='runner'){rect(c,-11,2,22,3,'#c95565');rect(c,-18,0,8,3,'#c95565');rect(c,-20,-2,5,3,'#c95565')}
  if(['loader','parcelThrower'].includes(k)){rect(c,-12,-11,24,4,'#e5ba64');box(c,5,0,13,12,'#c39865');rect(c,10,1,2,10,'#efdab0')}
  if(['stitchling','tiny','stitchMedic','scrapMine'].includes(k)){for(let y=-9;y<10;y+=4){rect(c,0,y,1,3,ink);rect(c,-2,y+1,5,1,ink)}if(k==='stitchMedic'){box(c,-7,-16,14,7,cream);rect(c,-1,-15,2,5,'#ad5e6b');rect(c,-3,-13,6,1,'#ad5e6b')}if(k==='scrapMine'){box(c,-4,-17,8,6,'#d2b671');rect(c,-1,-20,2,5,ink)}}
  if(['jailer','lockSentry'].includes(k)){rect(c,-12,-13,24,4,ink);rect(c,-2,-14,4,3,'#e3bf7b');box(c,10,0,8,9,'#d4bd7b');rect(c,12,2,4,3,ink)}
 }
 c.restore();
}
export function drawPixelFloor(c,room,floor){
 if(drawBrightRoom(c,room,floor))return;
 const p=PIXEL_THEMES[floor-1];rect(c,0,0,960,600,p.edge);rect(c,20,20,920,560,p.wall);rect(c,38,38,884,524,p.light);rect(c,47,47,866,506,p.floor);
 c.save();c.beginPath();c.rect(47,47,866,506);c.clip();
 for(let y=48;y<553;y+=48)for(let x=48;x<913;x+=48){const n=Math.floor((x*13+y*7+(room.seed||0)*3)%17);if(n<6)rect(c,x,y,47,47,p.tile);rect(c,x,y,48,2,p.light+'45');rect(c,x,y,2,48,p.light+'25');if(n===4){rect(c,x+31,y+12,8,2,p.wall+'30');rect(c,x+37,y+14,2,5,p.wall+'30')}}
 c.restore();
 for(let x=24;x<930;x+=48)for(const y of [23,558]){rect(c,x,y,42,18,p.edge);rect(c,x+2,y+2,38,11,p.wall);rect(c,x+4,y+2,32,2,p.light+'50')}
 for(let y=70;y<550;y+=64)for(const x of [23,919]){rect(c,x,y,18,44,p.edge);rect(c,x+3,y+3,12,38,p.wall);rect(c,x+4,y+5,3,20,p.light+'50')}
 // Decorative details stay outside playable space; no fake pits or hazards.
 for(const x of [160,800]){if(floor===1){rect(c,x,22,24,16,p.accent);rect(c,x+7,18,10,5,cream)}if(floor===2){rect(c,x,23,32,16,'#372e49');for(let i=0;i<4;i++)rect(c,x+5+i*6,26,3,8,p.accent)}if(floor===3){for(let i=0;i<6;i++)rect(c,x+i*7,23,4,15,i%2?ink:p.accent)}if(floor===4){rect(c,x,24,36,14,'#72818e');rect(c,x+5,26,7,7,p.accent);rect(c,x+18,29,13,3,p.light)}if(floor===5){for(let i=0;i<5;i++)rect(c,x+i*7,20,3,22,p.light)}}
}
export function drawPixelShot(c,b,hostile=false){
 if(!hostile&&drawEnhancedShot(c,b))return;
 const r=Math.max(3,Math.round(b.r)),x=Math.round(b.x),y=Math.round(b.y),a=Math.atan2(b.vy,b.vx);
 if(b.rollingRock){rect(c,x-12,y+9,24,4,'#39434238');box(c,x-11,y-10,22,20,'#8794a0');const shift=Math.floor((b.age||0)*12)%3*3;rect(c,x-7+shift,y-6,4,5,'#c5d0d1');rect(c,x+3-shift,y+2,4,5,'#4e5965');rect(c,x-Math.cos(a)*16,y+8,4,3,'#b3a896');return;}
 if(b.rice){box(c,x-7,y-5,14,10,b.fed?'#fff4c7':'#eaf5ff');rect(c,x-3,y-3,6,3,'#fffdf1');rect(c,x+2,y+1,3,3,'#739ac6');return;}
 if(b.deepCharged){box(c,x-r-2,y-3,(r+2)*2,6,'#9fe5ff');box(c,x-3,y-r-2,6,(r+2)*2,'#c5f4ff');}
 if(b.gojo){rect(c,x-10,y-3,20,6,'#7749ad');rect(c,x-5,y-5,10,10,'#c48bfa');rect(c,x-2,y-2,4,4,'#fff1ff');return;}
 if(!hostile&&b.memePet){
  const colors={kobe:'#e69d43',penguin:'#888f9a',tempura:'#f4cd78',sun:'#fff0ce'};
  const color=colors[b.memePet]||cream;box(c,x-r,y-r,r*2,r*2,color);
  if(b.memePet==='kobe'){rect(c,x-1,y-r,2,r*2,ink);rect(c,x-r,y-1,r*2,2,ink);rect(c,x-r+3,y-r+2,2,4,cream)}
  if(b.memePet==='sun'){for(let i=0;i<3;i++)rect(c,x-r+3,y-r+3+i*3,r*2-6,1,ink)}
  if(b.memePet==='penguin'){rect(c,x-r+2,y-r+2,Math.max(3,r),3,'#cbd4da');rect(c,x+1,y+2,3,2,'#535b65')}
  if(b.memePet==='tempura')for(let i=0;i<3;i++)rect(c,x-4+i*3,y-2+i%2*3,2,2,'#bf8053');
  return;
 }
 const color=hostile?(b.needle?'#ed7ca5':b.echoReturned?'#e9bc62':b.sound?'#ce9eeb':b.finalOwner?.kind==='meishu'?'#e58abb':'#ed976c'):(b.returning?'#8bbfea':b.poison?'#b4df69':b.pet?'#f2d388':b.heavy?'#c9b7f1':'#b7e6df');
 if(!hostile&&b.returning){for(let i=1;i<=3;i++){c.save();c.globalAlpha*=1-i*.2;pixelRing(c,x-Math.cos(a)*i*12,y-Math.sin(a)*i*12,Math.max(3,r-i),'#85cdeb',2);c.restore()}}
 for(let i=3;i>0;i--)rect(c,x-Math.round(Math.cos(a)*i*6)-2,y-Math.round(Math.sin(a)*i*6)-2,4,4,color+(i===1?'90':'40'));
 rect(c,x-r,y-r+2,r*2,r*2-4,ink);rect(c,x-r+2,y-r,r*2-4,r*2,ink);rect(c,x-r+2,y-r+2,r*2-4,r*2-4,color);rect(c,x-r+3,y-r+3,Math.max(2,r-2),2,cream);
 if(!hostile&&!b.pet){c.fillStyle=ink;c.font=`bold ${Math.max(10,r*2)}px monospace`;c.textAlign='center';c.fillText('哈',x,y+4)}
 if(b.needle){rect(c,x-1,y-1,3,3,cream)}
}
export function pixelRing(c,x,y,r,color,size=4){c.fillStyle=color;const count=Math.max(16,Math.ceil(r/3));for(let i=0;i<count;i++){const a=i*Math.PI*2/count;c.fillRect(Math.round((x+Math.cos(a)*r)/2)*2-size/2,Math.round((y+Math.sin(a)*r)/2)*2-size/2,size,size)}}
