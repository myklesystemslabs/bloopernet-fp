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

export const scheduleBeats = (instrument, soundBuffer, beats, bpm, playing) => {
  if (!clock || !soundBuffer || !playing) return [];

  const secondsPerQuarterBeat = 15 / bpm;
  const currentTime = getAudioContext().currentTime;
  const patternLength = 16;

  const scheduledEvents = [];

  for (let i = 0; i < patternLength; i++) {
    if (beats[`beat-${instrument.toLowerCase()}-${i}`]) {
      const beatTime = currentTime + (i * secondsPerQuarterBeat);
      const event = clock.callbackAtTime(() => {
        const source = getAudioContext().createBufferSource();
        source.buffer = soundBuffer;
        source.connect(getAudioContext().destination);
        source.start();
      }, beatTime);
      scheduledEvents.push(event);
    }
  }

  return scheduledEvents;
};

export const clearScheduledEvents = (events) => {
  events.forEach(event => event.clear());
};
