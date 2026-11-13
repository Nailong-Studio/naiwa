import {createRunStore} from './run-save.js';
import {selectedCostume,setCostume} from './costumes.js';
import {creatorLinks,bindCreatorLinks} from './creator.js';
import {canUseRoomWardrobe,drawRoomWardrobe} from './room-wardrobe.js';
import {createWardrobe} from './wardrobe.js';
import {updateLaughReady,laughReadyState,drawLaughReady} from './laugh-ready.js';
import {SoundMixer} from './sound-mixer.js';
import {playPlayerLaugh,requestBossCue,createRoomVoiceBoundary,setGameSound} from './combat-audio.js';
import {drawItemReadiness} from './item-vfx.js';
import {ItemAudio,ownsItemVoice} from './item-audio.js';
import {drawChrono} from './chrono-art.js';
import {sandyActive} from './chrono-items.js';
import {itemIcon} from './item-icons.js';
import {BossAudio} from './boss-audio.js';
import {canRevive} from './revive.js';
import {createRevivePlayer} from './revive-ui.js';
import {requestGameFullscreen,toggleGameFullscreen,keepGameFullscreen,installFullscreenKeeper} from './fullscreen.js';
import {toVirtualPoint,virtualRect} from './rotate-view.js';
import {prepareChapterArt,enemyIndicatorY} from './sprite-art.js';
import {drawPixelEffect,drawPickup} from './pixel-effects.js';
import {GameAudio} from './game-audio.js';
import {isRescueKey} from './rescue.js';
import {renderRescueUI,updateRescueUI} from './rescue-art.js';
import {renderPurchaseDialog} from './purchase-ui.js';
import {drawHero} from './hero-art.js';
import {drawPixelEnemy,drawPixelFloor,drawPixelShot,pixelRing} from './pixel-art.js';
import {bindHoldControl,bindStickControl,bindAttackStick,cardinalAim,createTouchActions,mobileAttack,setupMobileUI} from './mobile-ui.js';
import {drawThemedEnemy,THEMED_ENEMIES} from './content-art.js';
import {drawTerrain} from './terrain-art.js';
import {createStatsPanel} from './stats.js';
import {Game,ITEMS,W,H,CHAPTERS,BOSS_NAMES} from './campaign.js';
import {drawCampaign,drawBoss,drawRunner} from './campaign-art.js';
import {assetPath,releaseArt} from './asset-url.js';
import {CODEX_KEY,mergeCodex,readCodex,recordCodex,saveCodex,codexHTML,paintCodexArt,whenCodexArt,codexProgress} from './codex.js';
import {createSandboxState,startSandbox,sandboxPanelHTML,runSandboxAction,drawSandboxOverlay} from './sandbox.js';
const $=s=>document.querySelector(s),canvas=$('#game'),screen=canvas.getContext('2d'),world=document.createElement('canvas'),ctx=world.getContext('2d'),overlay=$('#overlay');
world.width=480;world.height=300;ctx.setTransform(.5,0,0,.5,0,0);screen.imageSmoothingEnabled=false;
let labels=[];for(const method of ['fillText','strokeText'])ctx[method]=function(...args){labels.push({method,args,m:this.getTransform(),font:this.font,align:this.textAlign,baseline:this.textBaseline,fill:this.fillStyle,stroke:this.strokeStyle,width:this.lineWidth,alpha:this.globalAlpha})};
function drawLabels(){for(const l of labels){screen.save();const m=l.m;screen.setTransform(m.a*2,m.b*2,m.c*2,m.d*2,m.e*2,m.f*2);screen.font=l.font;screen.textAlign=l.align;screen.textBaseline=l.baseline;screen.fillStyle=l.fill;screen.strokeStyle=l.stroke;screen.lineWidth=l.width;screen.globalAlpha=l.alpha;screen[l.method](...l.args);screen.restore()}}
const soundMix=new SoundMixer(),createAudio=url=>soundMix.createAudio(url),createVoiceAudio=url=>soundMix.createBufferedAudio(url);
const bossVoice=new BossAudio({createAudio:createVoiceAudio}),bossDemo=new URLSearchParams(location.search).get('boss-demo')==='1';const voice=new GameAudio({createAudio:createVoiceAudio,onError:()=>toast('大笑音效暂未就绪，请再次点击操作键。')});const itemVoice=new ItemAudio({createAudio:createVoiceAudio,canPlay:key=>game.mode==='play'&&ownsItemVoice(game,key),isBusy:()=>!!bossVoice.current||voice.playing});const syncRoomVoices=createRoomVoiceBoundary({bossVoice,itemVoice});let pauseMode='play',panelResumeMode=null;
const updateStats = createStatsPanel($('.stats-panel'),$('#mobileStats'));
let game=new Game(),keys=new Set(),mouse={x:700,y:300,down:false},move={x:0,y:0},touchFire=false,touchAim={x:0,y:0},last=0,sound=true,shake=0,toastTimer,oldMode='play',best=0;
try{sound=localStorage.getItem('naiwa-sound')!=='false'}catch{}
voice.setEnabled(sound);bossVoice.setEnabled(sound);itemVoice.setEnabled(sound);soundMix.setEnabled(sound);
try{best=Number(localStorage.getItem('naiwa-best')||0)}catch{}
const touchActions=createTouchActions(),touchResets=[];
const runStore=createRunStore({getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value),removeItem:key=>localStorage.removeItem(key)});
let hasRun=false,lastSaveAt=0,saveFailed=false;
// 沙盒试玩 never writes the saved run, the best record or anything else in storage.
const sandbox=createSandboxState(),SANDBOX_CLOSING=new Set(['chapter','room','boss','resetRoom']);let fps=60;
let codex=readCodex(),codexState={tab:'items',pick:null},codexCheckedAt=0;
const codexRecording=()=>hasRun&&!sandbox.active&&!bossDemo;
let codexReturn=null,stopCodexArt=null,codexDirty=false,codexRetryAt=0;
function observeCodex(room,choices){
 if(codexRecording()&&recordCodex(codex,game,room,choices))codexDirty=true;
}
function noteCodex(){
 observeCodex();
 if(codexDirty&&performance.now()>=codexRetryAt){
  codexDirty=!saveCodex(codex);codexState.sessionOnly=codexDirty;
  codexRetryAt=codexDirty?performance.now()+5000:0;
 }
}
function refreshCodexCount(){const badge=$('#titleCodex small');if(badge)badge.textContent=codexCount()}
window.addEventListener('storage',e=>{
 if(e.key!==CODEX_KEY&&e.key!==null)return;
 if(e.key===null&&!codexDirty)codex=readCodex();else mergeCodex(codex,readCodex());
 if(codexReturn)renderCodex(true);else refreshCodexCount();
});

