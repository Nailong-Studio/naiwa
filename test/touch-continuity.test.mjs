import test from 'node:test';
import assert from 'node:assert/strict';
import {bindHoldControl,bindStickControl,bindAttackStick} from '../dist/mobile-ui.js';
import {installMobileViewport} from '../dist/mobile-viewport.js';
function scene(){const view=new EventTarget(),doc=new EventTarget();doc.defaultView=view;const make=()=>{const el=new EventTarget();el.ownerDocument=doc;el.isConnected=true;el.bounds={left:0,top:0,width:100,height:100};el.getBoundingClientRect=()=>({...el.bounds});el.setPointerCapture=()=>{throw new Error('browser dropped active pointer')};return el};return {view,doc,make}}
function send(target,type,id,x=0,y=0,extra={}){const e=new Event(type,{cancelable:true});Object.assign(e,{pointerId:id,button:0,buttons:1,pointerType:'touch',clientX:x,clientY:y,...extra});target.dispatchEvent(e);return e}

test('movement, attack and a third action finger remain independent when capture is unavailable',()=>{
 const {view,make}=scene(),stick=make(),fire=make(),bomb=make();let movement,attack,bombs=0;
 bindStickControl(stick,(v,held)=>movement={...v,held});bindAttackStick(fire,(v,held)=>attack={...v,held});bindHoldControl(bomb,()=>bombs++,()=>{});
 send(stick,'pointerdown',11,50,50);send(fire,'pointerdown',22,95,50);send(view,'pointermove',11,150,50);send(bomb,'pointerdown',33);send(view,'pointerup',33);
 assert.equal(bombs,1);assert.deepEqual(movement,{x:1,y:0,held:true});assert.deepEqual(attack,{x:1,y:0,held:true});
 send(view,'pointerup',11);assert.equal(movement.held,false);assert.equal(attack.held,true);
 send(view,'pointermove',22,50,-200);assert.deepEqual(attack,{x:0,y:-1,held:true});send(view,'pointercancel',22);assert.equal(attack.held,false);
});
test('lost capture alone preserves a held finger; outside release stops it once, without a stuck key',()=>{
 const {view,make}=scene(),el=make();let pressed=0,released=0,moves=0;
 bindHoldControl(el,()=>pressed++,()=>released++,{move:()=>moves++});send(el,'pointerdown',1);send(el,'lostpointercapture',1);send(view,'pointermove',1,500,500);assert.equal(released,0);assert.equal(moves,1);
 send(view,'pointerup',1);send(el,'pointerup',1);send(el,'lostpointercapture',1);assert.equal(released,1);send(view,'pointermove',1);assert.equal(moves,1);
 send(el,'pointerdown',2);assert.equal(pressed,2);view.dispatchEvent(new Event('pagehide'));assert.equal(released,2);
});
test('an attack finger keeps its original center through layout changes and refreshes it on next press',()=>{
 const {view,make}=scene(),el=make();let state;
 bindAttackStick(el,(v,held)=>state={...v,held});send(el,'pointerdown',1,50,10);assert.deepEqual(state,{x:0,y:-1,held:true});
 el.bounds.top=-40;send(view,'pointermove',1,50,10);assert.deepEqual(state,{x:0,y:-1,held:true});
 send(view,'pointerup',1);send(el,'pointerdown',2,50,10);assert.deepEqual(state,{x:0,y:0,held:true});
 send(view,'pointermove',2,50,50);assert.deepEqual(state,{x:0,y:1,held:true});
});
test('joystick sensitivity remains stable until the finger releases',()=>{
 const {view,make}=scene(),el=make();let state;bindStickControl(el,v=>state=v);
 send(el,'pointerdown',1,50,50);send(view,'pointermove',1,69.5,50);assert.equal(state.x,.5);
 el.bounds.width=72;send(view,'pointermove',1,69.5,50);assert.equal(state.x,.5);
});
test('global fallback does not double-process bubbling moves and handles visibility and mouse release',()=>{
 const {view,doc,make}=scene(),el=make();let moves=0,releases=0;bindHoldControl(el,()=>{},()=>releases++,{move:()=>moves++});
 send(el,'pointerdown',1);const e=send(view,'pointermove',1,70,50);el.dispatchEvent(e);assert.equal(moves,1);doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));assert.equal(releases,1);
 send(el,'pointerdown',2);send(view,'pointermove',2,0,0,{pointerType:'mouse',buttons:0});assert.equal(releases,2);assert.equal(moves,1);
});
test('address-bar resizing and fullscreen resizing preserve input; orientation and mode changes reset it',()=>{
 const {view,doc}=scene(),media=new EventTarget(),vars=new Map(),viewport=new EventTarget();media.matches=true;doc.body={};doc.documentElement={style:{setProperty:(k,v)=>vars.set(k,v)}};
 Object.assign(view,{innerWidth:844,innerHeight:390,scrollX:0,scrollY:0,visualViewport:viewport,requestAnimationFrame:fn=>fn()});Object.assign(viewport,{width:844,height:390});
 let resets=0;installMobileViewport({view,doc,media,resetInput:()=>resets++});assert.equal(resets,1);
 for(let height=389;height>=270;height--){viewport.height=height;viewport.dispatchEvent(new Event('resize'))}
 doc.dispatchEvent(new Event('fullscreenchange'));assert.equal(resets,1);assert.equal(vars.get('--game-vh'),'270px');
 view.dispatchEvent(new Event('orientationchange'));assert.equal(resets,2);media.matches=false;media.dispatchEvent(new Event('change'));assert.equal(resets,3);
});
