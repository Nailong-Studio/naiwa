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
export function renderPurchaseDialog(root,{game,title,choices,onChoose,onLeave}){
 const selection=createPurchaseSelection(game);
 root.innerHTML=`<div class="modal purchase-modal" role="dialog" aria-modal="true" aria-labelledby="purchaseTitle"><div class="purchase-heading"><h2 id="purchaseTitle"></h2><p>先选商品查看详情，再确认。滑动货架不会购买。</p></div><div class="purchase-body"><div class="purchase-list" aria-label="商品货架"></div><div class="purchase-detail"><strong class="purchase-name">尚未选择商品</strong><p class="purchase-description">点左侧商品，查看效果和消耗。</p><div class="purchase-cost" role="status"></div><button class="primary purchase-confirm" disabled>请选择商品</button></div></div><button class="secondary purchase-leave">离开商店 / 回收台</button></div>`;
 root.querySelector('h2').textContent=title;
 root.querySelector('.purchase-heading p').textContent=game.room.type==='start'?'本层限量，进出房间不会补货；下一层恢复次数。':'本层道具售出不补货；仅付费刷新剩余道具。先选择，再确认购买。';
 const list=root.querySelector('.purchase-list'),confirm=root.querySelector('.purchase-confirm');
 function select(item,button){
  selection.select(item.id);const q=selection.quote();
  for(const b of list.children)b.setAttribute('aria-pressed',String(b===button));
  root.querySelector('.purchase-name').textContent=item.name;
  root.querySelector('.purchase-description').textContent=item.desc;
  root.querySelector('.purchase-cost').textContent=`消耗 ${q.cost} ${q.unit} · 当前 ${q.available}${q.reason?' · '+q.reason:' · 剩余 '+q.remaining}`;
  confirm.disabled=!!q.reason;confirm.textContent=q.reason||`确认${q.verb} · ${q.cost} ${q.unit}`;
 }
 for(const item of choices){
  const button=root.ownerDocument.createElement('button');button.className='purchase-item';button.setAttribute('aria-pressed','false');button.innerHTML=itemIcon(item);const label=root.ownerDocument.createElement('span');label.textContent=item.name+(game.room.type==='start'?' · 剩余 '+Math.max(0,item.limit-(game.room.exchanges[item.id]||0))+' 次':'');button.append(label);
  button.addEventListener('click',()=>select(item,button));list.append(button);
 }
 const sold=game.room.type==='start'?EXCHANGES.filter(t=>(game.room.exchanges[t.id]||0)>=t.limit):(game.room.shopSold||[]);
 for(const item of sold){const button=root.ownerDocument.createElement('button');button.className='purchase-item';button.disabled=true;button.textContent=item.name+(game.room.type==='start'?' · 本层已兑完':' · 本层已售出');list.append(button)}
 confirm.addEventListener('click',()=>{confirm.disabled=true;const success=selection.confirm();if(!success){confirm.textContent='请重新选择商品';root.querySelector('.purchase-cost').textContent='未完成购买，请重新选择并检查资源。'}onChoose(success)});
 root.querySelector('.purchase-leave').addEventListener('click',onLeave);
}
