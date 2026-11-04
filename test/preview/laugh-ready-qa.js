document.documentElement.requestFullscreen=()=>Promise.reject(new Error('QA viewport lock'));
const mod=await import('./game.js');
document.querySelector('#qaCharge').onclick=()=>{const g=mod.game;if(g.mode!=='play')mod.start();const e=mod.game.spawn('brute',800,400);e.hp=e.maxHp=100;mod.game.damageEnemy(e,45);mod.game.p.x=480;mod.game.p.y=350;mod.processEvents()};
document.querySelector('#qaHide').onclick=()=>document.querySelector('#qaTools').style.display='none';
