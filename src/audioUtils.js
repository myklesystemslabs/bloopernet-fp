import WAAClock from 'waaclock';

let audioContext = null;
let clock = null;
let masterGainNode = null;

export const getAudioContext = () => {
  if (!audioContext) {
    console.log("getAudioContext");
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    clock = new WAAClock(audioContext);
    clock.start();
    
    // Create master gain node
    masterGainNode = audioContext.createGain();
    masterGainNode.connect(audioContext.destination);
  }
  return audioContext;
};

export const getMasterGainNode = () => {
  if (!masterGainNode) {
    getAudioContext(); // This will ensure the master gain node is created
  }
  return masterGainNode;
};

export const setMasterVolume = (volume) => {
  const gainNode = getMasterGainNode();
  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
};

export const loadSound = async (url) => {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return await getAudioContext().decodeAudioData(arrayBuffer);
};

export const playSoundBuffer = (buffer) => {
  const source = getAudioContext().createBufferSource();
  source.buffer = buffer;
  source.connect(getMasterGainNode());
  source.start();
};

export const scheduleBeat = (soundBuffer, audioTime_s) => {
  let ctxtime = getAudioContext().currentTime;
  if (audioTime_s > ctxtime) {
    const event = clock.callbackAtTime(() => {
      const source = getAudioContext().createBufferSource();
      source.buffer = soundBuffer;
      source.connect(getMasterGainNode());
      source.start();
    }, audioTime_s);
    console.log("scheduled beat ", audioTime_s - ctxtime, " seconds from now");
    return event;
  } else {
    console.warn("too late to schedule beat");
  }
};

export const clearScheduledEvents = (events) => {
  events.forEach(event => event.clear());
};
