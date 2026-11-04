import test from 'node:test';
import assert from 'node:assert/strict';
import {requestGameFullscreen,toggleGameFullscreen} from '../dist/fullscreen.js';
test('mobile start requests fullscreen synchronously in the gesture, then locks landscape',async()=>{
 const calls=[],doc={documentElement:{requestFullscreen(){calls.push('request');return Promise.resolve()}}},view={screen:{orientation:{lock(value){calls.push(value)}}}};
 const pending=requestGameFullscreen({doc,view});assert.deepEqual(calls,['request']);assert.equal(await pending,'entered');assert.deepEqual(calls,['request','landscape']);
});
test('desktop start requests fullscreen without locking orientation and never toggles an existing fullscreen',async()=>{
 let calls=0;const doc={documentElement:{requestFullscreen(){calls++}}},view={screen:{orientation:{lock(){throw Error('desktop must not lock orientation')}}}};
 assert.equal(await requestGameFullscreen({mobile:false,doc,view}),'entered');assert.equal(calls,1);doc.fullscreenElement={};assert.equal(await requestGameFullscreen({doc,view}),'already');assert.equal(calls,1);
});

test('unsupported and rejected fullscreen keep startup usable; orientation failure is tolerated',async()=>{
 assert.equal(await requestGameFullscreen({doc:{documentElement:{}},view:{}}),'unsupported');
 assert.equal(await requestGameFullscreen({doc:{documentElement:{requestFullscreen:()=>Promise.reject(Error('blocked'))}},view:{}}),'denied');
 assert.equal(await requestGameFullscreen({doc:{documentElement:{requestFullscreen(){}}},view:{screen:{orientation:{lock(){throw Error('unsupported')}}}}}),'entered');
});
test('manual toggle exits standard fullscreen and supports prefixed implementations',async()=>{
 let entered=0,exited=0;const doc={documentElement:{webkitRequestFullscreen(){entered++;doc.webkitFullscreenElement=this}},webkitExitFullscreen(){exited++;doc.webkitFullscreenElement=null}};
 assert.equal(await toggleGameFullscreen({doc,view:{}}),'entered');assert.equal(entered,1);assert.equal(await toggleGameFullscreen({doc,view:{}}),'exited');assert.equal(exited,1);
 doc.fullscreenElement={};doc.exitFullscreen=()=>exited++;assert.equal(await toggleGameFullscreen({doc,view:{}}),'exited');assert.equal(exited,2);
});
