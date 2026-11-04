export const RESCUE_GOAL=24;
export function startRescue(g){
 if(g.rescue)return;
 g.mode='rescue';g.bullets=[];g.enemyBullets=[];g.effects=[];g.explosives=[];g.pickup=null;
 g.rescue={phase:'caged',t:0,presses:0,goal:RESCUE_GOAL,pulse:0,cooldown:0,phaseTime:0};
 g.emit('rescue');
}
export function rescueLaugh(g){
 const r=g.rescue;if(g.mode!=='rescue'||!r||r.phase!=='caged'||r.cooldown>0)return false;
 r.presses=Math.min(r.goal,r.presses+1);r.pulse=1;r.cooldown=.075;
 g.emit('rescueLaugh',{progress:r.presses/r.goal});
 if(r.presses===r.goal){r.phase='breaking';r.phaseTime=0;g.emit('cageBreak')}
 return true;
}
export function updateRescue(g,dt){
 if(g.mode!=='rescue'||!g.rescue)return;
 const r=g.rescue;dt=Math.max(0,Math.min(.04,dt));r.t+=dt;r.phaseTime+=dt;r.cooldown=Math.max(0,r.cooldown-dt);r.pulse=Math.max(0,r.pulse-dt*3);
 if(r.phase==='breaking'&&r.phaseTime>=1.6){r.phase='reunion';r.phaseTime=0;g.emit('reunion')}
 else if(r.phase==='reunion'&&r.phaseTime>=3.5){r.phase='complete';g.mode='win';g.emit('end',{win:true})}
}
// Fresh presses only: held keys, modifier shortcuts and input into other controls do not count.
export function isRescueKey(e){return !e.repeat&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!['Shift','Control','Alt','Meta','Tab','Escape','CapsLock','F1','F5','F11','F12'].includes(e.key)&&e.key.toLowerCase()!=='p'}