function unlockGameplayAudio(){if(sound&&['play','rescue'].includes(game.mode))voice.unlock()}
window.addEventListener('pointerdown',unlockGameplayAudio,{capture:true,passive:true});
window.addEventListener('keydown',unlockGameplayAudio,{capture:true});
$('#desktopFullscreen').onclick=()=>toggleGameFullscreen({mobile:false}).then(result=>{if(result==='denied'||result==='unsupported')toast('浏览器未进入全屏，已使用铺满窗口布局。')});
const syncFullscreen=()=>{$('#desktopFullscreen').textContent=document.fullscreenElement||document.webkitFullscreenElement?'退出全屏':'⛶ 全屏'};document.addEventListener('fullscreenchange',syncFullscreen);document.addEventListener('webkitfullscreenchange',syncFullscreen);
const reducedMotion=matchMedia('(prefers-reduced-motion:reduce)');
const mobileMedia=matchMedia('(max-width:780px), (pointer:coarse), (max-width:1100px) and (max-height:600px)');
const touchPointer=matchMedia('(pointer:coarse)');
const revivePlayer=createRevivePlayer({createAudio,getGame:()=>game,overlay,getSound:()=>sound,onSound:toggleSound,onCancel:()=>end(false),onRevive:()=>{voice.unlock();bossVoice.unlock();itemVoice.unlock();overlay.innerHTML='';resetTouchInput();updateUI();canvas.focus();last=performance.now();saveCurrentRun();toast('大笑复活！恢复半血，3 秒无敌保护。')}});
let wardrobeOwner=null,wardrobeMode=null;
const wardrobe=createWardrobe({onOpen:()=>{if(!canUseRoomWardrobe(game))return false;if(game.mode==='revive'){toast('观看结束后再换装。');return false}wardrobeOwner=game;wardrobeMode=game.mode;game.mode='wardrobe';resetTouchInput();voice.stop();bossVoice.stop();itemVoice.stop();soundMix.stopTone();return true},onClose:()=>{if(game===wardrobeOwner&&game.mode==='wardrobe')game.mode=wardrobeMode;resetTouchInput();last=performance.now()}});
const frogSVG='<div class="hero-frog hero-original" role="img" aria-label="奶蛙像素动作形象"></div>';
function beep(freq=500,dur=.07,type='sine',volume=.025,priority=1){return soundMix.cue(freq,dur,type,volume,priority)}
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3000)}
function title(){keepGameFullscreen(false);leaveSandbox();
 const saved=bossDemo?{status:'empty'}:runStore.read(),available=saved.status==='ok';
 if(saved.storageBlocked)codexState.sessionOnly=true;
 overlay.innerHTML=`<section class="title-cover ${available?'has-save':''}" aria-labelledby="coverTitle"><img class="cover-art" src="${assetPath('cover-rescue-v2.png')}" alt="奶蛙用大笑闯向地牢，牛来与美鼠守着关住奶豆的牢笼" fetchpriority="high"><div class="cover-copy"><div class="cover-kicker">池塘奇遇 · 救回奶豆</div><h2 id="coverTitle">奶蛙<span>的结合</span></h2><p class="cover-story">牛来和美鼠抓走了奶豆。<br>这一次，用大笑把孩子带回家。</p>${available?`<div class="cover-save"><span class="cover-save-label">上次的冒险 · 已自动保存</span><p class="cover-save-info"><b>第 ${saved.game.floor} 章 · ${CHAPTERS[saved.game.floor-1]}</b><span>${saved.game.mode==='dead'?'复活待处理':`生命 ${saved.game.p.hp}/${saved.game.p.maxHp} · 道具 ${saved.game.items.length} 件`} · ${Math.floor(saved.game.elapsed/60)} 分钟</span></p><button class="primary" id="continueRun">继续游戏 <span aria-hidden="true">→</span></button></div>`:''}<div class="cover-actions"><button class="${available?'cover-restart':'primary'}" id="start">${available?'重新开始':'出发救奶豆 <span aria-hidden="true">→</span>'}</button><button class="cover-help" id="titleHelp">玩法说明</button><button class="cover-sandbox" id="sandboxStart">沙盒试玩</button></div><p class="cover-hint">${saved.storageBlocked?'当前浏览器限制存储，本次冒险可正常游玩。':saved.status==='error'?'存档暂时无法读取。可尝试重新打开游戏。':'每 2 秒自动保存 · 本机继续冒险'}</p></div><span class="cover-edition">THE BINDING OF NAIWA</span>${bossDemo?'':`<button class="cover-codex" id="titleCodex" aria-label="打开奶蛙图鉴">图鉴<small>${codexCount()}</small></button>`}</section>`;
 const privacy = document.createElement('a');
 privacy.href = './privacy.html';
 privacy.textContent = '隐私政策';
 privacy.style.color = 'inherit';
 $('.cover-hint').append(' · ', privacy);
 if(bossDemo){$('#sandboxStart').remove();$('#start').firstChild.textContent='开始双 Boss 演示 ';$('.cover-story').innerHTML='直接进入最终房间，试听技能原声。<br>演示中奶蛙无敌，不计入最佳记录。'}
 const cover=$('.cover-art');if(cover.complete)releaseArt();else{cover.addEventListener('load',releaseArt,{once:true});cover.addEventListener('error',releaseArt,{once:true})}
 $('#start').onclick=requestNewRun;$('#titleHelp').onclick=help;$('#titleCodex')?.addEventListener('click',openCodex);$('#sandboxStart')?.addEventListener('click',startSandboxRun);if(available)$('#continueRun').onclick=continueRun;
}
function savedMode(){
 let mode=game.mode;
 if(mode==='help')mode=oldMode;
 if(mode==='wardrobe')mode=wardrobeMode;
 if(mode==='paused')mode=panelResumeMode||pauseMode;
 return mode;
}
function saveCurrentRun(){
 if(!hasRun||bossDemo||sandbox.active||game.mode==='title')return true;
 noteCodex();
 const mode=savedMode(),ok=runStore.write(game,{mode,costume:selectedCostume()});lastSaveAt=performance.now();
 if(!ok&&!saveFailed)toast('进度未能保存，请检查设备存储空间；暂时不要退出。');
 saveFailed=!ok;
 if(ok&&(mode==='win'||mode==='dead'&&game.reviveUsed))hasRun=false;
 return ok;
}
function continueRun(){
 const saved=runStore.read();if(saved.status!=='ok'){title();toast('存档无法读取，请尝试重新打开游戏。');return}
 revivePlayer.stop();voice.stop();bossVoice.stop();itemVoice.stop();soundMix.stopTone();bossVoice.reset();itemVoice.reset();
 resetTouchInput();leaveSandbox();releaseArt();game=saved.game;hasRun=true;saveFailed=false;lastSaveAt=performance.now();panelResumeMode=null;setCostume(saved.costume);
 if(!game.codexRunId)game.codexRunId='legacy-'+saved.savedAt.toString(36);
 noteCodex();
 keepGameFullscreen(true);void requestGameFullscreen({mobile:touchPointer.matches});updateUI();last=performance.now();
 if(game.mode==='choice')showChoices('继续选择 · 上次留下的道具',game.choices);
 else if(game.mode==='dead')end(false);
 else {pause();$('#resume').textContent='准备好了，继续冒险 →';overlay.querySelector('.modal p').textContent='进度已恢复，准备好再出发。'}
}
function requestNewRun(){
 const saved=runStore.read();
 if(bossDemo||(!hasRun&&(saved.status==='empty'||saved.storageBlocked))){start();return}
 const previous=game.mode;if(['play','rescue'].includes(previous))pause();
 overlay.innerHTML='<div class="modal confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="confirmNewRunTitle"><div class="mini">START OVER?</div><h2 id="confirmNewRunTitle">重新开始一局？</h2><p>当前存档会被新的一局替换，无法找回。</p><div class="confirm-actions"><button class="primary keep-run" id="cancelNewRun">保留进度，返回</button><button class="danger" id="confirmNewRun">替换存档，重新开始</button></div></div>';
 $('#cancelNewRun').focus({preventScroll:true});
 $('#confirmNewRun').onclick=start;$('#cancelNewRun').onclick=()=>{if(previous==='title')title();else {game.mode=pauseMode;pause()}};
}
function saveAndTitle(){
 if(!saveCurrentRun())return;
 revivePlayer.stop();voice.stop();bossVoice.stop();itemVoice.stop();soundMix.stopTone();resetTouchInput();hasRun=false;game.mode='title';panelResumeMode=null;title();
}
window.naiwaSaveAndPause=()=>{window.dispatchEvent(new Event('blur'));return saveCurrentRun()};
window.addEventListener('pagehide',saveCurrentRun);
// Save synchronously during lifecycle changes, including native Android backgrounding.
window.addEventListener('blur',saveCurrentRun);
document.addEventListener('visibilitychange',()=>{if(document.hidden)saveCurrentRun()});

