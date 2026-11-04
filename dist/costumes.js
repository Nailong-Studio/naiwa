export const COSTUMES=Object.freeze([
 {id:'original',name:'经典奶蛙',detail:'原汁原味，挺着肚子去冒险。',file:'naiwa-pixel-v2.png',accent:'#e8c468'},
 {id:'kobe',name:'科比版奶蛙',detail:'24 号紫金球衣 · 篮球鞋',file:'costume-kobe-v1.png',accent:'#b399dc'},
 {id:'kun',name:'蔡徐坤版奶蛙',detail:'中分发型 · 黑衫与灰色背带裤',file:'costume-kun-v1.png',accent:'#aeb9c4'},
 {id:'david',name:'大卫版奶蛙',detail:'剃鬓刺发 · 夜之城黄夹克',file:'costume-david-v1.png',accent:'#89dfce'},
 {id:'phoebe',name:'菲比版奶蛙',detail:'金色长发 · 白帽与蓝白礼服',file:'costume-phoebe-v1.png',accent:'#bcb3ee'},
 {id:'stink',name:'臭企鹅版奶蛙',detail:'灰紫短发 · 高松灯企鹅服',file:'costume-stink-v1.png',accent:'#b7a7c4'},
 {id:'sweet',name:'香企鹅版奶蛙',detail:'黑色齐刘海 · 管理员企鹅帽',file:'costume-sweet-v4.png',accent:'#a3c5cf'},
 {id:'deepseek',name:'DeepSeek 娘版奶蛙',detail:'蓝色长发 · 鲸鱼女仆裙',file:'costume-deepseek-v2.png',accent:'#91b8ed'},
 {id:'gojo',name:'五条悟版奶蛙',detail:'白色刺发 · 墨镜与高领制服',file:'costume-gojo-v1.png',accent:'#b8b4e0'},
 {id:'belial',name:'贝利亚版奶蛙',detail:'贝利亚尖顶头型 · 狭长发光眼与黑红圆肚',file:'costume-belial-v3.png',accent:'#cf697c'},
 {id:'sponge',name:'海绵宝宝版奶蛙',detail:'白衬衫红领带 · 方裤与条纹袜',file:'costume-sponge-v1.png',accent:'#f2cd67'},
 {id:'patrick',name:'派大星版奶蛙',detail:'粉色圆尖头 · 绿底紫花短裤',file:'costume-patrick-v3.png',accent:'#eda4b6'},
 {id:'squid',name:'章鱼哥版奶蛙',detail:'青绿大鼻子 · 棕色翻领衫',file:'costume-squid-v3.png',accent:'#9bcbc2'},
 {id:'cat',name:'呆猫版奶蛙',detail:'蓝色猫耳套装 · 奶油肚兜',file:'costume-cat-v1.png',accent:'#8dace3'},
 {id:'isaac',name:'以撒版奶蛙',detail:'以撒光头与黑眼 · 蓝色泪痕 · 红色 D6',file:'costume-isaac-v4.png',accent:'#efc4bc'},
 {id:'bluebaby',name:'小蓝人版奶蛙',detail:'蓝色皮肤 · 叉形眼睛 · 保留奶蛙圆肚',file:'costume-bluebaby-v1.png',accent:'#8cbde3'},
 {id:'keeper',name:'店主版奶蛙',detail:'灰色圆头 · 黑色眼洞与嘴洞 · 无翅膀',file:'costume-keeper-v1.png',accent:'#b4b6bf'},
 {id:'anon',name:'千早爱音版奶蛙',detail:'粉色长发 · 羽丘校服',file:'costume-anon-v1.png',accent:'#efb4cf'},
 {id:'sakiko',name:'丰川祥子版奶蛙',detail:'蓝发编辫与黑缎带 · 羽丘校服',file:'costume-sakiko-v1.png',accent:'#aab9e7'},
 {id:'tempura',name:'天苏罗版奶蛙',detail:'浅棕短发 · 金黄虾套与虾尾鞋',file:'costume-tempura-v1.png',accent:'#e8c37c'},
 {id:'pink',name:'奶粉',detail:'奶粉粉色 · 保留经典奶蛙轮廓',file:'costume-pink-v1.png',accent:'#eeb7ca'},
 {id:'bikini',name:'比基尼奶蛙',detail:'红白波点泳装 · 挺着肚子去海边',file:'costume-bikini-v1.png',accent:'#ef9e9a'}
]);
export const COSTUME_KEY='naiwa-costume-v1';
export function costumeById(id){return COSTUMES.find(c=>c.id===id)||COSTUMES[0]}
export function readCostume(storage){try{return costumeById(storage?.getItem(COSTUME_KEY)).id}catch{return 'original'}}
let selected=readCostume(typeof localStorage==='undefined'?null:localStorage);
export const selectedCostume=()=>selected;
export function setCostume(id,storage=typeof localStorage==='undefined'?null:localStorage){
 selected=costumeById(id).id;try{storage?.setItem(COSTUME_KEY,selected)}catch{}return selected;
}
const sheets=new Map(),pending=new Map();
export function costumeImage(id){
 const def=costumeById(id);if(!sheets.has(def.id)&&typeof Image!=='undefined'){
  const im=new Image();sheets.set(def.id,im);im.src=new URL('./assets/'+def.file,import.meta.url).href;
 }return sheets.get(def.id)||null;
}
export function loadCostume(id){
 const def=costumeById(id),im=costumeImage(def.id);if(!im)return Promise.reject(new Error('Images unavailable'));
 if(im.complete&&im.naturalWidth)return Promise.resolve(im);
 if(pending.has(def.id))return pending.get(def.id);
 const wait=new Promise((resolve,reject)=>{
  const done=()=>{cleanup();resolve(im)},fail=()=>{cleanup();sheets.delete(def.id);reject(new Error('Costume failed to load'))};
  const cleanup=()=>{clearTimeout(timer);im.removeEventListener('load',done);im.removeEventListener('error',fail);pending.delete(def.id)};
  const timer=setTimeout(fail,15000);im.addEventListener('load',done,{once:true});im.addEventListener('error',fail,{once:true});
  if(im.complete&&!im.naturalWidth)queueMicrotask(fail);
 });pending.set(def.id,wait);return wait;
}

