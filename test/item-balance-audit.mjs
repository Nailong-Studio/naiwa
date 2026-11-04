import {Game,ITEMS} from '../dist/campaign.js';
import {enterDeepseek} from '../dist/deepseek-items.js';
import {writeFileSync} from 'node:fs';
function sample(ids,range){const g=new Game(()=>.42);g.start();g.room.type='fight';g.room.clear=false;g.room.obstacles=[];g.room.hazards=[];g.p.x=200;g.p.y=300;g.p.inv=999;g.enemySpeed=()=>0;g.burst=()=>{};
 for(const id of ids){g.choices=[ITEMS.find(i=>i.id===id)];g.mode='choice';g.choose(id)}enterDeepseek(g);
 const e=g.spawn('turret',200+range,294);e.hp=e.maxHp=100000;e.r=38;e.cd=999;g.room.enemies=[e];let damage=0;const hurt=g.damageEnemy.bind(g);g.damageEnemy=(e,n,...rest)=>{const hp=e.hp;hurt(e,n,...rest);damage+=hp-e.hp};
 for(let i=0;i<1000;i++)g.update(.02,{fire:true,ax:1});return +(damage/20).toFixed(3);
}
const baseline=[sample([],180),sample([],350)];const report={note:'20-second stationary single-target simulation at180/350 units; utility, survival, dash, charged-stop attacks and crowd piercing require separate review. Not an automatic tier list.',baseline,items:ITEMS.map(i=>({id:i.id,name:i.name,desc:i.desc,dps:[sample([i.id],180),sample([i.id],350)]})),combos:[['double','fanvoice'],['eye','tissue','mints','politesuit'],['heavyvoice','returnvoice','homing'],['milkcap','milkfilter','milkfoam'],['ricewhale','ricebowl'],['wrongmodel','heavyvoice','double']].map(ids=>({ids,dps:[sample(ids,180),sample(ids,350)]}))};
writeFileSync(process.argv[2]||'../nginx-deploy/item-balance-before.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