function start(){revivePlayer.stop();voice.stop();bossVoice.stop();itemVoice.stop();soundMix.stopTone();bossVoice.reset();itemVoice.reset();voice.unlock();bossVoice.unlock();itemVoice.unlock();keepGameFullscreen(true);void requestGameFullscreen({mobile:touchPointer.matches});resetTouchInput();leaveSandbox();releaseArt();game=new Game();game.start();hasRun=true;panelResumeMode=null;last=performance.now();if(bossDemo){game.floor=5;game.generate();game.enter(game.rooms.find(r=>r.exists&&r.type==='boss').id,'top');game.hurt=()=>{};game.p.damage=3}overlay.innerHTML='';keys.clear();mouse.down=false;updateUI();canvas.focus();beep(650,.15);toast(matchMedia('(pointer:coarse), (max-width:780px), (max-width:1100px) and (max-height:600px)').matches?'左手移动；右手十字摇杆四向射击，滑动换向，松手停止。':'方向键大笑；E 互动；B 炸弹；造成伤害充能，Q 大爆笑击退。');saveCurrentRun()}
// 沙盒试玩: a separate free-play run. The saved run stays untouched for 继续游戏.
function syncSandboxChrome(){document.documentElement.toggleAttribute('data-sandbox',sandbox.active);$('#sandboxTools').hidden=!sandbox.active;const item=document.querySelector('[data-menu-action="sandboxTools"]');if(item)item.hidden=!sandbox.active}
function leaveSandbox(){if(!sandbox.active)return;sandbox.active=false;sandbox.speed=1;syncSandboxChrome()}
function startSandboxRun(){revivePlayer.stop();voice.stop();bossVoice.stop();itemVoice.stop();soundMix.stopTone();bossVoice.reset();itemVoice.reset();voice.unlock();bossVoice.unlock();itemVoice.unlock();keepGameFullscreen(true);void requestGameFullscreen({mobile:touchPointer.matches});resetTouchInput();releaseArt();hasRun=false;Object.assign(sandbox,createSandboxState(),{active:true});game=startSandbox(new Game(),sandbox);panelResumeMode=null;last=performance.now();overlay.innerHTML='';keys.clear();mouse.down=false;syncSandboxChrome();updateUI();canvas.focus();beep(650,.15);toast(mobileMedia.matches?'沙盒试玩：点菜单 ☰ 里的“沙盒工具”切换章节、生成敌人、拿放道具。':'沙盒试玩：按 T 打开沙盒工具，切换章节、生成敌人、拿放道具。')}
function sandboxPanelOpen(){return game.mode==='paused'&&!!overlay.querySelector('.sandbox-modal')}
function toggleSandboxPanel(){if(document.body.classList.contains('mobile-panel-open'))return;if(sandboxPanelOpen())resume();else openSandboxPanel()}
function openSandboxPanel(){if(!sandbox.active||document.body.classList.contains('mobile-panel-open'))return;if(game.mode==='paused'&&!sandboxPanelOpen()&&!overlay.querySelector('#pauseSandboxTools'))return;if(['play','rescue'].includes(game.mode)){pauseMode=game.mode;voice.stop();bossVoice.stop();itemVoice.stop();soundMix.stopTone();game.mode='paused'}else if(game.mode!=='paused')return;resetTouchInput();renderSandboxPanel(false);overlay.querySelector('[data-sandbox-tab][aria-selected="true"]')?.focus({preventScroll:true})}
function renderSandboxPanel(keepScroll){const old=overlay.querySelector('.sandbox-body'),top=keepScroll&&old?old.scrollTop:0,focused=document.activeElement?.closest?.('.sandbox-modal')?document.activeElement:null,focusKey=focused&&[focused.dataset.sandbox,focused.dataset.roomId??focused.dataset.value??focused.dataset.key,focused.dataset.sandboxTab].join('|');overlay.innerHTML=sandboxPanelHTML(game,sandbox);const body=overlay.querySelector('.sandbox-body');body.scrollTop=top;
 overlay.querySelectorAll('[data-sandbox-tab]').forEach(b=>b.onclick=()=>{sandbox.tab=b.dataset.sandboxTab;renderSandboxPanel(false);overlay.querySelector('[data-sandbox-tab][aria-selected="true"]')?.focus({preventScroll:true})});
 overlay.querySelectorAll('[data-sandbox]').forEach(b=>b.onclick=()=>{const action=b.dataset.sandbox,value=b.dataset.roomId??b.dataset.key??b.dataset.value,closing=SANDBOX_CLOSING.has(action);
  // Room moves run in play mode, so a treasure room's choice dialog or a boss intro behaves as in a real run.
  if(closing){pauseMode='play';resume()}
  const result=runSandboxAction(game,sandbox,action,value);processEvents();updateUI();if(result.text)toast(result.text);if(!closing)renderSandboxPanel(true)});
 $('#sandboxClose').onclick=resume;$('#sandboxExit').onclick=saveAndTitle;
 if(focusKey)for(const b of overlay.querySelectorAll('.sandbox-modal button'))if([b.dataset.sandbox,b.dataset.roomId??b.dataset.value??b.dataset.key,b.dataset.sandboxTab].join('|')===focusKey){b.focus({preventScroll:true});break}}
