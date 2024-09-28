import WAAClock from 'waaclock';

let audioContext = null;
let clock = null;

export const getAudioContext = () => {
  if (!audioContext) {
    console.log("getAudioContext");
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    clock = new WAAClock(audioContext);
    clock.start();
  }
  return audioContext;
};

export const loadSound = async (url) => {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return await getAudioContext().decodeAudioData(arrayBuffer);
};

export const playSoundBuffer = (buffer) => {
  const source = getAudioContext().createBufferSource();
  source.buffer = buffer;
  source.connect(getAudioContext().destination);
  source.start();
};

export const scheduleBeat = (soundBuffer, audioTime_s) => {
  let ctxtime = getAudioContext().currentTime;
  if (audioTime_s > ctxtime) {
    const event = clock.callbackAtTime(() => {
      const source = getAudioContext().createBufferSource();
      source.buffer = soundBuffer;
      source.connect(getAudioContext().destination);
      source.start();
    }, audioTime_s);
    console.log("scheduled beat ", audioTime_s - ctxtime, " seconds from now");
    return event;
  } else {
    console.log("too late to schedule beat");
  }
};

export const clearScheduledEvents = (events) => {
  events.forEach(event => event.clear());
};
