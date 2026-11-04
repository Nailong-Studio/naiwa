import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game} from '../dist/campaign.js';
import {ROOM_WARDROBE,hasRoomWardrobe,canUseRoomWardrobe,installRoomWardrobe} from '../dist/room-wardrobe.js';
import {blocked,blastTerrain} from '../dist/terrain.js';
test('wardrobe appears only in starting rooms on floors 2 through 5, not the first floor or combat rooms',()=>{
 const g=new Game();g.start();assert.equal(hasRoomWardrobe(g),false);assert.equal(g.room.obstacles.some(o=>o.wardrobe),false);
 for(let floor=2;floor<=5;floor++){g.floor=floor;g.generate();assert.equal(hasRoomWardrobe(g),true);installRoomWardrobe(g);assert.equal(g.room.obstacles.filter(o=>o.wardrobe).length,1);for(const r of g.rooms.filter(r=>r.type!=='start'))assert.equal(r.obstacles.some(o=>o.wardrobe),false);const id=g.roomId;g.roomId=g.rooms.find(r=>r.exists&&r.type==='fight').id;assert.equal(hasRoomWardrobe(g),false);g.roomId=id}
 g.floor=1;g.generate();assert.equal(hasRoomWardrobe(g),false);
});
test('nearby interaction opens wardrobe without consuming resources; recycler retains its own interaction zone',()=>{
 const g=new Game();g.start();g.floor=2;g.generate();g.events=[];g.p.x=ROOM_WARDROBE.useX;g.p.y=ROOM_WARDROBE.useY;
 const before=[g.coins,g.keys,g.bombs,g.p.hp];assert.equal(canUseRoomWardrobe(g),true);g.interact();assert.deepEqual(g.events.map(e=>e.type),['wardrobe']);assert.deepEqual([g.coins,g.keys,g.bombs,g.p.hp],before);
 g.events=[];g.p.x=480;g.p.y=300;assert.equal(canUseRoomWardrobe(g),false);g.interact();assert.equal(g.mode,'choice');assert.equal(g.events.some(e=>e.type==='wardrobe'),false);
 g.p.x=ROOM_WARDROBE.useX;g.p.y=ROOM_WARDROBE.useY;for(const mode of ['paused','choice','wardrobe','revive','dead']){g.mode=mode;g.events=[];assert.equal(canUseRoomWardrobe(g),false);g.interact();assert.equal(g.events.length,0)}
});
test('wardrobe has physical collision, survives bombs, and leaves spawn and doorway approaches clear',()=>{
 const g=new Game();g.start();g.floor=2;g.generate();const w=g.room.obstacles.find(o=>o.wardrobe);assert.equal(blocked(g.room,w.x,w.y,20),true);
 for(const [x,y] of [[480,300],[80,300],[880,300],[480,80],[480,520],[730,302]])assert.equal(blocked(g.room,x,y,20),false);
 blastTerrain(g,w.x,w.y,180);assert.ok(g.room.obstacles.includes(w));
});
test('old cover, toolbar and mobile menu wardrobe entries are removed',()=>{
 const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8'),js=readFileSync(new URL('../dist/game.js',import.meta.url),'utf8');
 assert.ok(!html.includes('id="wardrobe"'));assert.ok(!html.includes('data-menu-action="wardrobe"'));assert.ok(!js.includes('coverWardrobe'));
});
