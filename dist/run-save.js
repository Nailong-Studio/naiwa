import {Game,ITEMS} from './campaign.js';
import {bindFloorEconomy} from './floor-economy.js';

export const RUN_SAVE_KEY='naiwa-run-v1';
const VERSION=1,MAX_BYTES=4_000_000,MAX_NODES=60000;
const modes=new Set(['play','choice','rescue','dead']);
const unsafe=new Set(['__proto__','constructor','prototype']);
const itemIds=new Set(ITEMS.map(i=>i.id));
const typed=new Map([Int8Array,Uint8Array,Uint8ClampedArray,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array].map(C=>[C.name,C]));

// A run is a graph: bullets remember enemy objects, attacks remember their owner,
// and shop shelves share the floor ledger. JSON alone loses these identities,
// Sets/Maps, and Infinity (permanent wires).
function encode(root){
 const seen=new Map(),nodes=[];
 function value(v){
  if(v===undefined)return {special:'undefined'};
  if(typeof v==='number'&&!Number.isFinite(v))return {special:String(v)};
  if(v===null||typeof v!=='object'){
   if(!['string','number','boolean'].includes(typeof v)&&v!==null)throw Error('Unsupported saved value');
   return v;
  }
  if(seen.has(v))return {ref:seen.get(v)};
  if(nodes.length>=MAX_NODES)throw Error('Run too large');
  const id=nodes.length;seen.set(v,id);nodes.push(null);
  if(ArrayBuffer.isView(v)&&typed.has(v.constructor.name))nodes[id]={type:v.constructor.name,data:Array.from(v)};
  else if(v instanceof Set)nodes[id]={type:'set',data:[...v].map(value)};
  else if(v instanceof Map)nodes[id]={type:'map',data:[...v].map(([k,x])=>[value(k),value(x)])};
  else if(Array.isArray(v))nodes[id]={type:'array',data:v.map(value)};
  else nodes[id]={type:'object',data:Object.entries(v).filter(([k,x])=>!unsafe.has(k)&&typeof x!=='function').map(([k,x])=>[k,value(x)])};
  return {ref:id};
 }
 return {root:value(root),nodes};
}
function decode(graph){
 if(!graph||!Array.isArray(graph.nodes)||graph.nodes.length>MAX_NODES)throw Error('Invalid graph');
 const objects=graph.nodes.map(n=>{
  if(!n||!Array.isArray(n.data))throw Error('Invalid node');
  if(typed.has(n.type)){if(!n.data.every(Number.isFinite))throw Error('Invalid typed array');return new (typed.get(n.type))(n.data)}
  switch(n.type){case 'object':return {};case 'array':return [];case 'set':return new Set();case 'map':return new Map();default:throw Error('Unknown node');}
 });
 function value(v){
  if(v===null||['string','boolean','number'].includes(typeof v))return v;
  if(!v||typeof v!=='object')throw Error('Invalid value');
  if(Number.isInteger(v.ref)&&v.ref>=0&&v.ref<objects.length)return objects[v.ref];
  if(v.special==='Infinity')return Infinity;
  if(v.special==='-Infinity')return -Infinity;
  if(v.special==='NaN')return NaN;
  if(v.special==='undefined')return undefined;
  throw Error('Invalid reference');
 }
 graph.nodes.forEach((n,i)=>{
  const o=objects[i];
  if(typed.has(n.type))return;
  if(n.type==='array')for(const x of n.data)o.push(value(x));
  else if(n.type==='set')for(const x of n.data)o.add(value(x));
  else for(const entry of n.data){
   if(!Array.isArray(entry)||entry.length!==2)throw Error('Invalid entry');
   const [k,v]=entry;
   if(n.type==='map')o.set(value(k),value(v));
   else {if(typeof k!=='string'||unsafe.has(k))throw Error('Invalid property');o[k]=value(v);}
  }
 });
 return value(graph.root);
}
function validate(s){
 if(!s||!modes.has(s.mode)||!Number.isInteger(s.floor)||s.floor<1||s.floor>5||
  !Array.isArray(s.rooms)||s.rooms.length!==25||!Number.isInteger(s.roomId)||!s.rooms[s.roomId]?.exists||
  !Array.isArray(s.items)||!s.items.every(id=>itemIds.has(id))||!s.p)throw Error('Invalid run');
 for(const k of ['x','y','hp','maxHp','damage','rate','speed','r'])if(!Number.isFinite(s.p[k]))throw Error('Invalid player');
 for(const k of ['elapsed','coins','keys','bombs','activeCharge','kills'])if(!Number.isFinite(s[k])||s[k]<0)throw Error('Invalid counters');
 if(s.p.maxHp<1||s.p.hp>s.p.maxHp||s.p.damage<=0||s.p.rate<=0||s.p.speed<=0||s.p.hp<0||
  (s.mode==='dead'?(s.p.hp!==0||s.reviveUsed):s.p.hp<=0))throw Error('Invalid health');
 for(const k of ['bullets','enemyBullets','effects','particles','explosives'])if(!Array.isArray(s[k]))throw Error('Invalid combat state');
 for(const b of s.bullets)if(!(b.hits instanceof Set))throw Error('Invalid hit history');
 if(s.mode==='choice'&&!Array.isArray(s.choices))throw Error('Invalid choice');
 if(s.mode==='rescue'&&!['caged','breaking','reunion'].includes(s.rescue?.phase))throw Error('Invalid rescue');
 for(const [i,r] of s.rooms.entries()){
  if(r.id!==i||!Array.isArray(r.obstacles)||!Array.isArray(r.loot)||!(r.enemies===null||Array.isArray(r.enemies)))throw Error('Invalid room');
  for(const e of r.enemies||[])if(!Number.isFinite(e.hp)||!Number.isFinite(e.x)||!Number.isFinite(e.y))throw Error('Invalid enemy');
 }
 if(!Array.isArray(s.rooms[s.roomId].enemies))throw Error('Unentered room');
}

