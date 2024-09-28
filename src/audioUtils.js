import WAAClock from 'waaclock';

let audioContext = null;
let clock = null;
let masterGainNode = null;
let silenceBuffer = null;
let isMuted = true;

export const getAudioContext = () => {
  if (!audioContext) {
    console.log("getAudioContext");
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    clock = new WAAClock(audioContext);
    clock.start();
    
    // Create master gain node
    masterGainNode = audioContext.createGain();
    masterGainNode.connect(audioContext.destination);
    masterGainNode.gain.setValueAtTime(0, audioContext.currentTime); // Start muted
  }
  return audioContext;
};

export const loadSilenceBuffer = async () => {
  if (!silenceBuffer) {
    try {
      silenceBuffer = await loadSound('/sounds/silence.wav');
    } catch (error) {
      console.error('Failed to load silence.wav:', error);
    }
  }
};

export const setMasterMute = async (mute) => {
  isMuted = mute;
  const ctx = getAudioContext();

  if (!isMuted) { // Unmuting
    // Ensure audio context is running
    await ctx.resume();

    // Play silent buffer to trigger audio
    if (!silenceBuffer) {
      await loadSilenceBuffer();
    }
    if (silenceBuffer) {
      playSoundBuffer(silenceBuffer);
    }

    // Short delay to allow audio to initialize
    setTimeout(() => {
      masterGainNode.gain.setValueAtTime(1, ctx.currentTime);
    }, 50);
  } else { // Muting
    masterGainNode.gain.setValueAtTime(0, ctx.currentTime);
  }
};

export const isMasterMuted = () => isMuted;

export const loadSound = async (url) => {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return await getAudioContext().decodeAudioData(arrayBuffer);
};

export const playSoundBuffer = (buffer) => {
  const source = getAudioContext().createBufferSource();
  source.buffer = buffer;
  source.connect(masterGainNode);
  source.start();
};

export const scheduleBeat = (soundBuffer, audioTime_s) => {
  let ctxtime = getAudioContext().currentTime;
  if (audioTime_s > ctxtime) {
    const event = clock.callbackAtTime(() => {
      const source = getAudioContext().createBufferSource();
      source.buffer = soundBuffer;
      source.connect(masterGainNode);
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
