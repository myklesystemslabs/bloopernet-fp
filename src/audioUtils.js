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

export const scheduleBeats = (instrument, soundBuffer, beats, bpm, playing, nextQuarterBeatStart_ms, scheduleStart_s, quarterBeatsToSchedule = 1, startBeatNumber = 0) => {
  if (!clock || !soundBuffer || !playing) return [];

  const secondsPerQuarterBeat_s = 15 / bpm;
  const scheduledEvents = [];

  let nextBeatNumber = (startBeatNumber + 1) % 16;
  for (let i = 0; i < quarterBeatsToSchedule; i++) {
    if (beats[`beat-${instrument.toLowerCase()}-${nextBeatNumber}`]) {
      const beatTime_ms = nextQuarterBeatStart_ms + (i * secondsPerQuarterBeat_s * 1000);
      const audioTime_s = scheduleStart_s + (beatTime_ms - nextQuarterBeatStart_ms) / 1000;
      
      if (instrument === "Kick") {
        console.log("scheduling beat ", nextBeatNumber, " at time ", audioTime_s);
      }
      const event = scheduleBeat(soundBuffer, audioTime_s);
      scheduledEvents.push(event);
    }
    nextBeatNumber = (nextBeatNumber + 1) % 16;

  }

  return scheduledEvents;
};

export const scheduleBeat = (soundBuffer, audioTime_s) => {
  const event = clock.callbackAtTime(() => {
    const source = getAudioContext().createBufferSource();
    source.buffer = soundBuffer;
    source.connect(getAudioContext().destination);
    source.start();
  }, audioTime_s);
  return event;
};

export const clearScheduledEvents = (events) => {
  events.forEach(event => event.clear());
};
