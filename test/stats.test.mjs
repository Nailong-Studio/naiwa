import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,ITEMS} from '../dist/engine.js';
import {createStatsPanel} from '../dist/stats.js';
import {Game as CampaignGame,ITEMS as CATALOG} from '../dist/campaign.js';

test('all 74 item damage readouts and compact rail mirror the actual central shot; shield changes stay live',()=>{
 const fields=Object.fromEntries(['state','health','damage','rate','speed','shots','shield','dash','laugh','effects'].map(key=>[key,{dataset:{stat:key},textContent:''}]));
 const compact=['damage','rate','speed','shield'].map(key=>({dataset:{compactStat:key},textContent:''}));
 const render=createStatsPanel({querySelectorAll:()=>Object.values(fields),querySelector:()=>({value:0})},{querySelectorAll:()=>compact});
 for(const item of CATALOG){const g=new CampaignGame(()=>.42);g.start();g.mode='choice';g.choices=[item];g.choose(item.id);render(g);g.shoot(1,0);const b=g.bullets.find(b=>b.vy===0);assert.equal(fields.damage.textContent,b.damage.toFixed(2),item.id);assert.equal(compact[0].textContent,fields.damage.textContent);assert.equal(compact[1].textContent,fields.rate.textContent.replace(' 次/秒','/s'))}
 const g=new CampaignGame();g.items=['lotus'];g.p.shield=true;render(g);assert.equal(compact[3].textContent,'就绪');g.p.shield=false;g.p.shieldCD=6.2;render(g);assert.equal(compact[3].textContent,'7s');
});
test('panel tracks item stats, shield recovery, pause and fresh runs',()=>{
 const fields=Object.fromEntries(['state','health','damage','rate','speed','shots','shield','dash','laugh','effects'].map(key=>[key,{dataset:{stat:key},textContent:''}]));
 const meters={shield:{value:0},dash:{value:0}};
 const panel={querySelectorAll:()=>Object.values(fields),querySelector:s=>meters[s.includes('shield')?'shield':'dash']};
 const render=createStatsPanel(panel),g=new Game();g.start();render(g);
 assert.equal(fields.damage.textContent,'1.00');assert.equal(fields.shield.textContent,'未获得');
 for(const id of ['lotus','double','eye','belly']){g.mode='choice';g.choices=[ITEMS.find(i=>i.id===id)];g.choose(id)}
 render(g);assert.equal(fields.damage.textContent,'0.94');assert.equal(fields.shots.textContent,'2 发');assert.equal(fields.effects.textContent,'毒笑 · 双发');assert.equal(meters.shield.value,1);
 g.hurt();render(g);assert.equal(fields.shield.textContent,'12.0 秒后恢复');assert.equal(meters.shield.value,0);
 g.update(.04,{});assert.equal(g.p.shieldCD,12);g.room.clear=false;g.room.enemies=[g.spawn('shooter',800,100)];g.room.enemies[0].hp=999;g.room.enemies[0].cd=999;g.enemySpeed=()=>0;g.update(.04,{dash:true,mx:1});render(g);assert.equal(fields.dash.textContent,'蛙跳中 · 无敌');assert.ok(meters.shield.value>0);
 g.mode='paused';const value=fields.shield.textContent;g.update(.04,{});render(g);assert.equal(fields.shield.textContent,value);assert.equal(fields.state.textContent,'已暂停');
 g.mode='play';for(let n=0;n<310;n++)g.update(.04,{});render(g);assert.equal(fields.shield.textContent,'已就绪 · 抵挡 1 次');assert.equal(fields.dash.textContent,'已就绪');
 render(new Game());assert.equal(fields.damage.textContent,'1.00');assert.equal(fields.effects.textContent,'普通大笑');assert.equal(fields.state.textContent,'尚未出发');
});

test('panel reports actual voice damage, firing cadence, count and stacked effects',()=>{
 const fields=Object.fromEntries(['state','health','damage','rate','speed','shots','shield','dash','laugh','effects'].map(key=>[key,{dataset:{stat:key},textContent:''}]));
 const panel={querySelectorAll:()=>Object.values(fields),querySelector:()=>({value:0})};const g=new Game();g.items=['fanvoice','heavyvoice','returnvoice','double'];createStatsPanel(panel)(g);
 assert.equal(fields.damage.textContent,(1.15*2.2*.65*.7).toFixed(2));assert.equal(fields.rate.textContent,(1/(g.p.rate*1.15*1.8)).toFixed(2)+' 次/秒');assert.equal(fields.shots.textContent,'6 发');assert.ok(fields.effects.textContent.includes('往返声波'));
});
