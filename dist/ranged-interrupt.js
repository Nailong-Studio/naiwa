// Interrupt telegraphed ordinary ranged attacks; projectiles already in flight remain.
export function interruptRanged(g,e,duration){
 if(!e||e.dead||e.type==='boss'||!(g.canEnemyShoot(e)||e.type==='shooter'))return false;
 e.phoneMutedUntil=Math.max(e.phoneMutedUntil||0,g.elapsed+duration);
 e.cd=Math.max(e.cd||0,duration);e.mobCast=null;e.sound=null;e.screech=null;e.gunCast=null;
 g.effects=g.effects.filter(f=>!(f.owner===e&&['mobZone','milkBottle'].includes(f.type)&&!f.triggered));
 return true;
}