$('#sandboxTools').onclick=openSandboxPanel;
function pause(){if(game.mode==='revive'){revivePlayer.pause();return}resetTouchInput();if(['play','rescue'].includes(game.mode)){pauseMode=game.mode;voice.stop();bossVoice.stop();itemVoice.stop();soundMix.stopTone();game.mode='paused';overlay.innerHTML=sandbox.active?`<div class="modal"><div class="mini">SANDBOX · PAUSED</div><h2>沙盒暂停</h2><p>沙盒不保存进度，也不会影响正式存档和最佳记录。</p><button class="primary" id="resume">继续试玩 →</button><button class="secondary" id="pauseSandboxTools">打开沙盒工具</button><button class="secondary" id="pauseCodex">奶蛙图鉴</button><button class="secondary" id="restart">重置沙盒</button><button class="secondary" id="saveExit">退出沙盒，返回封面</button></div>`:`<div class="modal"><div class="mini">TAKE A LITTLE BREATH</div><h2>蛙蛙歇一会儿</h2><p>本机自动保存进度，回来可以继续。</p><button class="primary" id="resume">继续冒险 →</button><button class="secondary" id="pauseCodex">奶蛙图鉴</button><button class="secondary" id="saveExit">保存并返回封面</button><button class="secondary" id="restart">重新开始本局</button></div>`;$('#resume').onclick=resume;$('#pauseCodex').onclick=openCodex;$('#restart').onclick=sandbox.active?startSandboxRun:requestNewRun;$('#saveExit').onclick=saveAndTitle;if(sandbox.active)$('#pauseSandboxTools').onclick=openSandboxPanel;keys.clear();mouse.down=false;saveCurrentRun();}else if(game.mode==='paused')resume()}
function resume(){game.mode=pauseMode;overlay.innerHTML='';if(game.mode==='rescue')showRescue();voice.unlock();bossVoice.unlock();itemVoice.unlock();canvas.focus();last=performance.now()}
function help(){if(['help','revive'].includes(game.mode))return;voice.stop();bossVoice.stop();itemVoice.stop();soundMix.stopTone();resetTouchInput();oldMode=game.mode;game.mode='help';overlay.innerHTML=`<div class="modal help-modal"><div class="mini">A FROG'S FIELD GUIDE</div><h2>池塘生存指南</h2><div class="instructions"><b>存档：</b>每 2 秒自动保存；换房、购买、受伤和切到后台时也会保存。封面点“继续游戏”，准备好后恢复战斗。暂停菜单可保存并返回封面。仅保存在当前设备与当前浏览器中，清除应用数据会丢失；开始新的一局会覆盖旧存档。死亡后若还能复活，返回仍是死亡画面，观看需从头开始。<br><b>移动：</b>WASD；手机在左下方任意位置按住拖动，摇杆会出现在拇指下，松手回到原处。<br><b>攻击：</b>只能向上、下、左、右射击。方向键按住发射；鼠标按住，按所在方位取四向。手机按住右侧十字摇杆的方向持续射击，滑动换向，回到中心或松手停止。<br><b>抢奶跑腿怪：</b>红围巾、高速追击、血量较低，优先处理。<br><b>圆肚怪：</b>已取消盾牌；飞扑怪冲刺前会显示红线。站桩炮台射击更频繁；尖啸音箱轮换错位环射、瞄准扇射、旋转十字，虚线预警后发射。<br><b>蛙跳：</b>空格，短暂无敌，冷却 2 秒。<br><b>地形：</b>货箱可用笑声击碎，有 15% 概率掉补给；蓝纹藏宝石炸开必有补给；裂纹石堆需炸弹；铆钉柱不能破坏；深色坑洞不能步行或蛙跳越过，但音波可以飞过。<br><b>房间布局：</b>普通房间通过货箱、岩石、固定柱和坑洞分割路线与火线。怪物攻击会留下短暂危险区域，Boss 房有专属技能机关。<br><b>特色怪：</b>胀奶团死后延迟溅奶；滑奶仔踩奶加速；指挥怪催拍加速队友；回声铃锁定方向三连射；叉车预警后冲锋；投包裹工砸向落点；缝补工会回血给同伴；发条废偶高速追击，接触立即自爆，可提前击杀或蛙跳躲伤害；狱卒放电网；探照眼发射旋转十字弹幕。<br><b>资源路线：</b>每层增加钥匙补给库与封墙藏室。补给库消耗 1 把钥匙，击败4–6 名守卫后获 2 枚炸弹与 3 金币；在裂墙门口按 B 放炸弹、退开，炸开藏室后须清怪并躲避落物 12 秒，才会揭晓随机奖励：金币、钥匙炸弹、回血补给或道具。接应点的 E 回收台可用 2 钥匙换 1 炸弹，或 2 炸弹换 1 钥匙，也能换金币，每层限量；也可消耗 2 点生命换 3 金币（不能致死、护盾不抵扣）；商店还能花金币补货。资源房均为可选路线，清完有 25% 概率为空，75% 获得补给（隐藏藏室随机）；结果只结算一次。<br><b>地图：</b>电脑按 M 打开或关闭地图，查看时暂停战斗；也可按 Esc 关闭。<br><b>探索：</b>清空小怪，走到门口进入相邻房间。<br><b>自己找隐藏房：</b>优先检查地图上被两三间房围住的空位，真藏室不会紧贴 Boss 房或上锁资源房。清房后观察墙中央的细裂纹与碎墙灰，靠近会有提示；用炸弹验证。每层最多 2 处假裂纹，指向紧贴 Boss 房的空位，炸错只会露出实墙。情报可直接标出真房间，但不是入场要求。<br><b>道具：</b>道具房拿随机道具；挑战房随机获得宝箱或三选一道具。普通房间有 40% 概率无掉落，否则只给一种小补给。钥匙开房间和宝箱，金币购买商店道具。<br><b>金币服务：</b>商店可花 4 金币刷新道具（每层 2 次）、5 金币买一次性护盾、4 金币补满爆笑、3 金币买本层隐藏房间情报（仅标出藏室，仍需炸墙；后三项每层各 1 次）。已有护盾、满充能或隐藏藏室已发现时不会扣钱。<br><b>复活：</b>每局可在死亡后观看 10 秒奶龙大笑，完成后手动领取半血复活（奇数生命上限向上取整），附带 3 秒无敌。后台暂停计时，中途放弃不消耗机会，但重新观看从头开始。<br><b>通关：</b>击败最终双 Boss 后，反复按键或点击大笑，打破牢笼；长按不连发。随后奶豆与豆包团聚。<br><b>资源：</b>E 互动，B 放炸弹（会炸伤自己），Q 即时大爆笑，半径 160、伤害 4，将附近敌人与子弹向外推。实际造成 45 点伤害充满一次（电池降到 30），初始空充能；大爆笑本身不返还充能。<br><b>奶蛙图鉴：</b>正式冒险中遇到的道具、敌人和关末敌人会记进图鉴，换局也保留；封面右上角、暂停菜单和手机菜单都能打开。<br><b>沙盒试玩：</b>封面点“沙盒试玩”自由体验：切换章节、直达任意房间或 Boss、生成本章敌人和训练靶、随意拿放道具、开关无敌与一击必杀，还能显示碰撞范围和调试信息。电脑按 T 打开沙盒工具，手机在菜单 ☰ 里打开。沙盒不保存，也不影响正式存档和最佳记录。</div><button class="primary" id="closeHelp">知道啦</button>${creatorLinks()}</div>`;bindCreatorLinks(overlay);$('#closeHelp').onclick=leaveHelp;keys.clear();mouse.down=false;}
function leaveHelp(){game.mode=oldMode;if(oldMode==='title')title();else if(oldMode==='choice')showChoices('蛙蛙的战利品 · 选择一个',game.choices);else if(oldMode==='paused'){game.mode=pauseMode;pause()}else if(oldMode==='rescue')showRescue();else if(oldMode==='win'||oldMode==='dead')end(oldMode==='win');else overlay.innerHTML='';canvas.focus()}
// 奶蛙图鉴 pauses like the guide and returns to whatever was open before it.
function codexCount(){const p=codexProgress(codex);return `${p.items+p.enemies+p.bosses}/${p.itemsTotal+p.enemiesTotal+p.bossesTotal}`}
function openCodex(){
 if(codexReturn||['help','revive','wardrobe'].includes(game.mode)||document.body.classList.contains('mobile-panel-open'))return;
 voice.stop();bossVoice.stop();itemVoice.stop();soundMix.stopTone();resetTouchInput();noteCodex();
 mergeCodex(codex,readCodex());
 const content=document.createDocumentFragment();
 codexReturn={content,mode:game.mode,oldMode,focus:document.activeElement};
 while(overlay.firstChild)content.append(overlay.firstChild);
 oldMode=game.mode;game.mode='help';renderCodex(false);
 $('#codexClose').focus({preventScroll:true});
}
function closeCodex(){
 if(!codexReturn)return;
 const previous=codexReturn;codexReturn=null;stopCodexArt?.();stopCodexArt=null;
 overlay.replaceChildren(previous.content);game.mode=previous.mode;oldMode=previous.oldMode;
 resetTouchInput();last=performance.now();refreshCodexCount();
 (previous.focus?.isConnected&&previous.focus!==document.body?previous.focus:canvas).focus({preventScroll:true});
}
function renderCodex(keep){
 const top=keep?overlay.querySelector('.codex-list')?.scrollTop||0:0;
 const focus=document.activeElement,focusTab=focus?.dataset.codexTab,focusPick=focus?.dataset.codexPick,focusClose=focus?.id==='codexClose';
 stopCodexArt?.();overlay.innerHTML=codexHTML(codex,codexState);
 overlay.querySelector('.codex-list').scrollTop=top;paintCodexArt(overlay);
 stopCodexArt=whenCodexArt(overlay,()=>paintCodexArt(overlay));
 overlay.querySelectorAll('[data-codex-tab]').forEach(b=>b.onclick=()=>{
  codexState.tab=b.dataset.codexTab;codexState.pick=null;renderCodex(false);
  overlay.querySelector('[data-codex-tab][aria-selected="true"]').focus({preventScroll:true});
 });
 overlay.querySelectorAll('[data-codex-pick]:enabled').forEach(b=>b.onclick=()=>{
  codexState.pick=b.dataset.codexPick;renderCodex(true);
  overlay.querySelector('[data-codex-pick="'+codexState.pick+'"]').focus({preventScroll:true});
 });
 $('#codexClose').onclick=closeCodex;
 if(keep){
  const target=focusPick?overlay.querySelector('[data-codex-pick="'+focusPick+'"]:enabled'):focusTab?overlay.querySelector('[data-codex-tab="'+focusTab+'"]'):null;
  if(target||focusClose)(target||$('#codexClose')).focus({preventScroll:true});
 }
}
function codexKey(e){
 if(e.key==='Escape'){e.preventDefault();if(!e.repeat)closeCodex();return}
 if(e.key!=='Tab')return;
 const fields=overlay.querySelectorAll('button:enabled'),first=fields[0],last=fields[fields.length-1];
 if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
 if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
}
$('#codexOpen').onclick=openCodex;
function showChoices(title,choices){resetTouchInput();if(['shop','start'].includes(game.room.type)){renderPurchaseDialog(overlay,{game,title,choices,onLeave:()=>{game.leaveChoice();saveCurrentRun();overlay.innerHTML='';canvas.focus()},onChoose:success=>{if(success){overlay.innerHTML='';resetTouchInput();canvas.focus()}processEvents()}});return}overlay.innerHTML=`<div class="modal reward-modal" role="dialog" aria-modal="true" aria-labelledby="rewardTitle"><div class="reward-ribbon">免费奖励 · 选一件带走</div><h2 id="rewardTitle">${title}</h2><p>${game.room.type==='start'?'按标价消耗资源，每层兑换次数有限。':'道具效果可以叠加；商店补给购买后立即生效。'}</p><div class="choice-list">${choices.map(i=>`<button class="choice" data-item="${i.id}">${itemIcon(i)}<strong>${i.name}</strong><small>${i.desc}</small></button>`).join('')}</div><button class="secondary" id="leaveChoice">暂时不拿 / 离开</button></div>`;$('#leaveChoice').onclick=()=>{game.leaveChoice();saveCurrentRun();overlay.innerHTML='';canvas.focus()};overlay.querySelectorAll('[data-item]').forEach(b=>b.onclick=()=>{if(game.choose(b.dataset.item)){overlay.innerHTML='';mouse.down=false;keys.clear();canvas.focus();}processEvents();});}
function end(win){saveCurrentRun();revivePlayer.stop();voice.stop();bossVoice.stop();itemVoice.stop();soundMix.stopTone();resetTouchInput();best=Math.max(best,bossDemo||sandbox.active?0:game.kills);if(!sandbox.active)try{localStorage.setItem('naiwa-best',String(best))}catch{}const min=Math.floor(game.elapsed/60),sec=Math.floor(game.elapsed%60).toString().padStart(2,'0');const revive=!win&&!sandbox.active&&canRevive(game),summary=`<dl class="run-summary"><div><dt>赶走小怪</dt><dd>${game.kills}</dd></div><div><dt>收集道具</dt><dd>${game.items.length}</dd></div><div><dt>用时</dt><dd>${min}:${sec}</dd></div><div><dt>最佳记录</dt><dd>${sandbox.active?'沙盒不计':best+' 只'}</dd></div></dl>`,heading=`<div class="mini">${win?'A VERY HAPPY ENDING':'EVERY FROG GETS ANOTHER CHANCE'}</div><h2 id="endTitle">${win?'奶豆，我们回家！':'奶蛙先躺一会儿'}</h2><p>${win?'牛来与美鼠倒下了。豆包抱住奶豆，一家人终于团聚。':'没关系，下一局又是一只好蛙。'}</p>`;
 // The next playable action leads: revive while it is available, otherwise a new run.
 overlay.innerHTML=`<div class="modal end-modal ${win?'rescue-ending':'defeat-modal'}" role="dialog" aria-modal="true" aria-labelledby="endTitle"><div class="end-story">${win?'<canvas id="rescueScene" width="640" height="260" aria-label="一家团聚"></canvas>':frogSVG+heading+summary}</div><div class="end-actions">${win?heading+summary:''}${revive?'<button class="death-revive" id="watchRevive"><span>看奶龙大笑 10 秒 · 半血复活</span><small>每局仅一次 · 看完可复活</small></button>':!win?'<p class="death-revive-note">本局复活机会已使用</p>':''}<button class="${revive?'end-secondary':'primary'}" id="again">${sandbox.active?'再开一局沙盒 →':revive?'放弃复活，再跳一次':'再跳一次 →'}</button>${sandbox.active?'<button class="end-secondary" id="sandboxEndExit">退出沙盒，返回封面</button>':''}${creatorLinks()}</div></div>`;bindCreatorLinks(overlay);$('#again').onclick=sandbox.active?startSandboxRun:start;if($('#sandboxEndExit'))$('#sandboxEndExit').onclick=saveAndTitle;if($('#watchRevive'))$('#watchRevive').onclick=()=>{voice.stop();bossVoice.stop();itemVoice.stop();soundMix.stopTone();resetTouchInput();revivePlayer.open()};beep(win?850:180,.4,'triangle');}
