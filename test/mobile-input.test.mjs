import test from 'node:test';
import assert from 'node:assert/strict';
import {bindHoldControl,bindStickControl,bindAttackStick,cardinalAim,stickVector,createTouchActions,mobileAttack} from '../dist/mobile-ui.js';
import {Game} from '../dist/campaign.js';
function control(){const element=new EventTarget(),view=new EventTarget();element.ownerDocument={defaultView:view};element.setPointerCapture=id=>element.captured=id;let presses=0,releases=0;bindHoldControl(element,()=>presses++,()=>releases++);const event=(type,id=1)=>{const e=new Event(type,{cancelable:true});Object.defineProperties(e,{pointerId:{value:id},button:{value:0}});element.dispatchEvent(e);return e};return {element,view,event,get presses(){return presses},get releases(){return releases}}}
test('holding a control prevents native selection and only its owning finger can release it',()=>{const c=control();assert.ok(c.event('pointerdown').defaultPrevented);assert.equal(c.element.captured,1);c.event('pointerdown',2);c.event('pointerup',2);assert.equal(c.presses,1);assert.equal(c.releases,0);c.event('pointerup');c.event('lostpointercapture');assert.equal(c.releases,1);assert.ok(c.event('contextmenu').defaultPrevented)});
test('independent fingers can hold separate controls and cancellation releases exactly once',()=>{const fire=control(),bomb=control();fire.event('pointerdown',1);bomb.event('pointerdown',2);fire.event('pointercancel',1);assert.equal(fire.releases,1);assert.equal(bomb.releases,0);bomb.event('lostpointercapture',2);bomb.event('pointerup',2);assert.equal(bomb.releases,1)});
test('switching away clears the held pointer so the next touch works immediately',()=>{const c=control();c.event('pointerdown');c.view.dispatchEvent(new Event('blur'));assert.equal(c.releases,1);c.event('pointerdown',3);assert.equal(c.presses,2);c.event('pointerup',3);assert.equal(c.releases,2)});
test('joystick ignores hand jitter, scales smoothly and caps diagonal speed',()=>{
 assert.deepEqual(stickVector(4,4,32),{x:0,y:0});
 assert.equal(stickVector(19.5,0,32).x,.5);
 const diagonal=stickVector(400,-400,32);assert.ok(Math.abs(Math.hypot(diagonal.x,diagonal.y)-1)<1e-10);assert.ok(diagonal.y<0);
});
test('joystick owns one finger, starts neutral and can be reset while held by a menu',()=>{
 const el=new EventTarget(),view=new EventTarget(),changes=[];el.ownerDocument={defaultView:view};let captured=null;
 el.setPointerCapture=id=>captured=id;el.hasPointerCapture=id=>captured===id;el.releasePointerCapture=()=>captured=null;el.getBoundingClientRect=()=>({width:100});
 const reset=bindStickControl(el,(v,held)=>changes.push({...v,held}));
 const send=(type,id,x,y)=>{const e=new Event(type,{cancelable:true});Object.assign(e,{pointerId:id,button:0,clientX:x,clientY:y});el.dispatchEvent(e)};
 send('pointerdown',1,20,20);assert.deepEqual(changes.at(-1),{x:0,y:0,held:true});
 send('pointermove',2,100,100);assert.equal(changes.length,1);
 send('pointermove',1,70,20);assert.equal(changes.at(-1).x,1);
 reset();assert.equal(captured,null);assert.deepEqual(changes.at(-1),{x:0,y:0,held:false});
 send('pointermove',1,90,20);assert.equal(changes.length,3);
 send('pointerdown',2,80,20);assert.equal(changes.at(-1).held,true);
 send('pointercancel',2,80,20);assert.equal(changes.at(-1).held,false);
});
test('one long bomb press spends one bomb over multiple cooldowns; reset drops pending actions',()=>{
 const g=new Game(()=>.42);g.start();g.bombs=8;g.p.hp=100;g.p.maxHp=100;
 const actions=createTouchActions();actions.press('bomb');
 for(let i=0;i<200;i++)g.update(.04,actions.take());
 assert.equal(g.bombs,7);
 actions.press('use');actions.press('active');actions.clear();assert.deepEqual(actions.take(),{});
 actions.press('bomb',false);assert.deepEqual(actions.take(),{});
 actions.press('dash');assert.equal(actions.take().dash,true);assert.deepEqual(actions.take(),{});
});
test('four-way input rejects auto fire and stops at neutral, release or pause',()=>{
 const state={held:false,aim:{x:0,y:0},automatic:true,mobile:true,playing:true,hasEnemies:true};
 assert.equal(mobileAttack(state).fire,false);
 assert.equal(mobileAttack({...state,held:true}).fire,false);
 for(const off of [{held:false},{playing:false}])assert.equal(mobileAttack({...state,held:true,aim:{x:1,y:1},...off}).fire,false);
 assert.deepEqual(mobileAttack({...state,held:true,aim:{x:.3,y:-.8}}),{fire:true,auto:false,ax:0,ay:-1});
});
test('cardinal aim snaps every angle and holds its axis through small diagonal jitter',()=>{
 for(let angle=0;angle<Math.PI*2;angle+=.01){const d=cardinalAim(Math.cos(angle),Math.sin(angle));assert.equal(Math.abs(d.x)+Math.abs(d.y),1)}
 assert.deepEqual(cardinalAim(1,1),{x:1,y:0});
 assert.deepEqual(cardinalAim(29,-30,{x:1,y:0},.15),{x:1,y:0});
 assert.deepEqual(cardinalAim(20,-30,{x:1,y:0},.15),{x:0,y:-1});
 assert.deepEqual(cardinalAim(0,0),{x:0,y:0});
});
test('attack cross fires on the pressed arm, switches cardinal direction, and owns one finger',()=>{
 const el=new EventTarget(),view=new EventTarget(),changes=[];el.ownerDocument={defaultView:view};let captured=null;
 el.setPointerCapture=id=>captured=id;el.hasPointerCapture=id=>captured===id;el.releasePointerCapture=()=>captured=null;el.getBoundingClientRect=()=>({left:100,top:200,width:96,height:96});
 const reset=bindAttackStick(el,(v,held)=>changes.push({...v,held}));
 const send=(type,id,x,y)=>{const e=new Event(type,{cancelable:true});Object.assign(e,{pointerId:id,button:0,clientX:x,clientY:y});el.dispatchEvent(e)};
 send('pointerdown',1,148,207);assert.deepEqual(changes.at(-1),{x:0,y:-1,held:true});
 send('pointerdown',2,188,248);send('pointermove',2,188,248);send('pointerup',2,188,248);assert.equal(changes.length,1);
 send('pointermove',1,188,245);assert.deepEqual(changes.at(-1),{x:1,y:0,held:true});
 send('pointermove',1,148,248);assert.deepEqual(changes.at(-1),{x:0,y:0,held:true});
 send('pointermove',1,108,248);assert.deepEqual(changes.at(-1),{x:-1,y:0,held:true});
 reset();assert.equal(captured,null);assert.deepEqual(changes.at(-1),{x:0,y:0,held:false});
 send('pointerdown',2,148,289);assert.deepEqual(changes.at(-1),{x:0,y:1,held:true});
 view.dispatchEvent(new Event('blur'));assert.equal(changes.at(-1).held,false);
 send('pointerdown',3,148,207);send('pointercancel',3,148,207);assert.equal(changes.at(-1).held,false);
});
test('base shots stay cardinal and do not turn toward an off-axis enemy',()=>{
 for(const aim of [{x:1,y:.7},{x:-1,y:.7},{x:.7,y:1},{x:.7,y:-1}]){
  const g=new Game(()=>.42);g.start();g.room.enemies=[{x:g.p.x+100,y:g.p.y+100,hp:100,maxHp:100,r:14,type:'chaser',speed:0,cd:100}];
  const attack=mobileAttack({held:true,aim,playing:true});g.update(.001,attack);
  const shots=g.bullets.filter(b=>!b.pet);assert.ok(shots.length>0);
  for(const b of shots){assert.equal(b.vx===0||b.vy===0,true);assert.equal(Math.sign(b.vx),attack.ax);assert.equal(Math.sign(b.vy),attack.ay)}
 }
});
