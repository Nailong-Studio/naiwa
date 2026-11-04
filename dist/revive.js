export const REVIVE_SECONDS=10;
export function canRevive(g){return g.mode==='dead'&&!g.reviveUsed}
export function beginRevive(g){if(!canRevive(g))return false;g.reviveWatch={elapsed:0};g.mode='revive';return true}
export function advanceRevive(g,seconds){if(g.mode!=='revive'||g.reviveUsed||!g.reviveWatch||!Number.isFinite(seconds))return false;g.reviveWatch.elapsed=Math.min(REVIVE_SECONDS,g.reviveWatch.elapsed+Math.max(0,Math.min(.25,seconds)));return g.reviveWatch.elapsed>=REVIVE_SECONDS}
export function cancelRevive(g){if(g.mode!=='revive')return false;g.reviveWatch=null;g.mode='dead';return true}
export function finishRevive(g){
 if(g.mode!=='revive'||g.reviveUsed||!(g.reviveWatch?.elapsed>=REVIVE_SECONDS))return false;
 g.reviveUsed=true;g.reviveWatch=null;g.p.hp=Math.max(1,Math.ceil(g.p.maxHp/2));g.p.inv=3;g.p.dash=0;g.p.dashCD=0;g.p.shot=0;
 g.bullets=[];g.enemyBullets=[];g.explosives=[];g.bombLatch=false;g.useLatch=false;g.activeLatch=false;g.mode='play';g.emit('room');return true;
}
// Count decoded media progress, not time spent on the page. Background, stalled and seeked media earn nothing.
export class WatchClock{
 reset(){this.previous=null;this.active=false}
 constructor(){this.reset()}
 sample({time,duration=Infinity,playing,visible,seeking=false}){
  const eligible=playing&&visible&&!seeking&&Number.isFinite(time),previous=this.previous,active=this.active;this.previous=time;this.active=eligible;
  if(!eligible||!active||previous===null)return 0;
  let delta=time-previous;if(delta<0&&Number.isFinite(duration))delta=duration-previous+time;
  // Ignore a discontinuity; normal loop wrap and ordinary media progress are small.
  return delta>0&&delta<=.5?Math.min(delta,.25):0;
 }
}
