import {drawPhoebe} from './phoebe-art.js';
import {drawDeepseek} from './deepseek-art.js';
import {drawMemeFollowers} from './meme-followers.js';
import {drawSprite} from './sprite-art.js';
export const FOLLOWERS=['mouse','dog','egg','turtle','rabbit'];
export function homeFollowerPoint(g,id){
 if(id==='turtle')return {x:g.p.x+Math.cos(g.elapsed*2)*56,y:g.p.y+Math.sin(g.elapsed*2)*56};
 const ids=FOLLOWERS.filter(k=>k!=='turtle'&&g.has(k)),i=Math.max(0,ids.indexOf(id)),a=Math.PI*.7+i*.5;
 return {x:Math.max(65,Math.min(895,g.p.x+Math.cos(a)*65)),y:Math.max(70,Math.min(530,g.p.y+Math.sin(a)*40+12))};
}
export function followerPoint(g,id){const s=g.followerStates?.[id];return s?{x:s.x,y:s.y}:homeFollowerPoint(g,id)}
export function drawFollowers(c,g){
 drawMemeFollowers(c,g);drawDeepseek(c,g);drawPhoebe(c,g);
 for(const id of FOLLOWERS.filter(id=>g.has(id))){
  const p=followerPoint(g,id),s=g.followerStates?.[id],frame=s?.phase==='windup'||s?.phase==='lunge'||s?.phase==='leap'?2:s?.phase==='recover'||s?.flash>0?3:s?.moving?Math.floor(g.elapsed*10)%2:0;
  if(id==='mouse'&&s?.secretDoor&&s.phase==='sniff'){const d=s.secretDoor;c.save();c.strokeStyle='#f9db78';c.lineWidth=3;c.strokeRect(d.x-14,d.y-14,28,28);c.fillStyle='#f9db78';c.font='bold 16px system-ui';c.textAlign='center';c.fillText('!',p.x,p.y-38);c.restore()}
  c.save();c.fillStyle='#4a3d3a2a';c.fillRect(p.x-14,p.y+10,28,5);c.restore();
  if(!drawSprite(c,'followers-family-v2.png',frame,FOLLOWERS.indexOf(id),4,5,p.x,p.y-(s?.lift||0),id==='egg'?40:48,{flip:s?.face===1,squash:s?.phase==='windup'?.88:1})){
   c.fillStyle='#e9c861';c.fillRect(p.x-12,p.y-12,24,24);c.fillStyle='#344535';c.fillRect(p.x-7,p.y-7,4,4);c.fillRect(p.x+3,p.y-7,4,4);
  }
 }
}
