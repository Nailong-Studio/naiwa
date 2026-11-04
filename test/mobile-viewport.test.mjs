import test from 'node:test';
import assert from 'node:assert/strict';
import {visibleGameSize,canScrollVertically,installMobileViewport} from '../dist/mobile-viewport.js';
test('game uses the actually visible browser height and falls back during rotation',()=>{
 assert.deepEqual(visibleGameSize({innerWidth:844,innerHeight:390,visualViewport:{width:844,height:276}}),{width:844,height:276});
 assert.deepEqual(visibleGameSize({innerWidth:667,innerHeight:320,visualViewport:{width:0,height:0}}),{width:667,height:320});
 assert.deepEqual(visibleGameSize({innerWidth:844,innerHeight:390}),{width:844,height:390});
});
test('lists may scroll internally but cannot chain gestures into the page at either edge',()=>{
 const n={scrollTop:0,scrollHeight:500,clientHeight:200};assert.equal(canScrollVertically(n,10),false);assert.equal(canScrollVertically(n,-10),true);
 n.scrollTop=300;assert.equal(canScrollVertically(n,-10),false);assert.equal(canScrollVertically(n,10),true);
 n.scrollTop=100;assert.equal(canScrollVertically(n,-10),true);assert.equal(canScrollVertically(n,10),true);
 assert.equal(canScrollVertically({scrollTop:0,scrollHeight:200,clientHeight:200},-10),false);
});
test('touch guard blocks gameplay drags and multi-touch, permits only bounded menu scrolling',()=>{
 const doc=new EventTarget(),view=new EventTarget(),media=new EventTarget(),vars=new Map();media.matches=true;doc.body={};doc.documentElement={style:{setProperty:(k,v)=>vars.set(k,v)}};
 Object.assign(view,{innerWidth:844,innerHeight:390,scrollX:0,scrollY:0,requestAnimationFrame:fn=>fn(),scrollTo(x,y){this.scrollX=x;this.scrollY=y},getComputedStyle:()=>({overflowY:'auto'})});
 let resets=0;installMobileViewport({view,doc,media,resetInput:()=>resets++});assert.equal(vars.get('--game-vh'),'390px');
 const surface={closest:()=>null},list={closest:()=>true,scrollTop:20,scrollHeight:400,clientHeight:100,parentElement:doc.body};
 function touch(type,target,y,count=1){const e=new Event(type,{cancelable:true});const t={identifier:1,clientX:50,clientY:y,target};Object.assign(e,{changedTouches:[t],touches:Array(count).fill(t)});doc.dispatchEvent(e);return e.defaultPrevented}
 touch('touchstart',surface,40);assert.equal(touch('touchmove',surface,60),true);
 touch('touchstart',list,40);assert.equal(touch('touchmove',list,50),false);list.scrollTop=0;assert.equal(touch('touchmove',list,60),true);
 list.scrollTop=20;assert.equal(touch('touchmove',list,50,2),true);
 media.matches=false;assert.equal(touch('touchmove',surface,80),false);
 media.matches=true;view.innerHeight=270;view.scrollY=50;view.dispatchEvent(new Event('resize'));assert.equal(vars.get('--game-vh'),'270px');assert.equal(view.scrollY,0);assert.equal(resets,1);
});
