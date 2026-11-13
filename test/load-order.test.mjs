import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {WEBP} from '../dist/asset-webp.js';

const dist=new URL('../dist/',import.meta.url);
const read=f=>fs.readFileSync(new URL(f,dist),'utf8');

function pngSize(buf){assert.equal(buf.toString('latin1',12,16),'IHDR');return [buf.readUInt32BE(16),buf.readUInt32BE(20)]}
function webpSize(buf){
 assert.equal(buf.toString('latin1',0,4),'RIFF');assert.equal(buf.toString('latin1',8,12),'WEBP');
 const kind=buf.toString('latin1',12,16);
 if(kind==='VP8X')return [1+buf.readUIntLE(24,3),1+buf.readUIntLE(27,3)];
 if(kind==='VP8 ')return [buf.readUInt16LE(26)&0x3fff,buf.readUInt16LE(28)&0x3fff];
 if(kind==='VP8L'){const b=buf.readUInt32LE(21);return [(b&0x3fff)+1,((b>>14)&0x3fff)+1]}
 throw Error('unknown WebP chunk '+kind);
}
test('every listed PNG has a WebP twin of the same size, and every twin is listed',()=>{
 for(const name of WEBP){
  const png=fs.readFileSync(new URL('assets/'+name,dist)),webp=fs.readFileSync(new URL('assets/'+name.replace(/\.png$/,'.webp'),dist));
  assert.deepEqual(webpSize(webp),pngSize(png),name);
  assert.ok(webp.length<png.length,name+' twin is smaller');
 }
 const twins=fs.readdirSync(new URL('assets/',dist)).filter(f=>f.endsWith('.webp'));
 assert.deepEqual(twins.map(f=>f.replace(/\.webp$/,'.png')).sort(),[...WEBP].sort());
});
test('runtime code never builds an asset URL around the helper',()=>{
 const runtime=fs.readdirSync(dist).filter(f=>/\.(js|css|html)$/.test(f)&&!/^(asset-url|asset-webp|soundcheck|phoebe-demo)\./.test(f));
 for(const f of runtime){
  const s=read(f);
  for(const m of s.matchAll(/assets\/([a-z0-9-]+)\.png/g))assert.ok(m[1].startsWith('icon-'),`${f} names assets/${m[1]}.png directly`);
  assert.ok(!/\.src\s*=\s*new URL\(['"]\.\/assets\//.test(s),f+' sets an image src without loadArt');
  assert.ok(!/assets\/\$\{/.test(s),f+' interpolates an asset path without assetPath');
 }
});
test('art waits while the title holds it, then loads in request order; other pages load at once',async()=>{
 const attrs=new Set(['data-art-hold']);
 globalThis.document={documentElement:{hasAttribute:a=>attrs.has(a),removeAttribute:a=>attrs.delete(a)}};
 try{
  const m=await import('../dist/asset-url.js?held');
  const a={},b={};m.loadArt(a,'mobs-milk-v1.png');m.loadArt(b,'icon-192.png');
  assert.equal(a.src,undefined);assert.equal(a.assetName,'mobs-milk-v1.png');assert.equal(m.artHeld(),true);
  let ready=false;m.artReady().then(()=>ready=true);await Promise.resolve();assert.equal(ready,false);
  m.releaseArt();await Promise.resolve();
  assert.match(a.src,/assets\/mobs-milk-v1\.webp$/);assert.match(b.src,/assets\/icon-192\.png$/);
  assert.equal(ready,true);assert.equal(attrs.has('data-art-hold'),false);
  const c={};m.loadArt(c,'rooms-bright-v1.png');assert.match(c.src,/rooms-bright-v1\.webp$/,'after release, loads immediately');
  assert.equal(m.assetPath('cover-rescue-v2.png'),'assets/cover-rescue-v2.webp');assert.equal(m.assetPath('creator-douyin.jpg'),'assets/creator-douyin.jpg');
 }finally{delete globalThis.document}
 const open=await import('../dist/asset-url.js?open'),d={};open.loadArt(d,'mobs-milk-v1.png');
 assert.match(d.src,/mobs-milk-v1\.webp$/,'no document hold: immediate');
});
