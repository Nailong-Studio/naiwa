// Periodic bonuses share a cap; permanent damage builds and pellet weights remain intact.
export function empowerShot(b,factor){const old=b.empowerScale||1,next=Math.min(3,old*factor);b.damage*=next/old;b.empowerScale=next}
