import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/campaign.js';
import {GameAudio} from '../dist/game-audio.js';
import {createRoomVoiceBoundary} from '../dist/combat-audio.js';

test('actual room changes cancel voices, resource refreshes and same-room revival do not',()=>{
 let boss=0,item=0;const sync=createRoomVoiceBoundary({bossVoice:{stop(){boss++}},itemVoice:{stop(){item++}}});
 const g=new Game();g.start();assert.equal(sync(g.room),true);
 g.coins++;g.emit('room');assert.equal(sync(g.room),false);g.bombs--;g.emit('room');assert.equal(sync(g.room),false);
 assert.equal(boss,1);assert.equal(item,1);const next=g.rooms.find(r=>r.exists&&r.type==='fight');g.enter(next.id,'top');assert.equal(sync(g.room),true);assert.equal(boss,2);assert.equal(item,2);
 g.generate();assert.equal(sync(g.room),true);assert.equal(boss,3);
});
test('automatic laugh stays quiet in cleared rooms and resumes on its combat cooldown',()=>{
 const g=new Game(()=>.42);g.start();g.items=['laugh'];g.events=[];g.p.laugh=2;
 for(let i=0;i<300;i++)g.update(.04);assert.equal(g.p.laugh,2);assert.ok(!g.events.some(e=>e.type==='laugh'));
 g.room.clear=false;g.room.type='fight';g.room.obstacles=[];const e=g.spawn('turret',850,300);e.hp=999;e.cd=999;g.room.enemies=[e];g.p.inv=999;
 for(let i=0;i<51;i++)g.update(.04);assert.equal(g.events.filter(e=>e.type==='laugh').length,1);
 g.mode='paused';const cooldown=g.p.laugh;g.update(.04);assert.equal(g.p.laugh,cooldown);
});
test('stalled laugh releases speech channel after timeout and ignores late completion',async()=>{
 let resolve;const timers=[],errors=[],a={paused:true,currentTime:0,ended:false,play(){this.paused=false;return new Promise(r=>resolve=r)},pause(){this.paused=true}};
 const voice=new GameAudio({createAudio:()=>a,schedule:(fn,ms)=>{const timer={fn,ms,cancelled:false};timers.push(timer);return timer},cancel:t=>{if(t)t.cancelled=true},onError:e=>errors.push(e)});
 voice.laugh({now:0});const timeout=timers[0];assert.equal(timeout.ms,8000);timeout.fn();assert.equal(voice.playing,false);assert.ok(a.paused);assert.equal(errors.length,1);resolve();await Promise.resolve();assert.equal(timers.length,1);
 voice.laugh({now:1});resolve();await Promise.resolve();assert.ok(timers[1].cancelled);assert.equal(timers[2].ms,1100);voice.stop();assert.ok(timers[2].cancelled);
});
