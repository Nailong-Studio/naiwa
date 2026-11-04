export const CREATOR={name:'Done',douyin:'35280680285',repository:'https://github.com/kol-mm/naiwa',image:'assets/creator-douyin.jpg'};

export function creatorLinks(){
 return `<div class="creator-links" aria-label="作者与源码"><button type="button" data-creator-open>关注作者 @${CREATOR.name}</button><span aria-hidden="true">·</span><a href="${CREATOR.repository}" target="_blank" rel="noopener noreferrer">GitHub 源码 ↗</a></div>`;
}

let dialog;
function openCreator(){
 if(!dialog){
  dialog=document.createElement('dialog');dialog.className='creator-dialog';dialog.setAttribute('aria-labelledby','creator-title');
  dialog.innerHTML=`<button type="button" class="creator-close" aria-label="关闭作者名片">关闭 ✕</button><div class="creator-body"><a class="creator-image" href="${CREATOR.image}" target="_blank" rel="noopener" aria-label="打开抖音码原图"><img src="${CREATOR.image}" width="1125" height="1680" alt="Done 的抖音个人名片，抖音号 ${CREATOR.douyin}"></a><section class="creator-info"><span class="creator-eyebrow">池塘背后的作者</span><h2 id="creator-title">@${CREATOR.name}</h2><p>喜欢这只奶蛙的话，欢迎来抖音找我。</p><label for="creator-account">抖音号</label><input id="creator-account" value="${CREATOR.douyin}" readonly aria-label="作者抖音号"><div class="creator-actions"><button type="button" data-creator-copy>复制抖音号</button><a href="${CREATOR.image}" download="Done-抖音名片.jpg">保存名片</a><a href="${CREATOR.repository}" target="_blank" rel="noopener noreferrer">查看 GitHub 仓库 ↗</a></div><p class="creator-hint">可用抖音扫一扫；同一部手机可保存图片后从相册识别，也可以直接搜索抖音号。</p><p class="creator-status" role="status" aria-live="polite"></p></section></div>`;
  document.body.append(dialog);
  dialog.querySelector('.creator-close').onclick=()=>dialog.close();
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
  dialog.querySelector('[data-creator-copy]').onclick=async()=>{
   const status=dialog.querySelector('.creator-status');
   try{await navigator.clipboard.writeText(CREATOR.douyin);status.textContent='抖音号已复制'}
   catch{const input=dialog.querySelector('input');input.focus();input.select();status.textContent='请长按或按 Ctrl+C 复制已选中的抖音号'}
  };
  // The optional card never changes game state; Escape only closes this dialog.
  window.addEventListener('keydown',e=>{if(!dialog.open)return;e.stopImmediatePropagation();if(e.key==='Escape'){e.preventDefault();dialog.close()}},true);
 }
 dialog.querySelector('.creator-status').textContent='';
 if(!dialog.open)dialog.showModal();
}

export function bindCreatorLinks(root){
 root.querySelectorAll('[data-creator-open]').forEach(button=>button.onclick=openCreator);
}
