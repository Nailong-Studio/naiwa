import test from 'node:test';
import assert from 'node:assert/strict';
import {bindPanelShortcuts} from '../dist/mobile-ui.js';
test('P and Escape close the panel once without reaching the gameplay pause toggle',()=>{
 for(const key of ['p','P','Escape']){
  const target=new EventTarget();let open=true,closed=0,toggles=0;
  bindPanelShortcuts(target,{isOpen:()=>open,close:()=>{open=false;closed++}});
  target.addEventListener('keydown',()=>toggles++);
  const e=new Event('keydown',{cancelable:true});Object.assign(e,{key,repeat:false});target.dispatchEvent(e);
  assert.equal(closed,1);assert.equal(toggles,0);assert.equal(e.defaultPrevented,true);
 }
});
test('held pause keys stay consumed, other keys and closed panels retain normal behavior',()=>{
 const target=new EventTarget();let open=true,closed=0,forwarded=0;
 bindPanelShortcuts(target,{isOpen:()=>open,close:()=>closed++});target.addEventListener('keydown',()=>forwarded++);
 const send=(key,repeat=false)=>{const e=new Event('keydown',{cancelable:true});Object.assign(e,{key,repeat});target.dispatchEvent(e);return e};
 assert.equal(send('p',true).defaultPrevented,true);assert.equal(closed,0);assert.equal(forwarded,0);
 assert.equal(send('ArrowDown').defaultPrevented,false);assert.equal(forwarded,1);
 open=false;assert.equal(send('p').defaultPrevented,false);assert.equal(forwarded,2);
});

test('M toggles the map once per press and respects gameplay/modal eligibility',async()=>{
 const {bindMapShortcut}=await import('../dist/mobile-ui.js');const target=new EventTarget();let allowed=true,toggles=0,forwarded=0;
 bindMapShortcut(target,{canToggle:()=>allowed,toggle:()=>toggles++});target.addEventListener('keydown',()=>forwarded++);
 const send=(key,extra={})=>{const e=new Event('keydown',{cancelable:true});Object.assign(e,{key,repeat:false,...extra});target.dispatchEvent(e);return e};
 assert.equal(send('m').defaultPrevented,true);assert.equal(toggles,1);assert.equal(forwarded,0);
 send('m',{repeat:true});assert.equal(toggles,1);send('M');assert.equal(toggles,2);
 allowed=false;assert.equal(send('m').defaultPrevented,false);assert.equal(toggles,2);
 allowed=true;for(const extra of [{ctrlKey:true},{metaKey:true},{altKey:true},{isComposing:true}])assert.equal(send('m',extra).defaultPrevented,false);
 assert.equal(toggles,2);
});
