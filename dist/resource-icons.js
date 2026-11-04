// Inline pixel shapes keep supplies/services independent of device symbol fonts.
const ink='#39443f',gold='#f1c568',light='#fff2c6';
const rect=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const path=(d,c)=>`<path d="${d}" fill="${c}"/>`;
const shapes={
 key:rect(3,4,14,14,ink)+rect(6,7,8,8,gold)+rect(9,10,2,2,ink)+rect(13,15,16,5,gold)+rect(21,18,4,6,gold)+rect(27,18,3,5,gold),
 bomb:rect(7,10,18,18,ink)+rect(4,14,24,10,ink)+rect(9,12,14,13,'#77838a')+rect(10,13,5,5,light)+rect(13,5,6,6,'#b59365')+rect(18,3,6,3,gold)+rect(24,1,3,6,'#e59b61'),
 heart:path('M4 7H12V10H20V7H28V19H24V23H20V27H12V23H8V19H4Z',ink)+path('M6 9H11V12H21V9H26V18H22V22H18V25H14V21H10V17H6Z','#df7b83')+rect(8,10,3,5,light),
 coin:rect(7,3,18,26,ink)+rect(4,7,24,18,ink)+rect(9,5,14,22,gold)+rect(6,9,20,14,gold)+rect(14,8,4,16,light),
 shield:path('M4 5H28V19H24V24H20V28H12V24H8V19H4Z',ink)+path('M7 8H25V18H21V22H17V25H15V22H11V18H7Z','#8dbda2')+rect(14,10,4,10,light),
 charge:rect(7,4,18,25,ink)+rect(12,1,8,3,ink)+rect(9,6,14,21,'#98bb8c')+path('M17 7H12V17H16L13 25L22 14H17Z',gold),
 map:rect(3,4,26,24,ink)+rect(5,6,22,20,'#ced5ac')+rect(7,9,5,5,'#749287')+rect(14,9,5,5,'#749287')+rect(14,16,5,5,'#749287')+rect(21,16,5,5,gold)+rect(21,23,5,3,gold),
 reroll:path('M7 5H25V11H29L23 17L17 11H21V9H7Z','#829e83')+path('M25 27H7V21H3L9 15L15 21H11V23H25Z',gold)
};
const singles={supply_key:'key',supply_bomb:'bomb',supply_heart:'heart',service_reroll:'reroll',service_shield:'shield',service_charge:'charge',service_map:'map'};
const trades={trade_key_bomb:['key','bomb'],trade_bomb_key:['bomb','key'],trade_key_coin:['key','coin'],trade_bomb_coin:['bomb','coin'],trade_blood:['heart','coin']};
export function resourceIcon(id){
 const pair=trades[id],shape=shapes[singles[id]];
 if(!shape&&!pair)return null;
 const drawing=pair?`<g transform="translate(0 1) scale(.55)">${shapes[pair[0]]}</g><g transform="translate(14 14) scale(.55)">${shapes[pair[1]]}</g>`+path('M16 8H23V5L30 11L23 17V14H16Z',ink):shape;
 return `<span class="item-texture resource-texture" aria-hidden="true"><svg viewBox="0 0 32 32" width="100%" height="100%" shape-rendering="crispEdges" focusable="false">${drawing}</svg></span>`;
}
