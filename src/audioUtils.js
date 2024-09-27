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

export const scheduleBeats = (instrument, soundBuffer, beats, bpm, playing, nextQuarterBeatStart_ms, scheduleStart_s, quarterBeatsToSchedule = 1) => {
  if (!clock || !soundBuffer || !playing) return [];

  const secondsPerQuarterBeat_s = 15 / bpm;
  const scheduledEvents = [];

  for (let i = 0; i < quarterBeatsToSchedule; i++) {
    const quarterBeatIndex = (Math.floor(nextQuarterBeatStart_ms / (secondsPerQuarterBeat_s * 1000)) + i) % 16;
    if (beats[`beat-${instrument.toLowerCase()}-${quarterBeatIndex}`]) {
      const beatTime_ms = nextQuarterBeatStart_ms + (i * secondsPerQuarterBeat_s * 1000);
      const audioTime_s = scheduleStart_s + (beatTime_ms - nextQuarterBeatStart_ms) / 1000;
      
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
