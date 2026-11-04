// Prime media inside a gesture without letting a clip play while promises settle.
const pending=new WeakSet();
export const SILENT_PRIME=Symbol('silent media priming');
export function unlockSilent(audio,isActive){
 if(pending.has(audio)||isActive())return;
 pending.add(audio);audio.muted=true;
 // An idle/preloaded clip stays muted. Only an authorized gameplay request
 // may unmute it; delayed mobile playback must never leak a random item line.
 const finish=()=>{pending.delete(audio);if(!isActive()){audio.muted=true;audio.pause();audio.currentTime=0}};
 audio[SILENT_PRIME]=true;
 try{const result=audio.play();audio.pause();audio.currentTime=0;Promise.resolve(result).then(finish,finish)}catch{finish()}finally{audio[SILENT_PRIME]=false}
}
