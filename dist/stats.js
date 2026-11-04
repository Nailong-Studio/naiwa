import {PHOEBE_ITEMS,phoebeCombos} from './phoebe-items.js';
import {DEEPSEEK_ITEMS,deepStats,deepCombos} from './deepseek-items.js';
import {CHRONO_ITEMS,sandyActive,chronoAttackInterval} from './chrono-items.js';
import {MEME_ITEMS,memeInterval,memeCombos,mambaActive} from './meme-items.js';
import {COMBO_ITEMS,gearInterval,synergyText} from './item-combos.js';
import {voiceStats} from './voice-builds.js';
import {playerAttackDamage} from './player-damage.js';
// Read the same player state used by combat; no independent timers.
export function createStatsPanel(panel,compact=null) {
  const compactFields=compact?[...compact.querySelectorAll('[data-compact-stat]')]:[];
  const fields = Object.fromEntries([...panel.querySelectorAll('[data-stat]')].map(el => [el.dataset.stat, el]));
  const set = (key, value) => { if (fields[key].textContent !== value) fields[key].textContent = value; };
  const remaining = seconds => `${Math.max(.1, Math.ceil(seconds * 10) / 10).toFixed(1)} 秒`;
  return game => {
    const p = game.p,voice=voiceStats(game);
    set('state', ({title:'尚未出发',play:'实时更新',paused:'已暂停',help:'查看说明',choice:'选择道具',revive:'观看复活广告',dead:'本局结束',win:'已通关',rescue:'大笑救援中'})[game.mode]);
    set('health', `${p.hp} / ${p.maxHp}`);
    set('damage', playerAttackDamage(game).toFixed(2));
    set('rate', `${(1 / (chronoAttackInterval(game,p.rate*voice.interval*gearInterval(game)*memeInterval(game)*deepStats(game).interval))).toFixed(2)} 次/秒`);
    set('speed', `${Math.round(p.speed*(mambaActive(game)?1.25:1)*(sandyActive(game)?1.35:1)*(game.phoebeBoost>0?1.2:1)*(game.tempuraBuff>0?1.15:1))}`);
    set('shots', `${(game.has('double')?2:1)*voice.shots} 发`);
    set('shield', p.shield ? (game.has('lotus')?'已就绪 · 抵挡 1 次':'一次性 · 抵挡 1 次') : !game.has('lotus') ? '未获得' : `${remaining(p.shieldCD)}后恢复`);
    set('dash', p.dash > 0 ? '蛙跳中 · 无敌' : p.dashCD > 0 ? `${remaining(p.dashCD)}后就绪` : '已就绪');
    if(fields.active){set('active',`${Math.floor(game.activeCharge)} / ${game.activeCost()}`);panel.querySelector('[data-meter="active"]').value=game.activeCharge/game.activeCost()}
    set('laugh', game.has('laugh') ? (p.laugh > 0 ? `${remaining(p.laugh)}后触发` : '即将触发') : '未获得');
    set('effects', [...PHOEBE_ITEMS.map(i=>[i.id,i.name]),...DEEPSEEK_ITEMS.map(i=>[i.id,i.name]),...CHRONO_ITEMS.map(i=>[i.id,i.name]),...MEME_ITEMS.map(i=>[i.id,i.name]),...COMBO_ITEMS.map(i=>[i.id,i.name]),['fanvoice','扇形近战'],['heavyvoice','重型穿透笑弹'],['returnvoice','往返声波'],['eye','毒笑'],['double','双发'],['tongue','穿透'],['bubble','反弹'],['homing','追踪'],['split','分裂'],['mouse','奶鼠'],['dog','奶狗'],['egg','奶蛋'],['turtle','奶龟'],['rabbit','奶兔'],['milkboots','奶迹免疫'],['milkfilter','奶迹增伤'],['spillcup','爆笑留奶'],['milkfoam','奶泡留痕'],['tadpole','蝌蚪伙伴']].filter(([id]) => game.has(id)).map(([,name]) => name).join(' · ') || '普通大笑');
    if(sandyActive(game)&&game.mode==='play')set('state',`斯安威斯坦 ${game.sandy.left.toFixed(1)}秒`);
    if(fields.synergies){const combos=[synergyText(game),...memeCombos(game),...deepCombos(game),...phoebeCombos(game)].filter(t=>!t.startsWith('继续收集'));set('synergies',combos.join(' · ')||'继续收集道具，组合不同效果');}
    if(fields.groundguard){const guards=[];if(game.has('milkboots'))guards.push(game.bootGuardCD>0?'雨靴 '+remaining(game.bootGuardCD)+'后恢复':'雨靴就绪');if(game.has('phoebesoot'))guards.push(game.room.phoebeSootUsed?'电焦本房已用':'电焦本房可用');set('groundguard',guards.join(' · ')||'未获得')}
    if(mambaActive(game))set('effects',fields.effects.textContent+' · 落地强化 '+remaining(game.outUntil-(game.actionClock??game.elapsed)));
    if(game.tempuraBuff>0)set('effects',fields.effects.textContent+' · 虾米强化 '+remaining(game.tempuraBuff));
    if(fields.button)set('button',!game.has('sparebutton')?'未获得':game.buttonFloor===game.floor?'本层已用':'本层可用');
    for(const el of compactFields){const key=el.dataset.compactStat;let value=fields[key]?.textContent||'—';if(key==='rate')value=value.replace(' 次/秒','/s');if(key==='shield')value=p.shield?'就绪':game.has('lotus')?Math.ceil(Math.max(0,p.shieldCD))+'s':'无';if(el.textContent!==value)el.textContent=value;}
    fields.shield.dataset.ready = String(p.shield);
    fields.dash.dataset.ready = String(p.dashCD <= 0);
    fields.health.dataset.low = String(p.hp <= 2);
    const shieldBar = panel.querySelector('[data-meter="shield"]');
    const dashBar = panel.querySelector('[data-meter="dash"]');
    shieldBar.value = p.shield ? 1 : !game.has('lotus') ? 0 : Math.max(0, 1 - p.shieldCD / 12);
    dashBar.value = Math.max(0, 1 - p.dashCD / (game.has('feet') ? 1.3 : 2));
  };
}
