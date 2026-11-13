import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,ITEMS} from '../dist/campaign.js';
import {createSandboxState,startSandbox,setSandboxItem,clearSandboxItems,spawnSandboxEnemy,clearSandboxEnemies,resetSandboxRoom,setSandboxChapter,sandboxBoss,enterSandboxRoom,sandboxResource,runSandboxAction,sandboxPanelHTML,chapterEnemies,sandboxItems,dummyDps,SANDBOX_TABS} from '../dist/sandbox.js';

const seeded=(seed=7)=>()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646};
const sandbox=()=>{const state=createSandboxState();state.active=true;const g=startSandbox(new Game(seeded()),state);g.events.length=0;return {g,state}};
const base={speed:220,damage:1,rate:.28,maxHp:6};
const stats=g=>({speed:g.p.speed,damage:g.p.damage,rate:g.p.rate,maxHp:g.p.maxHp});

test('a sandbox run starts playing with spare resources and the whole floor on the map',()=>{
 const {g}=sandbox();
 assert.equal(g.mode,'play');assert.equal(g.sandbox,true);
 assert.deepEqual([g.coins,g.keys,g.bombs],[30,5,5]);
 assert.ok(g.rooms.filter(r=>r.exists).every(r=>r.seen&&(!r.hidden||r.revealed)));
 // A real run never carries the sandbox hooks.
 const real=new Game(seeded());real.start();
 assert.equal(Object.hasOwn(real,'hurt'),false);assert.equal(real.sandbox,undefined);
});
test('items can be taken and put back; stats return exactly to the base frog',()=>{
 const {g}=sandbox();
 for(const id of ['feet','tissue','belly','crown','milk','lotus'])assert.equal(setSandboxItem(g,id,true),true);
 assert.ok(g.p.speed>base.speed&&g.p.rate<base.rate&&g.p.damage>base.damage&&g.p.maxHp===8&&g.p.shield);
 assert.equal(setSandboxItem(g,'feet',true),false,'already owned');
 g.events.length=0;
 assert.equal(setSandboxItem(g,'tissue',false),true);
 assert.equal(g.has('tissue'),false);assert.equal(g.events.some(e=>e.type==='item'),false,'rebuilding stays quiet');
 const only=new Game(seeded());only.start();const keep=['feet','belly','crown','milk','lotus'];
 for(const id of keep){only.mode='choice';only.choices=[ITEMS.find(i=>i.id===id)];only.choose(id)}
 assert.deepEqual(stats(g),stats(only),'same as collecting the remaining items');
 for(const id of keep)setSandboxItem(g,id,false);
 assert.deepEqual(stats(g),base);assert.deepEqual(g.items,[]);assert.equal(g.p.shield,false);
 assert.ok(g.p.hp>=1&&g.p.hp<=6);
 setSandboxItem(g,'milk',true);clearSandboxItems(g);assert.deepEqual(stats(g),base);
 assert.equal(sandboxItems().some(i=>i.id==='tadpole'),false,'only items a run can find');
 assert.equal(sandboxItems().length,ITEMS.length-1);
});
test('god mode blocks damage; without it a fall stands straight back up',()=>{
 const {g,state}=sandbox();g.p.inv=0;
 state.god=true;g.hurt();assert.equal(g.p.hp,6);
 state.god=false;g.p.hp=1;g.p.inv=0;g.p.shield=false;g.hurt();
 assert.equal(g.mode,'play');assert.equal(g.p.hp,g.p.maxHp);assert.equal(state.falls,1);
 assert.equal(g.events.some(e=>e.type==='end'),false,'the run does not end');
 assert.ok(g.events.some(e=>e.type==='toast'));
});
test('spawned enemies fight for real; one-hit mode kills them; clearing leaves no death effects',()=>{
 const {g,state}=sandbox();assert.equal(g.room.type,'start');assert.equal(g.room.clear,true);
 const types=chapterEnemies(1).map(e=>e.type);
 assert.deepEqual(types.slice(0,3),['runner','milkSkater','milkleak']);
 for(const t of types)assert.ok(spawnSandboxEnemy(g,t),t);
 assert.equal(g.room.clear,false,'doors close');
 const live=g.room.enemies.filter(e=>!e.dead);assert.equal(live.length,types.length);
 assert.ok(live.every(e=>Math.hypot(e.x-g.p.x,e.y-g.p.y)>=140),'never on top of the frog');
 state.oneHit=true;g.damageEnemy(live[0],.5);assert.equal(live[0].dead,true);
 const kills=g.kills;assert.equal(clearSandboxEnemies(g),live.length-1);assert.equal(g.kills,kills,'removed, not killed');
 g.update(.02,{});assert.equal(g.room.clear,true,'room clears again');
 for(let i=0;i<30;i++)spawnSandboxEnemy(g,'brute');
 assert.equal(g.room.enemies.filter(e=>!e.dead).length,24,'capped');
});
test('training dummies never move, attack or die, and report damage per second',()=>{
 const {g,state}=sandbox();state.oneHit=true;
 const dummy=spawnSandboxEnemy(g,null,{dummy:true}),fly=spawnSandboxEnemy(g,null,{dummy:true,flying:true});
 assert.equal(dummy.type,'brute');assert.equal(fly.type,'hopper');assert.equal(fly.dummy,'fly');
 assert.equal(g.room.clear,true,'a dummy does not lock the doors');
 const at={x:fly.x,y:fly.y};
 for(let i=0;i<150;i++){g.damageEnemy(dummy,2);g.update(.02,{})}
 assert.equal(dummy.dead,undefined);assert.ok(dummy.hp>dummy.maxHp/2);
 assert.equal(dummy.dummyTotal,300);assert.ok(Math.abs(dummyDps(g,dummy)-100)<5,String(dummyDps(g,dummy)));
 assert.deepEqual({x:fly.x,y:fly.y},at,'the flying dummy stays put');
 g.p.inv=0;g.p.x=dummy.x;g.p.y=dummy.y;const hp=g.p.hp;g.update(.02,{});assert.equal(g.p.hp,hp,'touching a dummy is harmless');
});
test('chapters, rooms and bosses: items and resources carry over, locks open',()=>{
 const {g}=sandbox();setSandboxItem(g,'feet',true);g.coins=12;
 assert.equal(setSandboxChapter(g,4),true);assert.equal(g.floor,4);assert.equal(g.has('feet'),true);assert.equal(g.coins,12);
 assert.equal(g.room.type,'start');assert.ok(g.rooms.filter(r=>r.exists).every(r=>r.seen));
 assert.equal(setSandboxChapter(g,9),false);
 const cache=g.rooms.find(r=>r.exists&&r.type==='cache');
 if(cache){assert.equal(enterSandboxRoom(g,'cache'),true);assert.equal(g.room.bombLocked,false)}
 assert.equal(enterSandboxRoom(g,'treasure'),true);assert.equal(g.room.type,'treasure');
 const keys=g.keys;assert.equal(enterSandboxRoom(g,'vault'),true);assert.equal(g.keys,keys,'no key spent');
 assert.equal(sandboxBoss(g,3),true);assert.equal(g.floor,3);assert.equal(g.room.type,'boss');
 assert.equal(g.room.enemies[0].kind,'catcher');
 assert.equal(sandboxBoss(g,5),true);assert.deepEqual(g.room.enemies.map(e=>e.kind),['bull','meishu']);
 // Adding enemies to a cleared boss room never replays its finale.
 g.room.enemies.forEach(e=>e.dead=true);g.room.clear=true;spawnSandboxEnemy(g,'brute');assert.equal(g.room.clear,true);
});
test('resources, room reset, speed and toggles',()=>{
 const {g,state}=sandbox();
 sandboxResource(g,'coins');sandboxResource(g,'keys');sandboxResource(g,'bombs');
 assert.deepEqual([g.coins,g.keys,g.bombs],[40,8,8]);
 g.p.hp=2;sandboxResource(g,'heal');assert.equal(g.p.hp,6);
 sandboxResource(g,'maxhp');assert.deepEqual([g.p.hp,g.p.maxHp],[7,7]);
 sandboxResource(g,'laugh');assert.equal(g.activeCharge,g.activeCost());
 sandboxResource(g,'shield');assert.equal(g.p.shield,true);assert.equal(sandboxResource(g,'gold'),false);
 assert.equal(resetSandboxRoom(g),false,'the start room has no encounter');
 enterSandboxRoom(g,'challenge');assert.equal(resetSandboxRoom(g),true);assert.ok(g.room.enemies.filter(e=>!e.dead).length>=6);
 assert.equal(runSandboxAction(g,state,'toggle','god').done,true);assert.equal(state.god,true);
 assert.equal(runSandboxAction(g,state,'toggle','active').done,false);
 assert.equal(runSandboxAction(g,state,'speed','3').done,false);
 runSandboxAction(g,state,'speed','2');const t=g.elapsed;g.update(.02,{});assert.ok(Math.abs(g.elapsed-t-.04)<1e-9,'×2 runs two steps of time');
 assert.equal(runSandboxAction(g,state,'boss','2').close,true);assert.equal(g.room.enemies[0].kind,'speaker');
});
test('the tool panel renders every tab',()=>{
 const {g,state}=sandbox();
 for(const [tab] of SANDBOX_TABS){state.tab=tab;const html=sandboxPanelHTML(g,state);assert.match(html,/沙盒工具箱/);assert.match(html,/sandboxClose/);assert.match(html,new RegExp(`data-sandbox-tab="${tab}" aria-selected="true"`))}
 state.tab='items';setSandboxItem(g,'feet',true);
 assert.match(sandboxPanelHTML(g,state),/data-value="feet" aria-pressed="true"/);
 state.tab='enemies';assert.match(sandboxPanelHTML(g,state),/抢奶跑腿怪/);
});