export function serializeRun(game,{mode=game.mode,costume='original',now=Date.now()}={}){
 if(mode==='revive')mode='dead';
 if(mode==='win'||(mode==='dead'&&game.reviveUsed))return null;
 if(!modes.has(mode))throw Error('Cannot save this screen');
 const state={...game,mode,events:[],reviveWatch:null};
 delete state.random;
 validate(state);
 const text=JSON.stringify({version:VERSION,savedAt:now,costume,graph:encode(state)});
 if(text.length>MAX_BYTES)throw Error('Run exceeds storage budget');
 return text;
}
export function deserializeRun(text){
 if(typeof text!=='string'||text.length>MAX_BYTES)throw Error('Invalid save');
 const saved=JSON.parse(text);
 if(saved.version!==VERSION||!Number.isFinite(saved.savedAt))throw Error('Unsupported save');
 const state=decode(saved.graph);validate(state);
 // Do not call generate()/enter()/choose(): those would reset enemies, refill
 // shelves, retrigger room items, or apply stats a second time.
 const game=Object.create(Game.prototype);
 for(const [k,v] of Object.entries(state)){
  if(k==='room'||k==='random'||k in Game.prototype)throw Error('Invalid run property');
  game[k]=v;
 }
 game.random=Math.random;game.events=[];
 game.bombLatch=game.useLatch=game.activeLatch=false;
 bindFloorEconomy(game);
 return {game,costume:typeof saved.costume==='string'?saved.costume:'original',savedAt:saved.savedAt};
}

export function createRunStore(storage){
 return {
  read(){
   let text;try{text=storage.getItem(RUN_SAVE_KEY)}catch{return {status:'error',storageBlocked:true}}
   try{return text?{status:'ok',...deserializeRun(text)}:{status:'empty'}}catch{return {status:'error'}}
  },
  write(game,options){try{const text=serializeRun(game,options);if(text===null)storage.removeItem(RUN_SAVE_KEY);else storage.setItem(RUN_SAVE_KEY,text);return true}catch{return false}},
  clear(){try{storage.removeItem(RUN_SAVE_KEY);return true}catch{return false}}
 };
}
