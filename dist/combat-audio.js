// The player's laugh is the feedback for a successful active skill.
// It must not be replaced by an item quote or dropped behind a boss voice.
export function playPlayerLaugh({voice,bossVoice,itemVoice},options){
 if(!voice.enabled)return false;
 bossVoice.stop();itemVoice.stop();return voice.laugh(options);
}
export function requestBossCue({voice,bossVoice,itemVoice},event){
 if(voice.playing)return false;
 const accepted=bossVoice.request(event.kind,event.skill,event.owner);
 if(accepted||bossVoice.current)itemVoice.stop();
 return accepted;
}
// The generic 'room' event also refreshes loot/resources. Only a real room
// transition should cancel speech; otherwise a coin pickup clips a voice line.
export function createRoomVoiceBoundary({bossVoice,itemVoice}){
 let previous;
 return room=>{if(room===previous)return false;previous=room;bossVoice.stop();itemVoice.stop();return true};
}
// The sound switch itself is silent. Revival owns the media session while its
// ten-second clock runs; priming other clips here can interrupt mobile playback.
export function setGameSound(enabled,{voice,bossVoice,itemVoice,soundMix},reviving=false){
 soundMix.setEnabled(enabled);voice.setEnabled(enabled);bossVoice.setEnabled(enabled);itemVoice.setEnabled(enabled);
 if(enabled&&!reviving){voice.unlock();bossVoice.unlock();itemVoice.unlock()}
}
