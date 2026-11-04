import {drawSprite} from './sprite-art.js';
export function drawDeepseek(c,g){
 const s=g.whale;if(g.has('ricewhale')&&s){const frame=s.phase==='windup'||s.phase==='eat'?2:s.phase==='attack'?3:s.moving?Math.floor(g.elapsed*9)%2:0;drawSprite(c,'deepseek-actions-v1.png',frame,0,4,1,s.x,s.y,55,{flip:s.face<0});if(g.whaleFed>0){c.save();c.fillStyle='#eaf6ff';for(let i=0;i<g.whaleFed;i++)c.fillRect(s.x-8+i*6,s.y-50,4,4);c.restore()}}
 if(g.has('deepthink')&&(g.deepThink>0||g.deepBurst>0)){c.save();for(let i=0;i<3;i++){c.fillStyle=g.deepReady||g.deepThink>=i+1||g.deepBurst>i?'#87ddff':'#4d608a';c.fillRect(g.p.x-9+i*7,g.p.y-72,5,5)}c.restore()}
 for(const f of g.effects)if(f.type==='deepToken'){const t=1-f.life/f.max,x=f.x+(f.tx-f.x)*t,y=f.y+(f.ty-f.y)*t;c.save();c.fillStyle='#27488e';c.fillRect(x-5,y-5,10,10);c.fillStyle='#a0edff';c.fillRect(x-3,y-3,6,6);c.restore()}
}
