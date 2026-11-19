import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareGameCanvas} from '../dist/canvas-compat.js';

function context(){
 const commands=[],ctx={commands};
 for(const name of ['moveTo','lineTo','arcTo','closePath'])ctx[name]=(...args)=>commands.push([name,...args]);
 return ctx;
}
test('legacy context draws the initial room door without requiring roundRect',()=>{
 const ctx=prepareGameCanvas(context());
 ctx.roundRect(-49,-25,98,50,10);
 assert.deepEqual(ctx.commands[0],['moveTo',-39,-25]);
 assert.deepEqual(ctx.commands.filter(c=>c[0]==='arcTo'),[
  ['arcTo',49,-25,49,-15,10],['arcTo',49,25,39,25,10],
  ['arcTo',-49,25,-49,15,10],['arcTo',-49,-25,-39,-25,10]
 ]);
 assert.equal(ctx.commands.filter(c=>c[0]==='closePath').length,1);
 assert.deepEqual(ctx.commands.at(-1),['moveTo',-49,-25]);
});
test('oversized radii fit narrow shapes; negative dimensions remain finite',()=>{
 const ctx=prepareGameCanvas(context());ctx.roundRect(20,30,-10,-20,40);
 assert.deepEqual(ctx.commands[0],['moveTo',15,10]);
 assert.ok(ctx.commands.filter(c=>c[0]==='arcTo').every(c=>c.at(-1)===5));
 assert.ok(ctx.commands.flatMap(c=>c.slice(1)).every(Number.isFinite));
});
test('modern contexts keep their native method and contexts are isolated',()=>{
 const native=()=>{},modern={roundRect:native},legacy=context();
 prepareGameCanvas(modern);prepareGameCanvas(legacy);
 assert.equal(modern.roundRect,native);assert.equal(context().roundRect,undefined);
 const first=legacy.roundRect;prepareGameCanvas(legacy);assert.equal(legacy.roundRect,first);
});
test('invalid geometry does not poison the current path',()=>{
 const ctx=prepareGameCanvas(context());
 ctx.roundRect(0,0,NaN,20,2);assert.equal(ctx.commands.length,0);
 assert.throws(()=>ctx.roundRect(0,0,10,10,-1),RangeError);
 assert.equal(ctx.commands.length,0);
 assert.throws(()=>prepareGameCanvas(null),/游戏画面/);
});
