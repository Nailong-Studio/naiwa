// Asset URLs and load order.
// Art keeps its .png name as the identifier everywhere; the URL builder serves the WebP twin
// listed in asset-webp.js. While the game's title screen holds art (index.html sets
// data-art-hold), gameplay sheets and recordings wait until the cover has loaded or the player
// starts, so the cover gets the bandwidth first. Pages without the attribute load at once.
import {WEBP} from './asset-webp.js';
export function assetFile(file){return WEBP.has(file)?file.replace(/\.png$/,'.webp'):file}
export function assetUrl(file){return new URL('./assets/'+assetFile(file),import.meta.url).href}
// For HTML and inline-style strings, which resolve against index.html.
export function assetPath(file){return 'assets/'+assetFile(file)}
let held=null,release=null;
const queue=[],ready=new Promise(resolve=>{release=resolve});
function holding(){
 if(held===null)held=typeof document!=='undefined'&&!!document.documentElement?.hasAttribute?.('data-art-hold');
 return held;
}
// Starts (or queues) an image download. The name is kept for atlas lookups, since the URL may be .webp.
export function loadArt(image,file){
 image.assetName=file;const url=assetUrl(file);
 if(holding())queue.push(()=>{image.src=url});else image.src=url;
 return image;
}
export function artReady(){return holding()?ready:Promise.resolve()}
export function artHeld(){return holding()}
export function releaseArt(){
 if(!holding())return;
 held=false;document.documentElement.removeAttribute('data-art-hold');
 for(const start of queue.splice(0))start();
 release();
}
