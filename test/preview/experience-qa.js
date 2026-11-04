const NativeAudio=window.Audio,tracks=[],history=[];window.Audio=class extends NativeAudio{constructor(url){super(url);const state={audio:this,file:new URL(url).pathname.split('/').at(-1),played:0,furthest:0};tracks.push(state);this.addEventListener('playing',()=>{if(!this.muted){state.played++;history.push(state.file)}});this.addEventListener('timeupdate',()=>{if(!this.muted)state.furthest=Math.max(state.furthest,this.currentTime)})}};
const {game:initial,start,processEvents}=await import('./game.js');const mod=await import('./game.js');let label='请先点击出发';
function cast(badge){const g=mod.game;g.items=badge?['quietbadge']:[];g.activeLatch=false;g.activeCharge=g.activeCost();g.update(.02,{active:true});processEvents();label=badge?'徽章释放大爆笑':'空背包释放大爆笑'}
document.querySelector('#qaPlain').onclick=()=>cast(false);document.querySelector('#qaBadge').onclick=()=>cast(true);
document.querySelector('#qaBoss').onclick=()=>{mod.game.emit('bossVoice',{kind:'bull',skill:'charge',owner:{}});processEvents();label='牛来语音'};
document.querySelector('#qaBoth').onclick=()=>cast(false);
setInterval(()=>{const laugh=tracks.find(t=>t.file==='nailong-laugh.mp3');document.querySelector('#qaStatus').textContent=label+' | 模式 '+mod.game.mode+' | 本局道具 '+mod.game.items.join(',')+'\n实际非静音播放记录：'+history.join(', ')+'\n大笑次数：'+(laugh?.played||0)+' | 最远播放：'+(laugh?.furthest||0).toFixed(2)+'s | 当前：'+tracks.filter(t=>!t.audio.paused&&!t.audio.muted).map(t=>t.file).join(', ');},50);

const {ITEMS}=await import('./campaign.js');
function auditButton(text,fn){const b=document.createElement('button');b.textContent=text;b.onclick=fn;document.querySelector('#qaPlain').parentElement.prepend(b)}
auditButton('检查商店图标',()=>{mod.game.room.type='shop';mod.game.coins=99;mod.game.offer('图标验收商店');processEvents()});
auditButton('检查三选一图标',()=>{const g=mod.game;g.room.type='treasure';g.choices=['ricewhale','gojohalf','phoebe'].map(id=>ITEMS.find(i=>i.id===id));g.mode='choice';g.emit('choice',{title:'图标验收三选一',choices:g.choices});processEvents()});

auditButton('Man 强化音效',()=>{const g=mod.game;g.items=['man'];g.manReady=true;g.shoot(1,0);processEvents();label='持有 Man 的强化射击'});
auditButton('失去道具阻止语音',()=>{mod.game.items=[];mod.game.emit('itemVoice',{key:'man'});processEvents();label='空背包请求 Man 应被拒绝'});
auditButton('属性变化',()=>{const g=mod.game;g.items=['scarf','milkfilter','lotus'];g.p.hp=2;g.p.shield=true;processEvents();label='围兜低血伤害与护盾就绪'});
setInterval(()=>{document.querySelector('#qaStatus').dataset.media=JSON.stringify(tracks.map(t=>({file:t.file,ready:t.audio.readyState,duration:t.audio.duration,error:t.audio.error?.code||0,played:t.played,furthest:t.furthest})))},200);
