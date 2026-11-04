// Cosmetic only: no damage, targeting, collision or projectile creation here.
const ink='#29313d',cream='#fff1c8';
const colors={man:'#f3c75d',deep:'#83d9f2',ghost:'#bfa1e4',rhythm:'#70d5bd',gugu:'#95dcbe',wood:'#cfaa71',fade:'#e5b86b',rebound:'#b4dceb',heavy:'#bcace1',milk:'#b6e7ce',poison:'#b6d983',echo:'#91c9e5',elbow:'#e9c26e',plug:'#7edbdc',rice:'#e8f3ed',fedRice:'#f4d77f',basketball:'#e2a052',stone:'#a7b1b7',egg:'#f1d98a',wire:'#82ddd7'};
const block=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x/2)*2,Math.round(y/2)*2,w,h)};
function ring(c,x,y,r,color){for(let i=0;i<24;i++){const a=i*Math.PI/12;block(c,x+Math.cos(a)*r-1,y+Math.sin(a)*r-1,2,2,color)}}
function diamond(c,x,y,r,color){for(let i=-r;i<=r;i+=2){block(c,x+i,y-r+Math.abs(i),2,2,color);block(c,x+i,y+r-Math.abs(i),2,2,color)}}
export function shotVariant(b){return b.manBoost?'man':b.deepCharged?'deep':b.ghost?'ghost':b.rhythm||b.beat?'rhythm':b.gugu?'gugu':b.fadeBoost?'fade':b.ironBoost||b.reboundBoost?'rebound':b.wood?'wood':b.heavy?'heavy':b.milkBoost?'milk':b.poison?'poison':b.returnVoice?'echo':b.phoebePlug?'plug':null}
function add(g,f){
 const count=g.effects.reduce((n,e)=>n+Number(e.type==='itemCast'||e.type==='itemImpact'),0);
 if(count>=24){const i=g.effects.findIndex(e=>e.type==='itemCast'||e.type==='itemImpact');g.effects.splice(i,1)}
 g.effects.push(f);
}
export function castItemVfx(g,start,pet){
 if(pet)return;const bullets=g.bullets.slice(start);if(!bullets.length)return;
 const group={nextHit:-Infinity};for(const b of bullets)b.vfxVolley=group;
 const b=bullets[0],variant=shotVariant(b);if(!variant)return;
 add(g,{type:'itemCast',variant,x:b.x,y:b.y,angle:Math.atan2(b.vy,b.vx),radius:Math.min(24,b.r+10),life:.18,max:.18});
}
export function hitItemVfx(g,e,b){
 const variant=b.pet?(b.rice?(b.fed?'fedRice':'rice'):b.rollingRock?'stone':b.memePet==='kobe'?'basketball':b.eggShot?'egg':null):shotVariant(b);if(!variant)return;
 // Split, fan and piercing descendants share a small visual budget per volley.
 if(b.vfxVolley){if(g.elapsed<b.vfxVolley.nextHit)return;b.vfxVolley.nextHit=g.elapsed+.07}
 add(g,{type:'itemImpact',variant,x:e.x,y:e.y,angle:Math.atan2(b.vy,b.vx),radius:Math.min(30,b.r+14),life:.24,max:.24});
}
export function bounceItemVfx(g,b){if(b.pet||(!b.ironBoost&&!b.reboundBoost))return;add(g,{type:'itemImpact',variant:'rebound',x:b.x,y:b.y,angle:Math.atan2(b.vy,b.vx),radius:19,life:.18,max:.18})}
export function wireItemVfx(g,e){add(g,{type:'itemImpact',variant:'wire',x:e.x,y:e.y,angle:0,radius:16,life:.18,max:.18})}
export function elbowItemVfx(g,e){add(g,{type:'itemImpact',variant:'elbow',x:e.x,y:e.y,angle:Math.atan2(g.p.dy,g.p.dx),life:.22,max:.22,radius:28})}
export function drawEnhancedShot(c,b){
 const variant=shotVariant(b);if(b.pet||!variant)return false;
 const r=Math.max(4,Math.round(b.r)),color=colors[variant],a=Math.atan2(b.vy,b.vx);
 c.save();c.translate(Math.round(b.x/2)*2,Math.round(b.y/2)*2);c.rotate(a);
 // Short segmented tails, never an opaque beam or full-screen flash.
 for(let i=1;i<=3;i++)block(c,-r-i*7,-2,4,4,i===1?color:color+'70');
 if(b.wood){
  block(c,-r-3,-r+2,r*2+6,r*2-4,ink);block(c,-r-1,-r+4,r*2+2,r*2-8,'#ba8d54');
  for(const y of [-r+5,0,r-5])block(c,-r+1,y,r*2-2,2,'#e2bc7e');
  block(c,r-3,-r+3,5,r*2-6,'#f0d39b');block(c,r-1,-3,2,6,ink);
 }else if(b.ghost){
  for(const x of [-r,r-3]){block(c,x,-r,4,r*2,ink);block(c,x+1,-r+2,2,r*2-4,color)}
  for(const y of [-r,r-3]){block(c,-r,y,r*2,4,ink);block(c,-r+2,y+1,r*2-4,2,color)}
  block(c,-2,-2,4,4,'#e5d7ef');
 }else{
  block(c,-r,-r+2,r*2,r*2-4,ink);block(c,-r+2,-r,r*2-4,r*2,ink);
  block(c,-r+2,-r+2,r*2-4,r*2-4,color);block(c,-r+4,-r+3,Math.max(2,r-3),2,cream);
  if(b.heavy){ring(c,0,0,Math.max(3,r-4),ink);block(c,-2,-2,4,4,cream)}
 }
 if(b.ghost&&b.wood){for(const side of [-1,1]){block(c,-r-4,side*(r+4),r*2+8,2,'#bfa1e4');block(c,side*(r+4),-r-4,2,r*2+8,'#bfa1e4')}}
 if(b.phoebePlug){for(const y of [-4,2]){block(c,r+4,y,6,2,'#29485d');block(c,r+6,y,4,2,'#9febdf')}block(c,-r-6,-2,4,4,'#9febdf')}
 if(b.manBoost){diamond(c,0,0,r+4,'#e6b248');block(c,-3,-4,2,8,ink);block(c,1,-4,2,8,ink);block(c,-1,-2,2,2,ink)}
 if(b.deepCharged){for(const side of [-1,1]){block(c,-3,side*(r+4),8,2,'#80d7ef');block(c,-5,side*(r+2),2,2,'#c5f2ff')}block(c,r-2,-2,4,4,'#d8f5ff')}
 if(b.beat||b.rhythm){for(const side of [-1,1]){block(c,-3,side*(r+4),2,6,'#65bba7');block(c,-5,side*(r+4)+4,4,2,'#b8efdc')}}
 if(b.gugu)for(let i=0;i<3;i++)block(c,-r-i*6,-7+i*3,3,3,'#b8efdc');
 if(b.fadeBoost){ring(c,0,0,Math.max(3,r-2),'#634b37');block(c,-r+3,-1,r*2-6,2,'#634b37');block(c,-1,-r+3,2,r*2-6,'#634b37')}
 if(b.ironBoost||b.reboundBoost){for(const y of [-r-2,r+2]){block(c,-5,y,6,2,'#b6dce7');block(c,-1,y-2,2,6,'#b6dce7')}}
 if(b.returnVoice){for(const y of [-4,4])block(c,-r-9,y,6,2,b.returning?'#d3effa':'#7595b0')}
 if(b.milkBoost){block(c,-3,r+3,4,4,'#c4eed9');block(c,3,r+1,2,2,'#85c9af')}
 if(b.poison){block(c,-r-5,5,3,5,'#a5c86d');block(c,-r-10,8,2,3,'#7b9d52')}
 c.restore();return true;
}
export function drawItemEffect(c,f){
 if(f.type!=='itemCast'&&f.type!=='itemImpact')return false;
 const t=Math.max(0,Math.min(1,1-f.life/f.max)),r=(f.radius||24)*(f.type==='itemCast'?.4+t*.6:t),color=colors[f.variant]||cream;
 c.save();c.globalAlpha*=Math.min(1,f.life/f.max*2);c.translate(f.x,f.y);c.rotate(f.angle||0);
 if(f.variant==='rice'||f.variant==='fedRice'){
  for(let i=0;i<6;i++){const a=i*Math.PI/3;block(c,Math.cos(a)*r,Math.sin(a)*r,4,2,color)}
  if(f.variant==='fedRice')diamond(c,0,0,r*.65,'#c6a353');
 }else if(f.variant==='stone'){
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;block(c,Math.cos(a)*r-2,Math.sin(a)*r-2,4,4,ink);block(c,Math.cos(a)*r-1,Math.sin(a)*r-1,2,2,color)}
 }else if(f.variant==='basketball'){
  ring(c,0,0,r,color);for(const side of [-1,1])block(c,-r-6,side*5,10,2,ink);
 }else if(f.variant==='plug'||f.variant==='wire'){
  for(const side of [-1,1])for(let i=0;i<4;i++)block(c,side*(r-i*3),i%2?0:-4,5,2,i%2?ink:color);
 }else if(f.variant==='egg'){
  for(const side of [-1,1]){diamond(c,side*r,0,4,color);block(c,side*r-2,-1,4,2,ink)}
 }else if(f.variant==='ghost'){
  for(const side of [-1,1]){block(c,side*r,-r,2,r*2,color);block(c,side*r+(side<0?0:-6),-r,6,2,color);block(c,side*r+(side<0?0:-6),r,6,2,color)}
 }else if(f.variant==='deep'){
  for(const side of [-1,1])for(let i=0;i<3;i++)block(c,i*5-8,side*(r-i*3),6,2,color);
 }else if(f.variant==='wood'){
  for(let i=0;i<6;i++){const a=i*Math.PI/3;block(c,Math.cos(a)*r,Math.sin(a)*r,6,3,i%2?color:'#8f6947')}
 }else if(f.variant==='man'||f.variant==='elbow'){
  diamond(c,0,0,r,ink);diamond(c,0,0,Math.max(0,r-2),color);
  for(const y of [-5,5])block(c,-r-9,y,9,2,color);
 }else if(f.variant==='rhythm'||f.variant==='gugu'){
  for(const side of [-1,1]){block(c,side*r,-7,2,12,color);block(c,side*r-4,3,6,3,color)}
 }else if(f.variant==='fade'){
  for(let i=0;i<12;i++){const a=Math.PI*.25+i*Math.PI/12;block(c,Math.cos(a)*r,Math.sin(a)*r,3,3,color)}
 }else if(f.variant==='rebound'){
  for(const side of [-1,1])for(let i=0;i<4;i++)block(c,-i*4,side*(r-i*2),4,2,color);
 }else{ring(c,0,0,r,color);for(let i=0;i<4;i++){const a=i*Math.PI/2;block(c,Math.cos(a)*(r+4),Math.sin(a)*(r+4),3,3,color)}}
 c.restore();return true;
}
export function drawItemReadiness(c,g){
 if(!['play','paused'].includes(g.mode))return;
 c.save();const p=g.p;
 for(const e of g.room.enemies||[])if(!e.dead&&e.type==='boss'&&e.ghostMarkedUntil>(g.actionClock??g.elapsed)){const y=e.y-e.r-15;diamond(c,e.x,y,8,'#463451');diamond(c,e.x,y,5,'#d0a0ed');for(const side of [-1,1])block(c,e.x+side*12,y-4,3,9,'#b67ed5');}
 if(g.has('man')){for(let i=0;i<5;i++){block(c,p.x-14+i*6,p.y+23,4,4,ink);if(g.manReady||g.manBurst>0||i<(g.manHits||0))block(c,p.x-14+i*6,p.y+23,4,2,'#f3c75d')}if(g.manReady)diamond(c,p.x,p.y+16,4,'#f3c75d')}
 if(g.has('man')&&g.manBurst>0)for(let i=0;i<g.manBurst;i++)diamond(c,p.x-5+i*10,p.y+33,3,'#f3c75d');
 c.restore();
}
