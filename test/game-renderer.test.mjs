import test from 'node:test';
import assert from 'node:assert/strict';
import {gameRenderSize,createGameRenderer} from '../dist/game-renderer.js';

test('drawing resolution follows screen density with a native floor and mobile memory cap',()=>{
 assert.deepEqual(gameRenderSize(960,600,1),{width:960,height:600,scale:1});
 assert.deepEqual(gameRenderSize(960,600,2),{width:1920,height:1200,scale:2});
 assert.deepEqual(gameRenderSize(480,300,3),{width:1440,height:900,scale:1.5});
 assert.deepEqual(gameRenderSize(3840,2400,4),{width:1920,height:1200,scale:2});
 for(const args of [[667,417,2],[0,0,1],[NaN,undefined,Infinity],[320,200,-1]]){
  const s=gameRenderSize(...args);assert.equal(s.width/s.height,1.6);
  assert.ok(s.width>=960&&s.width<=1920);assert.equal(s.width/960,s.scale);
 }
});

function fixture(observable=true){
 const calls=[],events=new Map(),viewportEvents=new Map();let notify,disconnected=false;
 const context={roundRect(){},setTransform(...v){calls.push(['transform',...v])},clearRect(...v){calls.push(['clear',...v])}};
 let width=960,height=600,writes=0;
 const canvas={clientWidth:480,clientHeight:300,get width(){return width},set width(v){width=v;writes++},get height(){return height},set height(v){height=v;writes++},getContext(){return context},getBoundingClientRect(){throw Error('rotated bounds must not be used')}};
 const view={devicePixelRatio:3,addEventListener:(k,v)=>events.set(k,v),removeEventListener:k=>events.delete(k),visualViewport:{addEventListener:(k,v)=>viewportEvents.set(k,v),removeEventListener:k=>viewportEvents.delete(k)}};
 if(observable)view.ResizeObserver=class{constructor(cb){notify=cb}observe(target){assert.equal(target,canvas)}disconnect(){disconnected=true}};
 return {canvas,view,context,calls,events,viewportEvents,notify:()=>notify(),writes:()=>writes,disconnected:()=>disconnected};
}

test('drawing uses logical coordinates, without reallocating the canvas every frame',()=>{
 const f=fixture(),r=createGameRenderer(f.canvas,f.view);r.beginFrame();
 assert.equal(f.canvas.width,1440);assert.equal(f.canvas.height,900);
 assert.deepEqual(f.calls.slice(-2),[['transform',1.5,0,0,1.5,0,0],['clear',0,0,960,600]]);
 assert.equal(f.context.imageSmoothingEnabled,false);assert.equal(f.writes(),2);
 for(let i=0;i<100;i++)r.beginFrame();assert.equal(f.writes(),2);
 f.canvas.clientWidth=640;f.canvas.clientHeight=400;f.notify();r.beginFrame();assert.equal(f.canvas.width,1920);
 f.view.devicePixelRatio=1;r.beginFrame();assert.equal(f.canvas.width,960);
 r.dispose();assert.equal(f.disconnected(),true);assert.equal(f.events.size,0);assert.equal(f.viewportEvents.size,0);
});

test('older WebViews resize through window and viewport events without ResizeObserver',()=>{
 const f=fixture(false),r=createGameRenderer(f.canvas,f.view);r.beginFrame();
 f.canvas.clientWidth=640;f.canvas.clientHeight=400;f.events.get('resize')();r.beginFrame();assert.equal(f.canvas.width,1920);
 f.canvas.clientWidth=480;f.canvas.clientHeight=300;f.viewportEvents.get('resize')();r.beginFrame();assert.equal(f.canvas.width,1440);
 r.dispose();
});
