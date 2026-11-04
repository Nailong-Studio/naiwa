export function encounterCount(room,floor){
 const roll=Math.floor((room.seed||0)/3)%3;
 if(room.type==='vault')return 4+roll;
 if(room.type==='cache')return 3+roll;
 return Math.max(4,5+floor+roll+(room.type==='challenge'?1:0)-(room.crowdingPenalty||0));
}