test('removing items preserves independent resources and the state of retained items',()=>{
 const {g}=sandbox();
 sandboxResource(g,'maxhp');sandboxResource(g,'maxhp');sandboxResource(g,'shield');
 for(const id of ['milk','feet','phoebewire'])setSandboxItem(g,id,true);
 const wire={source:'player',points:[{x:100,y:100},{x:180,y:100}],until:Infinity,width:9};
 g.phoebeWires=[wire];g.p.hp=5;
 setSandboxItem(g,'feet',false);
 assert.deepEqual([g.p.maxHp,g.p.hp,g.p.shield],[10,5,true]);assert.deepEqual(g.phoebeWires,[wire]);
 clearSandboxItems(g);assert.deepEqual([g.p.maxHp,g.p.hp,g.p.shield],[8,5,true]);
 setSandboxItem(g,'lotus',true);g.p.inv=0;g.hurt();g.p.shieldCD=5;
 setSandboxItem(g,'belly',true);setSandboxItem(g,'belly',false);
 assert.equal(g.p.shield,false);assert.equal(g.p.shieldCD,5);
});
test('training targets activate combat items without holding doors or the final rescue closed',()=>{
 const {g}=sandbox();
 const dummy=spawnSandboxEnemy(g,null,{dummy:true});assert.ok(g.room.clear);
 setSandboxItem(g,'phoebewire',true);setSandboxItem(g,'gojohalf',true);
 g.update(.025,{dash:true,mx:1});for(let i=0;i<14;i++)g.update(.025,{mx:1});
 assert.ok(g.gojo);assert.equal(g.phoebeWires.length,1);assert.equal(dummy.dead,undefined);
 const mob=spawnSandboxEnemy(g,'runner');g.damageEnemy(mob,1000);g.update(.01,{});
 assert.equal(g.room.clear,true);
 sandboxBoss(g,5);spawnSandboxEnemy(g,null,{dummy:true,flying:true});
 for(const boss of g.room.enemies.filter(e=>e.type==='boss'))g.damageEnemy(boss,2000);
 g.update(.015,{});assert.equal(g.mode,'rescue');assert.equal(g.rescue.presses,0);
});
test('fast-forward advances at twice the player clock across common frame rates',()=>{
 for(const hz of [25,30,60,120]){
  const {g,state}=sandbox();state.speed=2;
  for(let i=0;i<hz;i++)g.update(1/hz,{bomb:i===0});
  assert.ok(Math.abs(g.elapsed-2)<1e-8,String(hz));assert.equal(g.bombs,4);
 }
});
test('scene tools reach each existing room and open rooms spread a full set of manual spawns',()=>{
 const {g,state}=sandbox(),rooms=g.rooms.filter(r=>r.exists);
 const buttons=[...sandboxPanelHTML(g,state).matchAll(/data-room-id="(\d+)"/g)].map(m=>Number(m[1]));
 assert.deepEqual(buttons,rooms.map(r=>r.id));
 const mobs=Array.from({length:24},()=>spawnSandboxEnemy(g,'brute'));
 assert.ok(mobs.every(Boolean));assert.equal(spawnSandboxEnemy(g,'brute'),null);
 for(const [i,m] of mobs.entries())for(const n of mobs.slice(i+1))assert.ok(Math.hypot(m.x-n.x,m.y-n.y)>=58);
 for(const id of buttons){assert.ok(enterSandboxRoom(g,String(id)));assert.equal(g.roomId,id)}
});
test('rolling dummy DPS uses five player seconds even after older hits expire',()=>{
 const {g}=sandbox(),dummy=spawnSandboxEnemy(g,null,{dummy:true});
 g.actionClock=0;g.damageEnemy(dummy,10);g.actionClock=4.5;g.damageEnemy(dummy,5);
 g.actionClock=5.6;g.elapsed=.9;assert.equal(dummyDps(g,dummy),1);
 g.actionClock=10;assert.equal(dummyDps(g,dummy),0);
});
