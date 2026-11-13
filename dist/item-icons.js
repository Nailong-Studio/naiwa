import {ATLAS_CUTS,atlasRegion,FRAME_REGIONS} from './atlas-regions.js';
import {MEME_ITEMS} from './meme-items.js';
import {resourceIcon} from './resource-icons.js';
import {assetPath} from './asset-url.js';
const classic='eye laugh feet milk double tissue belly lotus tongue bubble tadpole crown fanvoice heavyvoice returnvoice mints springteeth starbadge rattle sparebutton coinpouch papercup milkcap beatsticker mending milkboots milkfilter spillcup milkfoam mouse dog egg turtle rabbit lunch scarf megaphone battery homing split bargain'.split(' ');
export function itemTexture(id){
 const phoebeIndex=['phoebe','phoebewire','phoebesoot','phoebeplug'].indexOf(id);if(phoebeIndex>=0)return {file:'phoebe-electrician-v1.png',cols:4,rows:2,index:4+phoebeIndex};
 if(id==='ricewhale')return {file:'deepseek-actions-v1.png',cols:4,rows:1,index:0};
 const deepIndex=['ricebowl','tokenbag','deepthink','wrongmodel'].indexOf(id);if(deepIndex>=0)return {file:'deepseek-items-v1.png',cols:2,rows:2,index:deepIndex};
 if(id==='gojohalf')return {file:'gojo-manga-actions-v2.png',cols:4,rows:1,index:0};
 if(id==='sandevistan')return {file:'sandevistan-v1.png',cols:1,rows:1,index:0};
 if(id==='ghostbuddha')return {file:'ghostbuddha-v1.png',cols:1,rows:1,index:0};
 if(id==='penguin'||id==='sweetpenguin')return {file:'penguins-actions-v1.png',cols:4,rows:2,index:id==='penguin'?0:4};
 const i=classic.indexOf(id);if(i>=0)return {file:'items-classic-v1.png',cols:7,rows:6,index:i};
 const m=MEME_ITEMS.findIndex(v=>v.id===id);if(m>=0&&m<20)return {file:'items-memes-v1.png',cols:5,rows:4,index:m};
 return null;
}
export function itemIcon(item){
 const t=itemTexture(item.id);if(!t)return resourceIcon(item.id)||`<span class="resource-symbol" aria-hidden="true">${item.icon||'✦'}</span>`;
 const col=t.index%t.cols,row=Math.floor(t.index/t.cols),a=ATLAS_CUTS[t.file];
 const frames=FRAME_REGIONS[t.file],width=a?a.x.at(-1):frames?Math.max(...frames.map(r=>r[0]+r[2])):t.cols,height=a?a.y.at(-1):frames?Math.max(...frames.map(r=>r[1]+r[3])):t.rows;
 const {left,top,w,h}=atlasRegion(t.file,t.cols,t.rows,row,col,width,height),m=Math.max(w,h);
 return `<span class="item-texture" aria-hidden="true"><span class="item-paint" style="display:inline-block;width:${w/m*100}%;height:${h/m*100}%;background-image:url('./${assetPath(t.file)}');background-size:${width/w*100}% ${height/h*100}%;background-position:${width===w?0:left/(width-w)*100}% ${height===h?0:top/(height-h)*100}%"></span></span>`;
}
