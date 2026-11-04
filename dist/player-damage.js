import {deepStats} from './deepseek-items.js';
import {memeDamage} from './meme-items.js';
import {gearDamage} from './item-combos.js';
import {voiceStats} from './voice-builds.js';
import {onMilk} from './combat-content.js';

// Current single-shot attack, shared by the panel and player-owned wires.
// Reading stats must not consume charged volleys or trigger shot effects.
export function playerAttackDamage(g){
 return g.p.damage*deepStats(g).damage*memeDamage(g)*voiceStats(g).damage*gearDamage(g)
  *(g.has('scarf')?(g.p.hp<=2?1.7:1.1):1)
  *(g.has('milkfilter')?(onMilk(g,g.p)?1.4:1.08):1);
}