// Pixel hearts match the sprites; a numeric readout replaces long rows of hearts.
const heartPath='M1 0h2v1H1zM6 0h2v1H6zM0 1h4v1H0zM5 1h4v1H5zM0 2h9v2H0zM1 4h7v1H1zM2 5h5v1H2zM3 6h3v1H3zM4 7h1v1H4z';
const heartIcon=full=>`<svg class="heart${full?'':' empty'}" viewBox="0 0 9 8" aria-hidden="true"><path d="${heartPath}"/>${full?'<path class="heart-shine" d="M1 1h2v1H1zM1 2h1v1H1z"/>':''}</svg>`;
let heartsKey='',heartsHp=null;
function renderHearts(p){const el=$('#hearts'),many=p.maxHp>(mobileMedia.matches?6:12),key=`${p.hp}/${p.maxHp}/${many}`;if(key!==heartsKey){el.innerHTML=many?heartIcon(true)+`<span class="heart-count">${p.hp} / ${p.maxHp}</span>`:Array.from({length:p.maxHp},(_,i)=>heartIcon(i<p.hp)).join('');if(heartsHp!==null&&p.hp<heartsHp)el.dataset.hit=el.dataset.hit==='a'?'b':'a';heartsKey=key;heartsHp=p.hp}el.dataset.low=String(p.hp<=2)}
function updateUI(){prepareChapterArt(game.floor);const p=game.p;renderHearts(p);$('#hearts').setAttribute('aria-label',`生命 ${p.hp} / ${p.maxHp}`);$('#floor').textContent=`0${game.floor} / ${CHAPTERS[game.floor-1]}`;const names={start:'豆包的接应点',fight:'追踪线索',treasure:'道具房',shop:'补给商店',vault:'钥匙补给库',cache:'封墙藏室',challenge:'挑战房',boss:BOSS_NAMES[game.floor-1]};$('#room').textContent=(game.room.encounterName||names[game.room.type])+(game.room.layoutName?' / '+game.room.layoutName:'')+' · '+(game.room.clear?'门已打开':'清空小怪后开门');$('#killcount').textContent=String(game.kills).padStart(2,'0');$('#explored').textContent=game.rooms.filter(r=>r.visited).length+' / '+game.rooms.filter(r=>r.exists).length;$('#map').innerHTML=game.rooms.map(r=>'<div class="map-cell '+(!r.exists||!r.seen||(r.hidden&&!r.revealed&&!r.visited)?'fog ':(r.visited?'visited ':'seen ')+'t-'+r.type+' ')+(r.id===game.roomId?'here':'')+'" title="'+(r.seen&&r.exists&&(!r.hidden||r.revealed||r.visited)?(r.encounterName||names[r.type]):'未知')+'">'+(!r.exists||!r.seen||(r.hidden&&!r.revealed&&!r.visited)?'':r.id===game.roomId?'●':r.type==='treasure'?'✧':r.type==='shop'?'¤':r.type==='vault'?'⚿':r.type==='cache'?'✹':r.type==='boss'?'♛':r.type==='challenge'?'!':'·')+'</div>').join('');updateMiniMap();updateStats(game);$('#itemcount').textContent=game.items.length+' 件';$('#inventory').innerHTML=game.items.length?game.items.map(id=>{const i=ITEMS.find(i=>i.id===id);return `<div class="item-row"><div class="item-icon">${itemIcon(i)}</div><div><strong>${i.name}</strong><small>${i.short}</small></div></div>`}).join(''):'<div class="empty-bag">✧<p>现在还是一只普通奶蛙。<br>去找到你的第一件怪东西。</p></div>';}
function playLaugh(options){return playPlayerLaugh({voice,bossVoice,itemVoice},options)}
function pressRescue(){if(game.rescueLaugh()){playLaugh();processEvents()}}
function showRescue(){clearTimeout(toastTimer);$('#toast').classList.remove('show');resetTouchInput();renderRescueUI(overlay,game,{onPress:pressRescue,onPause:pause,onSound:toggleSound,sound});canvas.focus()}
function toggleSound(){sound=!sound;setGameSound(sound,{voice,bossVoice,itemVoice,soundMix},game.mode==='revive');try{localStorage.setItem('naiwa-sound',String(sound))}catch{}syncSound()}
function syncSound(){for(const id of ['sound','rescueSound']){const b=$('#'+id);if(b)b.textContent='声音 '+(sound?'开':'关')}}
function processEvents(){let saveNeeded=false;soundMix.beginFrame();const changedRoom=syncRoomVoices(game.room),itemCues=[];for(const e of game.events.splice(0)){if(e.type==='clear'||(e.type==='room'&&e.room))observeCodex(e.room,[]);if(e.type==='choice')observeCodex(game.room,e.choices);if(['room','item','hurt','shield','heal','clear','end','rescue','choice'].includes(e.type))saveNeeded=true;if(e.type==='bossVoice'&&game.mode==='play'){requestBossCue({voice,bossVoice,itemVoice},e)}if(e.type==='itemVoice'&&game.mode==='play')itemCues.push(e.key);if(e.type==='sandyStart'){shake=2;beep(85,.35,'sine',.025,3)}if(e.type==='sandyEnd')beep(260,.22,'triangle',.025);if(e.type==='gojoSplit')beep(760,.15,'triangle',.02);if(e.type==='gojoFuse')beep(390,.16,'sine',.02,2);if(e.type==='gojoBlast'){shake=4;beep(90,.2,'triangle',.025,3)}if(e.type==='room'&&changedRoom)itemCues.length=0;if(e.type==='wardrobe')wardrobe.open();if(e.type==='rescue')showRescue();if(e.type==='cageBreak')playLaugh({long:true});if(e.type==='choice')showChoices(e.title,e.choices);if(e.type==='end')end(e.win);if(e.type==='toast')toast(e.text);if(e.type==='item'||e.type==='choice')codexCheckedAt=0;if(e.type==='item'){if(e.id==='phoebe')itemCues.push('phoebe');if(e.id==='quietbadge')itemCues.push('quiet');const i=ITEMS.find(i=>i.id===e.id);toast(i.name+' · '+i.short);beep(900,.2,'triangle',.025,3);$('#frog-note').textContent='“'+i.name+'？有点怪，再捡一个！”'}if(e.type==='hurt'){game.heroHurtUntil=game.elapsed+.24;shake=9;beep(120,.18,'sawtooth',.025,5)}if(e.type==='shoot'){game.heroLaughUntil=game.elapsed+.22;beep(520,.045)}if(e.type==='kill')beep(240,.08,'triangle');if(e.type==='clear'&&game.mode!=='rescue'){toast('房间清空！门开了，继续探索。');beep(760,.15,'triangle',.025,3)}if(e.type==='dash')beep(360,.12,'triangle',.025,2);if(e.type==='laugh'){playLaugh();game.heroLaughUntil=game.elapsed+.5;beep(150,.25,'square',.012)}if(e.type==='heal')beep(1000,.18,'sine',.025,4);if(e.type!=='shoot')updateUI();}if(game.mode==='play')itemVoice.requestMany(itemCues);soundMix.endFrame();if(saveNeeded)saveCurrentRun();}
function ellipse(x,y,rx,ry,color,stroke=null,lw=2){ctx.beginPath();ctx.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();if(stroke){ctx.lineWidth=lw;ctx.strokeStyle=stroke;ctx.stroke()}}
function line(points,color,width=2){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.lineWidth=width;ctx.lineJoin='round';ctx.lineCap='round';ctx.strokeStyle=color;ctx.stroke()}
function roundRect(x,y,w,h,r,color,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=color;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke()}}
function frog(x,y,size,t,boss=false){ctx.save();ctx.translate(x,y);ctx.scale(size,size);const bounce=Math.sin(t*8)*1.5;ellipse(0,28,30,8,'#24433335');ctx.translate(0,bounce);const body=boss?'#d9bd67':'#efd66e',edge='#485333';ellipse(-25,21,13,8,'#7f8b50',edge);ellipse(25,21,13,8,'#7f8b50',edge);ellipse(-27,6,8,14,body,edge);ellipse(27,6,8,14,body,edge);ellipse(0,5,29,29,body,edge,2.2);ellipse(0,16,20,14,'#f6e4a1');ellipse(-16,-18,16,18,body,edge,2.2);ellipse(16,-18,16,18,body,edge,2.2);ellipse(-16,-18,12,13,'#bdcf7c');ellipse(16,-18,12,13,'#bdcf7c');ellipse(-14,-17,4,7,'#2c4230');ellipse(14,-17,4,7,'#2c4230');ellipse(-15,-19,1.3,2,'#fffbe0');ellipse(13,-19,1.3,2,'#fffbe0');ctx.beginPath();ctx.moveTo(-20,2);ctx.quadraticCurveTo(0,14,20,2);ctx.quadraticCurveTo(0,39,-20,2);ctx.fillStyle='#3c4930';ctx.fill();ctx.beginPath();ctx.moveTo(-15,7);ctx.quadraticCurveTo(0,14,15,7);ctx.lineWidth=4;ctx.strokeStyle='#fff2c8';ctx.stroke();ellipse(0,21,8,3,'#cb8f68');if(boss||game.has('crown')&&size<1.5){ctx.beginPath();ctx.moveTo(-15,-34);ctx.lineTo(-20,-52);ctx.lineTo(-4,-44);ctx.lineTo(3,-58);ctx.lineTo(11,-42);ctx.lineTo(22,-48);ctx.lineTo(17,-33);ctx.closePath();ctx.fillStyle='#dfab4e';ctx.fill();ctx.strokeStyle=edge;ctx.stroke();ellipse(4,-40,3,3,'#b86050')}ctx.restore();}
function lily(x,y,size=1,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.scale(size,size);ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,20,.15,Math.PI*2-.35);ctx.closePath();ctx.fillStyle='#557c5b';ctx.fill();line([[0,0],[-15,-10]],'#6f9268',1);line([[0,0],[-16,8]],'#6f9268',1);ctx.restore()}
function roomDraw(t){const r=game.room;drawPixelFloor(ctx,r,game.floor);
 const d=game.doors();for(const side of ['left','right','top','bottom']){if(!d[side])continue;ctx.save();ctx.translate(side==='left'?35:side==='right'?925:480,side==='top'?35:side==='bottom'?565:300);if(side==='left'||side==='right')ctx.rotate(Math.PI/2);roundRect(-49,-25,98,50,10,'#374d37','#60754e');if(r.clear){roundRect(-37,-27,74,54,5,'#d4d7aa');line([[-30,-15],[30,-15]],'#a9b381',2);line([[-30,0],[30,0]],'#a9b381',2);line([[-30,15],[30,15]],'#a9b381',2);ellipse(0,0,4,4,'#ecedc3')}else{roundRect(-37,-18,74,36,3,'#7b8260');for(let i=-24;i<=24;i+=16)line([[i,-17],[i,17]],'#4e6547',5);ellipse(0,0,8,9,'#d1bd71','#5f6545');}ctx.restore()}
 drawTerrain(ctx,r,game.floor);drawRoomWardrobe(ctx,game);
 if(r.type==='start'){ctx.textAlign='center';ctx.fillStyle='#617455';ctx.font='600 17px system-ui';ctx.fillText('豆 包 接 应 点',480,190);ctx.font='12px system-ui';ctx.fillText('E 回收资源 · 去门口开始冒险',480,410);lily(480,300,2,.13)}
 if(r.type==='treasure'){ellipse(480,300,68,30,'#9aa977');lily(480,300,2.3);ctx.textAlign='center';ctx.font='30px serif';ctx.fillStyle='#eee6ad';ctx.fillText('✧',480,310)}
 if(game.pickup){const q=game.pickup;if(q.type==='heart'){ellipse(q.x,q.y+16,15,5,'#50674425');ctx.font='bold 31px sans-serif';ctx.textAlign='center';ctx.fillStyle='#ec9984';ctx.strokeStyle='#af6e62';ctx.lineWidth=2;ctx.strokeText('♥',q.x,q.y+7+Math.sin(t*4)*4);ctx.fillText('♥',q.x,q.y+7+Math.sin(t*4)*4)}else{ellipse(q.x,q.y,64+Math.sin(t*3)*3,35,'#729b78');lily(q.x,q.y,2.4);ctx.fillStyle='#f0edb6';ctx.font='bold 18px sans-serif';ctx.textAlign='center';ctx.fillText('↓ 下一层',q.x,q.y+5)}}
}
function enemy(e,t){if(e.dead&&t-(e.deadAt??0)>.65)return;ctx.save();if(e.hit>0)ctx.globalAlpha=.65;drawPixelEnemy(ctx,e,t);if(!e.dead&&e.echoUntil>game.elapsed){pixelRing(ctx,e.x-27,enemyIndicatorY(e)-9,5,'#294d79',3);pixelRing(ctx,e.x-27,enemyIndicatorY(e)-9,8,'#86cdec',2)}if(!e.dead&&e.poison>0){ctx.fillStyle='#b8e877';ctx.fillRect(e.x-3,enemyIndicatorY(e)-8,6,6)}if(!e.dead&&e.type!=='boss'&&e.hp<e.maxHp){ctx.fillStyle='#303a42';ctx.fillRect(e.x-18,enemyIndicatorY(e),36,5);ctx.fillStyle='#f5cb89';ctx.fillRect(e.x-17,enemyIndicatorY(e)+1,34*Math.max(0,e.hp/e.maxHp),3)}ctx.restore()}
function draw(t){labels=[];ctx.save();if(shake>0){ctx.translate(Math.sin(t*70)*shake,Math.cos(t*85)*shake);shake*=.87;if(shake<.2)shake=0}roomDraw(t);drawCampaign(ctx,game,t);for(const e of game.room.enemies)if(!e.dead&&e.starMark>0){ctx.fillStyle='#f5d877';ctx.font='bold 18px system-ui';ctx.textAlign='center';ctx.fillText('☆',e.x,enemyIndicatorY(e)-7)}for(const b of game.bullets){drawPixelShot(ctx,b,false)}
 for(const e of game.room.enemies||[])enemy(e,t);const p=game.p;drawChrono(ctx,game);if(p.dash>0){for(let i=1;i<4;i++){ctx.globalAlpha=.16/i;drawHero(ctx,game,p.x-p.dx*i*19,p.y-p.dy*i*19,1,true)}ctx.globalAlpha=1}if(sandyActive(game)||p.inv<=0||Math.floor(t*14)%2===0){if(!drawHero(ctx,game,p.x,p.y))frog(p.x,p.y,1,t);if(p.shield){pixelRing(ctx,p.x,p.y,44,'#bde8cb',3);for(let i=0;i<4;i++){const a=t*1.5+i*Math.PI/2;ctx.fillStyle='#fff1b1';ctx.fillRect(p.x+Math.cos(a)*44-3,p.y+Math.sin(a)*44-3,6,6)}}if(game.has('tadpole')){const px=p.x-37,py=p.y+25+Math.sin(t*5)*5;line([[px,py],[px-15,py+8],[px-25,py+Math.sin(t*10)*8]],'#4a7264',5);ellipse(px,py,10,12,'#749e88','#4e7765');ellipse(px+3,py-3,3,4,'#e8efc7')}}
 drawItemReadiness(ctx,game);drawLaughReady(ctx,game,reducedMotion.matches);for(const e of game.effects)drawPixelEffect(ctx,e);for(const v of game.particles){ctx.globalAlpha=Math.min(1,v.life*3);ctx.fillStyle=v.color;ctx.fillRect(Math.round(v.x),Math.round(v.y),Math.max(2,Math.round(v.r)),Math.max(2,Math.round(v.r)))}ctx.globalAlpha=1;for(const b of game.enemyBullets){drawPixelShot(ctx,b,true)}
 if(mouse.down&&game.mode==='play'){ctx.strokeStyle='#f5f5d7aa';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(mouse.x,mouse.y,9,0,Math.PI*2);ctx.stroke();line([[mouse.x-14,mouse.y],[mouse.x-6,mouse.y]],'#f5f5d7aa');line([[mouse.x+6,mouse.y],[mouse.x+14,mouse.y]],'#f5f5d7aa')}ctx.restore();const bosses=game.room.enemies?.filter(e=>e.type==='boss'&&!e.dead)||[];const boss=bosses[0];$('#bossbar').hidden=!boss;if(boss){$('#bossbar span').textContent=BOSS_NAMES[game.floor-1];$('#bossbar i').style.width=Math.max(0,bosses.reduce((s,e)=>s+e.hp,0)/game.room.enemies.filter(e=>e.type==='boss').reduce((s,e)=>s+e.maxHp,0)*100)+'%'}$('#dashStatus').textContent=p.dashCD>0?`蛙跳冷却 · ${p.dashCD.toFixed(1)}s`:'空格 · 蛙跳就绪';}
