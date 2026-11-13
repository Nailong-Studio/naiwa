import test from 'node:test';
import assert from 'node:assert/strict';
import {ringPlacement,bindStickControl,bindAttackStick} from '../dist/mobile-ui.js';
import {applyRotation} from '../dist/rotate-view.js';

test('the move ring lands under the thumb; only the screen edges push it back',()=>{
 const zone={left:0,top:100,width:300,height:290};
 // Centred on the finger: 100 px ring at (150, 250) → 100 from the left, 90 from the bottom.
 assert.deepEqual(ringPlacement(zone,100,{x:150,y:250}),{left:100,bottom:90});
 // The bottom-left corner of the zone is the screen corner: the ring is pushed back on screen.
 assert.deepEqual(ringPlacement(zone,100,{x:10,y:385}),{left:0,bottom:0});
 // Near the zone's inner edges (room side, map side) it stays under the thumb.
 assert.deepEqual(ringPlacement(zone,100,{x:299,y:101}),{left:249,bottom:239});
 // A zone smaller than the ring still keeps it off the screen edges.
 assert.deepEqual(ringPlacement({left:0,top:0,width:60,height:60},100,{x:30,y:30}),{left:0,bottom:0});
});
test('pressing anywhere in the zone moves the ring there; release puts it back; steering is unchanged',()=>{
 const props={},view=new EventTarget(),doc=new EventTarget();doc.defaultView=view;
 const ring={getBoundingClientRect:()=>({left:14,top:270,width:100,height:100})};
 const el=new EventTarget();Object.assign(el,{ownerDocument:doc,isConnected:true,querySelector:s=>s==='em'?ring:null,style:{setProperty:(k,v)=>props[k]=v,removeProperty:k=>delete props[k]},getBoundingClientRect:()=>({left:0,top:100,width:300,height:290}),setPointerCapture(){},hasPointerCapture:()=>false,releasePointerCapture(){},classList:{add(){},remove(){}}});
 const moves=[];bindStickControl(el,(v,held)=>moves.push({...v,held}));
 const ev=(type,x,y)=>{const e=new Event(type,{cancelable:true});Object.assign(e,{pointerId:3,button:0,pointerType:'touch',clientX:x,clientY:y});el.dispatchEvent(e)};
 ev('pointerdown',200,200);
 assert.deepEqual(props,{'--ring-x':'150px','--ring-y':'140px'});
 ev('pointermove',200+40,200);
 // Same radius as the old 112 px stick box: (100 + 12) × 0.32.
 const r=(112*.32),expected=(40-7)/(r-7);
 assert.ok(Math.abs(moves.at(-1).x-Math.min(1,expected))<1e-9&&moves.at(-1).y===0,JSON.stringify(moves.at(-1)));
 ev('pointerup',240,200);
 assert.deepEqual(props,{});assert.deepEqual(moves.at(-1),{x:0,y:0,held:false});
});

test('changing the height of a sideways browser keeps both physical fingers neutral or on their chosen arm',()=>{
 const view=new EventTarget(),doc=new EventTarget();
 doc.defaultView=view;doc.documentElement={dataset:{}};doc.styleSheets=[];
 const rotate=(dir,height)=>applyRotation({doc,view,dir,width:390,height});
 const button=(left,top)=>{const el=new EventTarget();el.ownerDocument=doc;
  el.getBoundingClientRect=()=>({left,top,width:100,height:100});return el};
 const move=button(170,550),fire=button(160,60),moves=[],shots=[];
 const send=(el,type,x,y,id)=>{const e=new Event(type,{cancelable:true});Object.assign(e,{clientX:x,clientY:y,pointerType:'touch',pointerId:id,button:0});el.dispatchEvent(e)};
 try{
  rotate('ccw',844);
  bindStickControl(move,v=>moves.push(v));bindAttackStick(fire,v=>shots.push(v));
  send(move,'pointerdown',200,600,1);send(fire,'pointerdown',185,110,2);
  assert.equal(shots.at(-1).y,-1);
  rotate('ccw',780);
  send(move,'pointermove',201,601,1);send(fire,'pointermove',186,111,2);
  assert.deepEqual(moves.at(-1),{x:0,y:0});assert.equal(shots.at(-1).x,0);assert.equal(shots.at(-1).y,-1);
  send(move,'pointerup',201,601,1);send(fire,'pointerup',186,111,2);
 }finally{rotate(null,844)}
});
