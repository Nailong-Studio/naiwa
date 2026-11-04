import {ItemAudio,ITEM_VOICES,ownsItemVoice} from './item-audio.js';
const owned=new Set(),g={has:id=>owned.has(id)},a=new ItemAudio({canPlay:key=>ownsItemVoice(g,key)});let outcome='等待测试',accepted=0;
document.querySelector('#empty').onclick=()=>{owned.clear();a.reset();a.unlock();a.unlock();accepted=Object.keys(ITEM_VOICES).filter(k=>a.request(k)).length;outcome='无道具请求已执行'};
document.querySelector('#owned').onclick=()=>{owned.add('man');a.reset();a.unlock();accepted=Number(a.request('man'));outcome='Man 实际播放请求已执行'};
document.querySelector('#clear').onclick=()=>{owned.clear();a.update(true);outcome='已清空道具'};
setInterval(()=>{a.update(true);const playing=Object.entries(a.clips).filter(([,v])=>!v.paused&&!v.muted).map(([k])=>k);document.querySelector('#status').textContent=outcome+'\n持有：'+([...owned].join(',')||'无')+'\n获准请求：'+accepted+'\n当前播放：'+(playing.join(',')||'无')+'\n可播放媒体：'+Object.values(a.clips).filter(v=>v.readyState>=2).length+'/8';},50);
