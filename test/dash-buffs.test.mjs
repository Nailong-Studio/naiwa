import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
import {updateMeme,footZoneScale} from '../dist/meme-items.js';
import {updatePhoebe,clearPhoebe,playerWireDamage} from '../dist/phoebe-items.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function setup(ids=[]){const g=new Game(()=>.42);g.start();g.items=ids;g.room.type='fight';g.room.clear=false;g.room.obstacles=[];g.room.hazards=[];g.p.x=300;g.p.y=300;g.p.inv=999;g.enemySpeed=()=>0;const e=g.spawn('turret',420,300);e.hp=1000;e.cd=999;g.room.enemies=[e];return g}
const advance=(g,t)=>{for(let i=0;i<Math.ceil(t/.02);i++)g.update(.02,{})};
test('real dash yields useful damage with each offensive item alone and feeds normal laugh charge',()=>{
 for(const [id,min] of [['fadeaway',2.5],['elbow',5],['shrimpfeet',2.5],['phoebewire',3.75]]){const g=setup([id]),e=g.room.enemies[0];if(id==='shrimpfeet')e.x=465;g.update(.02,{dash:true,mx:1});advance(g,2);assert.ok(1000-e.hp>=min,`${id}: ${1000-e.hp}`);if(['elbow','shrimpfeet'].includes(id))assert.ok(g.activeCharge>0)}
});
test('elbow sweeps the traveled segment once, respects cover and caps growth',()=>{
 const g=setup(['elbow','mambaout']);g.p.damage=20;g.p.x=440;g.p.dash=.2;g.p.dashCD=2;const e=g.room.enemies[0];e.x=370;
 updateMeme(g,.02,{x:300,y:300});assert.equal(e.hp,988);close(g.p.dashCD,1.55);updateMeme(g,.02,{x:300,y:300});assert.equal(e.hp,988);
 const blocked=setup(['elbow']);blocked.p.dash=.2;blocked.room.enemies[0].x=335;blocked.room.obstacles=[{kind:'rock',x:318,y:300,w:12,h:80,r:6}];updateMeme(blocked,.02);assert.equal(blocked.room.enemies[0].hp,1000);
});
test('footprints damage on landing only, skip flyers and cover, slow ground mobs but not bosses',()=>{
 const g=setup(['shrimpfeet']);const near=g.room.enemies[0];near.x=380;const fly=g.spawn('fly',310,300),blocked=g.spawn('turret',300,380),boss=g.makeBoss('puppet',370,310);fly.hp=blocked.hp=1000;g.room.enemies.push(fly,blocked,boss);g.room.obstacles=[{kind:'rock',x:300,y:340,w:60,h:10,r:5}];g.wasMemeDash=true;updateMeme(g,.02);assert.equal(near.hp,997.5);assert.equal(fly.hp,1000);assert.equal(blocked.hp,1000);assert.equal(footZoneScale(g,near),.55);assert.equal(footZoneScale(g,fly),1);assert.equal(footZoneScale(g,blocked),1);assert.equal(footZoneScale(g,boss),1);updateMeme(g,.02);assert.equal(near.hp,997.5);assert.equal(g.effects.find(e=>e.type==='shrimpFeet').radius,100);
 for(let i=0;i<6;i++){g.wasMemeDash=true;updateMeme(g,.02)}assert.equal(g.footZones.length,3);g.elapsed=3.01;assert.equal(footZoneScale(g,near),1);updateMeme(g,.02);assert.equal(g.footZones.length,0);
});
test('Mamba landing provides timed recovery and firing window, without stacking or extending under slow time',()=>{
 const g=setup(['mambaout']);g.p.inv=0;g.wasMemeDash=true;updateMeme(g,.02);close(g.p.inv,.25);close(g.moveScale(g.p),1.25);close(g.attackInterval(),g.p.rate*.85);g.actionClock=1.79;g.elapsed=.2;assert.equal(g.moveScale(g.p),1.25);g.mode='paused';advance(g,2);close(g.actionClock,1.79);g.actionClock=1.81;assert.equal(g.moveScale(g.p),1);close(g.attackInterval(),g.p.rate);
 const plain=setup();plain.p.inv=0;plain.wasMemeDash=true;updateMeme(plain,.02);assert.equal(plain.p.inv,0);assert.equal(plain.outUntil,undefined);
});
test('dash wire is wider and persistent; overlapping companion wires use only strongest damage',()=>{
 const g=setup(['phoebewire','phoebeplug']);g.update(.02,{dash:true,mx:1});advance(g,.3);const w=g.phoebeWires[0],e=g.room.enemies[0];assert.equal(w.until,Infinity);assert.equal(w.width,14);close(w.damage,2);e.x=360;e.y=300+e.r+13;e.phoebeWireUntil=0;g.phoebeWires.push({...w,source:'companion',damage:1});const hp=e.hp;updatePhoebe(g,0,0,g.p);close(hp-e.hp,2);updatePhoebe(g,0,0,g.p);close(hp-e.hp,2);
});
test('dash volley stays bounded while player wires scale with attack',()=>{
 const g=setup(['fadeaway','elbow','shrimpfeet','oyeye','phoebewire','phoebe','mambaout','fanvoice','double','split']);g.p.damage=100;g.update(.02,{dash:true,mx:1});assert.equal(g.bullets.filter(b=>b.dashShot).length,8);assert.ok(g.bullets.every(b=>b.damage===8));advance(g,.3);assert.ok(g.phoebeWires.some(w=>w.source==='player'));for(const w of g.phoebeWires.filter(w=>w.source==='player'))close(w.damage,playerWireDamage(g));assert.ok(playerWireDamage(g)>3.84);assert.equal(g.footZones.length,1);assert.ok(g.p.dashCD>=1.2);
});
test('persistent lines replace the oldest at two, or three with Phoebe, and clear on room changes',()=>{
 for(const ids of [['phoebewire'],['phoebewire','phoebe']]){const g=setup(ids),limit=g.has('phoebe')?3:2;g.p.damage=1;
  for(let i=0;i<5;i++){g.phoebeWasDash=true;g.phoebeTrace=[{x:300,y:100+i*30},{x:400,y:100+i*30}];g.p.x=400;g.p.y=100+i*30;g.p.dash=0;updatePhoebe(g,0,0,g.p);assert.equal(g.phoebeWires.length,Math.min(i+1,limit))}
  assert.equal(g.phoebeWires[0].points[0].y,100+(5-limit)*30);assert.ok(g.phoebeWires.every(w=>w.until===Infinity));clearPhoebe(g);assert.equal(g.phoebeWires.length,limit);g.elapsed=9999;updatePhoebe(g,0,0,g.p);assert.equal(g.phoebeWires.length,limit);g.enter(g.rooms.find(r=>r.exists&&r.id!==g.roomId).id,'top');assert.equal(g.phoebeWires.length,0);
 }
});
