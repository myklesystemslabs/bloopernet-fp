import WAAClock from 'waaclock';

let audioContext = null;
let clock = null;

export const getAudioContext = () => {
  if (!audioContext) {
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

export const scheduleBeats = (instrument, soundBuffer, beats, bpm, playing, nextPatternStart_ms, scheduleStart_s) => {
  if (!clock || !soundBuffer || !playing) return [];

  const secondsPerBeat_s = 60 / bpm;
  const patternLength = 16; // 16 quarter beats
  const scheduledEvents = [];

  for (let i = 0; i < patternLength; i++) {
    if (beats[`beat-${instrument.toLowerCase()}-${i}`]) {
      const beatTime_ms = nextPatternStart_ms + (i * secondsPerBeat_s * 250); // 250ms per quarter beat
      const audioTime_s = scheduleStart_s + (beatTime_ms - nextPatternStart_ms) / 1000;
      
      const event = clock.callbackAtTime(() => {
        const source = getAudioContext().createBufferSource();
        source.buffer = soundBuffer;
        source.connect(getAudioContext().destination);
        source.start();
      }, audioTime_s);
      
      scheduledEvents.push(event);
    }
  }

  return scheduledEvents;
};

export const clearScheduledEvents = (events) => {
  events.forEach(event => event.clear());
};
