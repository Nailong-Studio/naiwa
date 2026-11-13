import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,ITEMS} from '../dist/campaign.js';
import {ENCOUNTERS} from '../dist/encounter-profiles.js';
import {CODEX_KEY,CODEX_ENEMIES,CODEX_BOSSES,readCodex,recordCodex,saveCodex,codexProgress,codexHTML} from '../dist/codex.js';
import {createSandboxState,startSandbox,spawnSandboxEnemy} from '../dist/sandbox.js';

const seeded=(seed=11)=>()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646};
const store=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),m}};
function browserStore(){
 const s=store();
 s.key=i=>[...s.m.keys()][i]??null;
 return Object.defineProperty(s,'length',{get:()=>s.m.size});
}

test('every enemy the encounter tables can spawn has an entry, and nothing else does',()=>{
 const spawned=new Set(ENCOUNTERS.flat(2));spawned.add('tiny');
 assert.deepEqual(new Set(CODEX_ENEMIES.map(([t])=>t)),spawned);
 for(const [type,floor,text] of CODEX_ENEMIES){assert.ok(floor>=1&&floor<=5,type);assert.ok(text.length>8,type)}
 // Each enemy is filed under the first chapter whose rooms use it.
 for(const [type,floor] of CODEX_ENEMIES)if(type!=='tiny')assert.equal(ENCOUNTERS.findIndex(ch=>ch.flat().includes(type))+1,floor,type);
 assert.deepEqual(CODEX_BOSSES.flatMap(b=>b.kinds),['collector','speaker','catcher','puppet','bull','meishu']);
});
test('a real run records offered and taken items, room enemies and boss wins once',()=>{
 const g=new Game(seeded());g.start();const codex=readCodex(store());
 assert.deepEqual(codexProgress(codex),{items:0,itemsTotal:ITEMS.length-1,enemies:0,enemiesTotal:25,bosses:0,bossesTotal:5});
 g.mode='choice';g.choices=[ITEMS.find(i=>i.id==='feet'),ITEMS.find(i=>i.id==='milk'),{id:'supply_key'}];
 assert.equal(recordCodex(codex,g),true);assert.deepEqual(codex.items,{feet:1,milk:1});
 g.choose('feet');g.mode='play';assert.equal(recordCodex(codex,g),true);assert.equal(codex.items.feet,2,'taking it upgrades the entry');
 assert.equal(recordCodex(codex,g),false,'nothing new');
 const fight=g.rooms.find(r=>r.exists&&r.type==='fight');g.enter(fight.id,'right');
 assert.equal(recordCodex(codex,g),true);
 assert.deepEqual(Object.keys(codex.enemies).sort(),[...new Set(g.room.enemies.map(e=>e.type))].sort());
 const boss=g.rooms.find(r=>r.exists&&r.type==='boss');g.enter(boss.id,'top');
 recordCodex(codex,g);assert.deepEqual(codex.bosses.collector,{met:1,defeated:0});
 for(const e of g.room.enemies)e.dead=true;g.room.clear=true;
 recordCodex(codex,g);recordCodex(codex,g);assert.equal(codex.bosses.collector.defeated,1,'one win per fight');
 assert.equal(codexProgress(codex).bosses,1);
});
test('sandbox enemies and training dummies never enter the compendium',()=>{
 const state=createSandboxState();state.active=true;const g=startSandbox(new Game(seeded()),state),codex=readCodex(store());
 spawnSandboxEnemy(g,'runner');spawnSandboxEnemy(g,null,{dummy:true});
 recordCodex(codex,g);assert.deepEqual(codex.enemies,{});
});
test('the compendium survives a reload and bad storage',()=>{
 const s=store(),codex=readCodex(s);codex.items.feet=2;codex.enemies.runner=1;codex.bosses.final={met:1,defeated:2};
 assert.equal(saveCodex(codex,s),true);assert.deepEqual(readCodex(s),codex);
 s.setItem(CODEX_KEY,'{broken');assert.deepEqual(readCodex(s),{items:{},enemies:{},bosses:{}});
 assert.deepEqual(readCodex({getItem(){throw Error('blocked')}}),{items:{},enemies:{},bosses:{}});
 assert.equal(saveCodex(codex,{setItem(){throw Error('quota')}}),false);
});
test('the panel shows counts, hides unknown entries and details the picked one',()=>{
 const codex={items:{feet:2,milk:1},enemies:{runner:1},bosses:{final:{met:1,defeated:1}}};
 let html=codexHTML(codex,{tab:'items'});
 assert.match(html,/道具<small>2\/73<\/small>/);assert.match(html,/敌人<small>1\/25<\/small>/);assert.match(html,/关末<small>1\/5<\/small>/);
 assert.match(html,/data-codex-pick="feet"[^>]*aria-pressed="true"/);assert.match(html,/已获得/);
 assert.match(html,/data-codex-pick="eye" disabled/);assert.ok(!html.includes(ITEMS.find(i=>i.id==='eye').desc),'unknown items keep their secrets');
 html=codexHTML(codex,{tab:'items',pick:'milk'});assert.match(html,/见过 · 尚未拿到/);
 html=codexHTML(codex,{tab:'bosses'});assert.match(html,/牛来与美鼠/);assert.match(html,/击败 1 次/);assert.match(html,/data-codex-art="final"/);
 html=codexHTML({items:{},enemies:{},bosses:{}},{tab:'enemies'});assert.match(html,/还没有记录/);
});

