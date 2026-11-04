export const ROOM_WARDROBE=Object.freeze({x:730,y:225,w:104,h:104,useX:730,useY:302,range:96});
export function hasRoomWardrobe(g){return g.floor>=2&&g.floor<=g.finalFloor&&g.room?.type==='start'}
export function canUseRoomWardrobe(g){return g.mode==='play'&&hasRoomWardrobe(g)&&Math.hypot(g.p.x-ROOM_WARDROBE.useX,g.p.y-ROOM_WARDROBE.useY)<ROOM_WARDROBE.range}
export function installRoomWardrobe(g){
 if(g.floor<2||g.floor>g.finalFloor)return;
 const room=g.rooms.find(r=>r.exists&&r.type==='start');
 if(room&&!room.obstacles.some(o=>o.wardrobe))room.obstacles.push({x:ROOM_WARDROBE.x,y:ROOM_WARDROBE.y,w:ROOM_WARDROBE.w,h:ROOM_WARDROBE.h,r:52,kind:'pillar',hp:Infinity,wardrobe:true});
}
export function drawRoomWardrobe(c,g){
 if(!hasRoomWardrobe(g))return;
 const {x,y}=ROOM_WARDROBE,near=canUseRoomWardrobe(g);
 c.save();c.translate(x,y);c.fillStyle='#24353235';c.fillRect(-54,47,120,16);
 // Stepped wooden frame, brass hinges and a hanging garment keep the prop readable at game scale.
 c.fillStyle='#4d3d38';c.fillRect(-58,-79,116,126);c.fillRect(-48,47,14,10);c.fillRect(34,47,14,10);
 c.fillStyle='#d7ad70';c.fillRect(-62,-85,124,10);c.fillRect(-54,-75,108,116);
 c.fillStyle='#8b6852';c.fillRect(-46,-67,90,100);c.fillStyle='#654d48';c.fillRect(0,-65,4,96);
 c.fillStyle='#ae8865';c.fillRect(-42,-63,36,90);c.fillStyle='#c2986c';c.fillRect(8,-63,32,90);
 c.fillStyle='#e6c78b';for(const dy of [-56,15]){c.fillRect(-50,dy,8,10);c.fillRect(42,dy,8,10)}c.fillRect(-14,-12,5,12);c.fillRect(10,-12,5,12);
 c.fillStyle='#f4e8bc';c.fillRect(-25,-67,50,28);c.fillStyle='#5b7669';
 for(const [a,b,w,h] of [[-8,-64,16,4],[-15,-60,30,4],[-20,-56,40,4],[-12,-52,24,10]])c.fillRect(a,b,w,h);
 if(near){c.strokeStyle='#f6dc83';c.lineWidth=4;c.strokeRect(-62,-85,124,142)}
 c.textAlign='center';c.fillStyle='#f7edc9';c.fillRect(-82,-114,164,25);c.fillStyle='#3c5146';c.font='bold 18px system-ui';c.fillText('奶蛙的衣柜',0,-95);
 if(near){c.fillStyle='#314f43';c.fillRect(-92,88,184,28);c.fillStyle='#fff2c3';c.font='bold 16px system-ui';c.fillText('E / 互动 · 更换时装',0,108)}
 c.restore();
}
