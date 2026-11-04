import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,ITEMS} from '../dist/campaign.js';
import {EXCHANGES} from '../dist/resource-scenes.js';
import {itemIcon} from '../dist/item-icons.js';
test('every offered shop supply/service and exchange has a real icon rather than a font glyph',()=>{
 const g=new Game(()=>.42);g.start();g.room.type='shop';g.offer('shop');const all=[...ITEMS,...g.choices,...EXCHANGES];
 for(const item of all){const html=itemIcon(item);assert.ok(html.includes('item-texture'),item.id);assert.ok(!html.includes('resource-symbol'),item.id);assert.ok(!html.includes('NaN'),item.id)}
 const supplies=g.choices.filter(i=>i.id.startsWith('supply_')||i.id.startsWith('service_'));assert.equal(supplies.length,7);assert.equal(EXCHANGES.length,5);
 assert.equal(new Set([...supplies,...EXCHANGES].map(itemIcon)).size,12,'each action has its own recognizable icon');
});
