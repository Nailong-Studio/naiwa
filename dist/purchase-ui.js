import {EXCHANGES} from './resource-scenes.js';
import {itemIcon} from './item-icons.js';
export function purchaseQuote(game,item){
 const exchange=game.room.type==='start',resource=exchange?item.cost:'coins';
 const cost=exchange?(item.costAmount||1):(item.cost??(item.resource?3:game.price()));
 const available=resource==='health'?game.p.hp:game[resource];
 const unit={coins:'金币',keys:'把钥匙',bombs:'枚炸弹',health:'点生命'}[resource];
 let reason=available<cost?'资源不足':resource==='health'&&available<=cost?'兑换后至少保留 1 点生命':'';
 if(item.resource==='health'&&game.p.hp>=game.p.maxHp)reason='生命已满';
 if(item.id==='service_shield'&&game.p.shield)reason='已有护盾';
 if(item.id==='service_charge'&&game.activeCharge>=game.activeCost())reason='爆笑已充满';
 if(item.id==='service_map'&&!game.rooms.some(r=>r.exists&&r.type==='cache'&&!r.revealed&&!r.visited))reason='已发现隐藏房间';
 return {cost,available,unit,remaining:available-cost,reason,verb:exchange?'兑换':'购买'};
}
export function createPurchaseSelection(game){
 let selected=null,selectedRoom=null,selectedChoices=null,selectedFloor=null;
 return {
  select(id){selectedRoom=game.room;selectedChoices=game.choices;selectedFloor=game.floor;selected=game.mode==='choice'?game.choices.find(i=>i.id===id)||null:null;return selected},
  quote(){return selected?purchaseQuote(game,selected):null},
  confirm(){const item=selected;selected=null;if(!item||game.room!==selectedRoom||game.floor!==selectedFloor||game.choices!==selectedChoices||game.mode!=='choice'||!game.choices.some(i=>i.id===item.id)||purchaseQuote(game,item).reason)return false;return game.choose(item.id)},
 };
}
// Shop names carry their price ("名字 · 10 金币"); the card shows the price in its own tag.
const plainName=item=>item.name.replace(/ · \d+ 金币$/,'');
function tag(doc,className,text){const el=doc.createElement('span');el.className=className;el.textContent=text;return el}
export function renderPurchaseDialog(root,{game,title,choices,onChoose,onLeave}){
 const selection=createPurchaseSelection(game),exchange=game.room.type==='start';
 root.innerHTML=`<div class="modal purchase-modal" role="dialog" aria-modal="true" aria-labelledby="purchaseTitle"><div class="purchase-heading"><div class="purchase-title"><h2 id="purchaseTitle"></h2><p></p></div><button class="secondary purchase-leave">离开商店 / 回收台</button></div><div class="purchase-body"><div class="purchase-shelf"><div class="purchase-list" aria-label="商品货架"></div></div><div class="purchase-detail" data-empty="true"><div class="purchase-detail-head"><span class="purchase-detail-icon" aria-hidden="true"></span><strong class="purchase-name">尚未选择商品</strong></div><p class="purchase-description">点左侧商品，查看效果和消耗。滑动货架不会购买。</p><div class="purchase-checkout"><div class="purchase-cost" role="status"></div><button class="primary purchase-confirm" disabled>请选择商品</button></div></div></div></div>`;
 const doc=root.ownerDocument,q=s=>root.querySelector(s);
 q('h2').textContent=title;
 q('.purchase-title p').textContent=exchange?'本层限量，进出房间不会补货；下一层恢复次数。':'本层道具售出不补货；仅付费刷新剩余道具。先选择，再确认购买。';
 const list=q('.purchase-list'),confirm=q('.purchase-confirm'),cost=q('.purchase-cost'),detail=q('.purchase-detail');
 function costCell(label,value,className=''){const cell=doc.createElement('span');cell.className='purchase-cost-cell '+className;cell.append(tag(doc,'purchase-cost-label',label),tag(doc,'purchase-cost-value',value));return cell}
 function select(item,button){
  selection.select(item.id);const quote=selection.quote();
  for(const b of list.children)b.setAttribute('aria-pressed',String(b===button));
  detail.dataset.empty='false';detail.dataset.blocked=String(!!quote.reason);
  q('.purchase-detail-icon').innerHTML=itemIcon(item);
  q('.purchase-name').textContent=plainName(item);
  q('.purchase-description').textContent=item.desc;q('.purchase-description').scrollTop=0;
  // Price, balance after purchase or the blocking reason, and the confirm action stay together.
  cost.replaceChildren(costCell('消耗',`${quote.cost} ${quote.unit}`),costCell('当前',String(quote.available)),quote.reason?costCell(`无法${quote.verb}`,quote.reason,'is-reason'):costCell(`${quote.verb}后剩余`,String(quote.remaining),'is-remaining'));
  cost.setAttribute('aria-label',`消耗 ${quote.cost} ${quote.unit} · 当前 ${quote.available}${quote.reason?' · '+quote.reason:' · 剩余 '+quote.remaining}`);
  confirm.disabled=!!quote.reason;confirm.textContent=quote.reason||`确认${quote.verb} · ${quote.cost} ${quote.unit}`;
 }
 for(const item of choices){
  const quote=purchaseQuote(game,item),button=doc.createElement('button');button.className='purchase-item';button.setAttribute('aria-pressed','false');if(quote.reason)button.dataset.blocked='true';
  button.innerHTML=itemIcon(item);
  const text=tag(doc,'purchase-item-text','');text.append(tag(doc,'purchase-item-name',plainName(item)),tag(doc,'purchase-item-effect',item.short||item.desc));
  const price=tag(doc,'purchase-price',exchange?`剩 ${Math.max(0,item.limit-(game.room.exchanges[item.id]||0))} 次`:`${quote.cost} ${quote.unit}`);
  button.append(text,price);
  button.addEventListener('click',()=>select(item,button));list.append(button);
 }
 const sold=exchange?EXCHANGES.filter(t=>(game.room.exchanges[t.id]||0)>=t.limit):(game.room.shopSold||[]);
 for(const item of sold){const button=doc.createElement('button');button.className='purchase-item is-sold';button.disabled=true;button.innerHTML=itemIcon(item);const text=tag(doc,'purchase-item-text','');text.append(tag(doc,'purchase-item-name',plainName(item)));button.append(text,tag(doc,'purchase-price',exchange?'本层已兑完':'本层已售出'));list.append(button)}
 confirm.addEventListener('click',()=>{confirm.disabled=true;const success=selection.confirm();if(!success){confirm.textContent='请重新选择商品';cost.textContent='未完成购买，请重新选择并检查资源。'}onChoose(success)});
 q('.purchase-leave').addEventListener('click',onLeave);
}