test('a damaged snapshot cannot inject unknown entries or poison a real boss encounter',()=>{
 const s=browserStore();
 s.setItem(CODEX_KEY,'{"items":{"feet":2,"fake":2,"milk":"2"},"enemies":{"runner":1,"unknown":1},"bosses":{"collector":1,"final":{"met":1,"defeated":-8}}}');
 const c=readCodex(s),g=new Game(seeded());g.start();
 assert.deepEqual(c,{items:{feet:2},enemies:{runner:1},bosses:{final:{met:1,defeated:0}}});
 const room=g.rooms.find(r=>r.exists&&r.type==='boss');g.enter(room.id,'top');
 assert.equal(recordCodex(c,g),true);assert.deepEqual(c.bosses.collector,{met:1,defeated:0});
});

test('independent tabs preserve discoveries, even when the aggregate write races',()=>{
 const s=browserStore(),a=readCodex(s),b=readCodex(s);
 a.items.feet=2;b.items.milk=1;
 saveCodex(a,s);const stale=s.getItem(CODEX_KEY);saveCodex(b,s);
 assert.deepEqual(readCodex(s).items,{feet:2,milk:1});
 s.setItem(CODEX_KEY,stale);
 assert.deepEqual(readCodex(s).items,{feet:2,milk:1});
});

test('two copies of a saved fight share one victory and independent runs count separately',()=>{
 const s=browserStore();
 s.setItem(CODEX_KEY,JSON.stringify({bosses:{collector:{met:1,defeated:3}}}));
 const win=id=>{
  const c=readCodex(s),g=new Game(seeded());g.start();g.codexRunId=id;
  g.enter(g.rooms.find(r=>r.type==='boss'&&r.exists).id,'top');for(const e of g.room.enemies)e.dead=true;g.room.clear=true;
  recordCodex(c,g);return c;
 };
 const a=win('same-save'),b=win('same-save'),d=win('new-run');
 saveCodex(a,s);saveCodex(d,s);saveCodex(b,s);
 assert.equal(readCodex(s).bosses.collector.defeated,5);
});

test('the clear event identifies the defeated room after an immediate floor transition',()=>{
 const c=readCodex(null),g=new Game(seeded());g.start();
 g.enter(g.rooms.find(r=>r.type==='boss'&&r.exists).id,'top');
 for(const e of g.room.enemies)g.damageEnemy(e,2000);
 g.update(.016,{});g.choose(g.choices[0].id);g.p.x=480;g.p.y=300;g.update(.016,{});
 assert.equal(g.floor,2);
 const event=g.events.find(e=>e.type==='clear');assert.ok(event.room.clear);
 recordCodex(c,g,event.room,[]);assert.equal(c.bosses.collector.defeated,1);
});

test('sandbox equipment, choices and a genuine chapter boss never count as discoveries',()=>{
 const state=createSandboxState();state.active=true;
 const g=startSandbox(new Game(seeded()),state),c=readCodex(null);
 g.items.push('feet');g.enter(g.rooms.find(r=>r.type==='boss'&&r.exists).id,'top');
 assert.equal(recordCodex(c,g,g.room,[{id:'milk'}]),false);
 assert.deepEqual(c,{items:{},enemies:{},bosses:{}});
});