function frame(now){if(now>last)fps+=(Math.min(240,1000/(now-last))-fps)*.08;const dt=Math.max(0,Math.min((now-last)/1000||.016,.04));last=now;const mx=(keys.has('d')?1:0)-(keys.has('a')?1:0)+move.x,my=(keys.has('s')?1:0)-(keys.has('w')?1:0)+move.y;let ax=(keys.has('arrowright')?1:0)-(keys.has('arrowleft')?1:0),ay=(keys.has('arrowdown')?1:0)-(keys.has('arrowup')?1:0),fire=!!(ax||ay);if(mouse.down&&!fire){ax=mouse.x-game.p.x;ay=mouse.y-game.p.y;fire=true}const attack=mobileAttack({held:touchFire,aim:touchAim,playing:game.mode==='play'}),actions=touchActions.take();if(!fire&&attack.fire){ax=attack.ax;ay=attack.ay;fire=true}const direction=cardinalAim(ax,ay);ax=direction.x;ay=direction.y;fire=fire&&!!(ax||ay);const wasDash=game.p.dash>0,oldX=game.p.x,oldY=game.p.y;game.update(dt,{mx,my,ax,ay,fire,auto:false,dash:keys.has(' ')||actions.dash,bomb:keys.has('b')||actions.bomb,use:keys.has('e')||actions.use,active:keys.has('q')||actions.active});game.heroMoving=game.mode==='play'&&Math.hypot(game.p.x-oldX,game.p.y-oldY)>.1;if(wasDash&&game.p.dash<=0)game.heroLandUntil=game.elapsed+.12;processEvents();bossVoice.update(game.mode==='play');itemVoice.update(game.mode==='play');updateStats(game);updateLaughReady(game,dt);updateTouchStatus();$('#resources').textContent='金币 '+game.coins+'　钥匙 '+game.keys+'　炸弹 '+game.bombs+'　爆笑 '+Math.floor(game.activeCharge)+'/'+game.activeCost();draw(game.elapsed);if(sandbox.active)drawSandboxOverlay(ctx,game,sandbox,fps);screen.clearRect(0,0,W,H);screen.drawImage(world,0,0,W,H);drawLabels();updateRescueUI(overlay,game);revivePlayer.update();if(hasRun&&now-lastSaveAt>=2000)saveCurrentRun();if(now-codexCheckedAt>=500){codexCheckedAt=now;noteCodex()}requestAnimationFrame(frame)}
window.addEventListener('keydown',e=>{if(codexReturn){codexKey(e);return}const k=e.key.toLowerCase();if(k==='t'&&sandbox.active&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.isComposing){e.preventDefault();if(!e.repeat)toggleSandboxPanel();return}if(game.mode==='rescue'&&(document.activeElement?.id==='rescueLaugh'||!['BUTTON','INPUT','TEXTAREA'].includes(document.activeElement?.tagName))&&k!=='p'&&k!=='escape'){if(e.repeat){if([' ','enter'].includes(k))e.preventDefault();return}if(isRescueKey(e)){e.preventDefault();pressRescue();return}}if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k)&&!['BUTTON','INPUT','TEXTAREA'].includes(document.activeElement?.tagName))e.preventDefault();if((k==='p'||k==='escape')&&!e.repeat)pause();keys.add(k)});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{voice.stop();bossVoice.stop();itemVoice.stop();soundMix.stopTone();resetTouchInput();if(['play','rescue'].includes(game.mode))pause()});document.addEventListener('visibilitychange',()=>{if(document.hidden){voice.stop();bossVoice.stop();itemVoice.stop();soundMix.stopTone();resetTouchInput();if(['play','rescue'].includes(game.mode))pause()}});canvas.addEventListener('pointermove',pointMouseAim);
canvas.addEventListener('pointerdown',beginMouseAim);
canvas.addEventListener('pointerup',endMouseAim);
canvas.addEventListener('pointercancel',endMouseAim);
// Fingers can steer over the room. A mouse or pen over those same pixels still aims at the room.
$('#stick').addEventListener('pointerdown',e=>{
 if(e.button!==0||e.pointerType==='touch'||game.mode!=='play')return;
 const r=canvas.getBoundingClientRect();
 if(e.clientX<r.left||e.clientX>=r.right||e.clientY<r.top||e.clientY>=r.bottom)return;
 e.stopImmediatePropagation();beginMouseAim(e);
},true);
function pointMouseAim(e){
 if(e.pointerType==='touch')return;
 const r=virtualRect(canvas),p=toVirtualPoint(e.clientX,e.clientY);
 mouse.x=(p.x-r.left)/r.width*W;mouse.y=(p.y-r.top)/r.height*H;
}
function beginMouseAim(e){
 if(e.button!==0||e.pointerType==='touch'||game.mode!=='play')return;
 e.preventDefault();pointMouseAim(e);mouse.down=true;canvas.focus();canvas.setPointerCapture(e.pointerId);
}
function endMouseAim(e){if(e.pointerType!=='touch')mouse.down=false}
canvas.addEventListener('contextmenu',e=>e.preventDefault());$('#pause').onclick=pause;$('#help').onclick=help;$('#sound').onclick=toggleSound;syncSound();
function resetTouchInput(){touchResets.forEach(reset=>reset());touchActions.clear();keys.clear();mouse.down=false;touchFire=false;touchAim={x:0,y:0};move={x:0,y:0}}
touchResets.push(bindStickControl($('#stick'),vector=>{move=vector;$('#stick span').style.transform=`translate(${vector.x*32}px,${vector.y*32}px)`}));
touchResets.push(bindAttackStick($('#touchFire'),(vector,held)=>{touchFire=held;touchAim=vector;$('#touchFire').style.setProperty('--aim-x',`${vector.x*12}px`);$('#touchFire').style.setProperty('--aim-y',`${vector.y*12}px`);$('#touchFire').dataset.direction=vector.x>0?'right':vector.x<0?'left':vector.y>0?'down':vector.y<0?'up':'none'}));
for(const [id,action] of [['touchDash','dash'],['touchBomb','bomb'],['touchUse','use'],['touchActive','active']]){
 const button=$('#'+id),press=()=>{if(button.getAttribute('aria-disabled')==='true')return;touchActions.press(action,game.mode==='play')};
 touchResets.push(bindHoldControl(button,press,()=>{}));
 // Keyboard and assistive activation still work, without duplicating pointer clicks.
 button.addEventListener('click',e=>{if(e.detail===0)press()});
}
function updateMiniMap(){const mini=$('#mobileMiniMap');if(!mini)return;mini.innerHTML=game.rooms.map(r=>{const hidden=!r.exists||!r.seen||(r.hidden&&!r.revealed&&!r.visited);return `<i class="${hidden?'fog':r.id===game.roomId?'here':r.type==='boss'?'boss':r.type==='treasure'?'treasure':''}"></i>`}).join('')}
function updateTouchStatus(){
 for(const key of ['coins','keys','bombs']){const el=document.querySelector(`[data-resource="${key}"]`);if(el.textContent!==String(game[key]))el.textContent=String(game[key])}
 const playing=game.mode==='play',p=game.p,cost=game.activeCost();
 const status=(id,text,ready)=>{const b=$('#'+id),label=b.querySelector('small');if(label.textContent!==text)label.textContent=text;b.setAttribute('aria-disabled',String(!playing||!ready));b.dataset.ready=String(ready)};
 status('touchDash',p.dashCD>0?`${p.dashCD.toFixed(1)}秒`:'就绪',p.dashCD<=0);
 status('touchActive',game.activeCharge>=cost?'就绪 · 释放':`${Math.floor(game.activeCharge)}/${cost}`,game.activeCharge>=cost);
 $('#touchActive').dataset.readyFlash=String(playing&&laughReadyState(game).flash>0);
 $('#touchActive').dataset.playing=String(playing);
 status('touchBomb',`${game.bombs} 枚`,game.bombs>0);
 const nearby=Math.hypot(p.x-480,p.y-260)<145,place=canUseRoomWardrobe(game)?'更换时装':nearby&&game.room.type==='start'?'资源回收':nearby&&game.room.type==='shop'?'补给商店':game.room.pendingItem?'拿取道具':game.room.loot.some(l=>l.type==='chest'&&Math.hypot(l.x-p.x,l.y-p.y)<70)?'开启宝箱':null;status('touchUse',place||'靠近可互动',!!place);
 $('#touchDash').style.setProperty('--cooldown',`${Math.max(0,Math.min(100,(1-p.dashCD/(game.has('feet')?1.3:2))*100))}%`);
 $('#touchActive').style.setProperty('--charge',`${Math.min(100,game.activeCharge/cost*100)}%`);
}
canvas.addEventListener('lostpointercapture',()=>mouse.down=false);
mobileMedia.addEventListener('change',resetTouchInput);
// Phone runs stay fullscreen: a tap after leaving it asks again (fullscreen.js).
installFullscreenKeeper({isMobile:()=>touchPointer.matches});
setupMobileUI({canOpenMap:()=>game.mode==='play',suspend:()=>{if(!['play','rescue'].includes(game.mode))return false;panelResumeMode=game.mode;game.mode='paused';voice.stop();bossVoice.stop();itemVoice.stop();soundMix.stopTone();return true},resume:()=>{if(game.mode==='paused'&&panelResumeMode){game.mode=panelResumeMode;panelResumeMode=null;last=performance.now()}},resetInput:resetTouchInput,pause:()=>{if(['play','rescue'].includes(game.mode))pause()},notify:toast});

setTimeout(releaseArt,4000);
title();updateUI();requestAnimationFrame(frame);

export {game,start,processEvents};
