import React, { useEffect, useState, useCallback, useRef } from 'react';
import BeatButton from './BeatButton';
import { loadSound, clearScheduledEvents, playSoundBuffer, getAudioContext, scheduleBeat, getHeadStart_ms } from '../audioUtils';
import { useTimesync } from '../TimesyncContext';
import './Pattern.css';

const Pattern = ({ instrument, beats, updateBeat, bpmDoc, elapsedQuarterBeats }) => {
  const [soundBuffer, setSoundBuffer] = useState(null);
  const [wasPlaying, setWasPlaying] = useState(false);
  const ts = useTimesync();
  const patternLength = 16; // 16 quarter beats = 4 full beats
  const scheduledEventsRef = useRef([]);
  const timesyncStartTime_ms = useRef(null);

  // used for decorating buttons
  const currentQuarterBeat = (elapsedQuarterBeats) % patternLength;

  const bpm = bpmDoc?.bpm || 120;
  const playing = bpmDoc?.playing || false;

  const scheduleBeats = useCallback((nextQuarterBeatStart_ms, scheduleStart_s, quarterBeatsToSchedule = 1, startBeatNumber = 0) => {
    if (!soundBuffer || !playing) return [];

    const secondsPerQuarterBeat_s = 15 / bpm;
    const scheduledEvents = [];

    let nextBeatNumber = (startBeatNumber) % patternLength;
    for (let i = 0; i < quarterBeatsToSchedule; i++) {
      if (beats[`beat-${instrument.toLowerCase()}-${nextBeatNumber}`]) {
        const beatTime_ms = nextQuarterBeatStart_ms + (i * secondsPerQuarterBeat_s * 1000);
        const audioTime_s = scheduleStart_s + (beatTime_ms - nextQuarterBeatStart_ms) / 1000;
        
        // if (instrument === "Kick") {
        //   console.log("scheduling beat ", nextBeatNumber, " at time ", audioTime_s);
        // }
        const event = scheduleBeat(soundBuffer, audioTime_s);
        scheduledEvents.push(event);
      }
      nextBeatNumber = (nextBeatNumber + 1) % patternLength;
    }

    return scheduledEvents;
  }, [instrument, soundBuffer, beats, bpm, playing]);

  const scheduleNextQuarterBeat = useCallback(() => {
    if (!soundBuffer || !playing || !ts || timesyncStartTime_ms.current === null) return;

    const currentTimesyncTime_ms = ts.now();
    const elapsedTimesyncTime_ms = currentTimesyncTime_ms - timesyncStartTime_ms.current;
    const currentAudioTime_s = getAudioContext().currentTime;

    const quarterBeatDuration_s = 15 / bpm;
    const quarterBeatDuration_ms = quarterBeatDuration_s * 1000;

    // Calculate the next quarter beat start time
    const nextQuarterBeatNumber = Math.ceil((elapsedTimesyncTime_ms + getHeadStart_ms()) / quarterBeatDuration_ms);
    const nextQuarterBeatStart_ms = nextQuarterBeatNumber * quarterBeatDuration_ms;

    // relative time to schedule
    const relativeTimeToSchedule_ms = nextQuarterBeatStart_ms - elapsedTimesyncTime_ms;
    const audioTimeToSchedule_s = currentAudioTime_s + (relativeTimeToSchedule_ms / 1000);

    // if (instrument === "Kick") {
    //   console.log("beat number: ", nextQuarterBeatNumber, " start ms: ", nextQuarterBeatStart_ms);
    //   // console.log("syncDelta_ms: ", syncDelta_ms);
    //   console.log("audioTimeToSchedule_s: ", audioTimeToSchedule_s);
    //   console.log("relativeTimeToSchedule_ms: ", relativeTimeToSchedule_ms);
    // }

    // Only schedule if it's in the future
    if (audioTimeToSchedule_s > currentAudioTime_s) {
      scheduledEventsRef.current = scheduleBeats(
        timesyncStartTime_ms.current + nextQuarterBeatStart_ms,
        audioTimeToSchedule_s,
        1,
        nextQuarterBeatNumber
      );
    } else {
      console.warn("too late to schedule by ", (audioTimeToSchedule_s - currentAudioTime_s), " seconds");
    }

  }, [instrument, soundBuffer, beats, bpm, playing, ts]);
  useEffect(() => {
    const loadInstrumentSound = async () => {
      try {
        const buffer = await loadSound(`/sounds/${instrument.toLowerCase()}.wav`);
        setSoundBuffer(buffer);
      } catch (error) {
        console.error(`Failed to load sound for ${instrument}:`, error);
      }
    };

    loadInstrumentSound();
  }, [instrument]);

  useEffect(() => {
    if (ts && playing && !wasPlaying) {
      console.log("play started");
      setWasPlaying(true);
      // Reset timing references when playback starts
      timesyncStartTime_ms.current = bpmDoc?.lastChanged_ms || ts.now();
      // time between when play started and when we rendered
      const delta_s = (ts.now() - (bpmDoc?.lastChanged_ms || 0)) / 1000;
      // console.log("timesyncStartTime secs: ", timesyncStartTime_ms.current / 1000);

      // // Play the first beat immediately
      // if (soundBuffer && beats[`beat-${instrument.toLowerCase()}-0`]) {
      //   playSoundBuffer(soundBuffer);
      // }

      // Schedule the next beat
      scheduleNextQuarterBeat();
    } else if (!playing && wasPlaying) {
      timesyncStartTime_ms.current = null;
      // Clear any scheduled events when stopping
      clearScheduledEvents(scheduledEventsRef.current);
      scheduledEventsRef.current = [];
      setWasPlaying(false);
    }
  //}, [playing, ts, soundBuffer, beats, instrument, scheduleNextQuarterBeat]);
  }, [playing, ts, soundBuffer, beats, instrument]);


  useEffect(() => {
    if (ts && playing) {
      const quarterBeatInterval_ms = (15 / bpm) * 1000; // Duration of one quarter beat in milliseconds
      const intervalId = setInterval(scheduleNextQuarterBeat, quarterBeatInterval_ms);
      return () => clearInterval(intervalId);
    }
  }, [ts, playing, scheduleNextQuarterBeat, bpm]);

  const playSound = () => {
    if (soundBuffer) {
      playSoundBuffer(soundBuffer);
    } else {
      console.warn(`Sound for ${instrument} not loaded yet`);
    }
  };

  const renderBeatButtons = () => {
    const groups = [];
    for (let i = 0; i < 4; i++) {
      const groupButtons = [];
      for (let j = 0; j < 4; j++) {
        const index = i * 4 + j;
        groupButtons.push(
          <BeatButton 
            key={`${instrument}-${index}`}
            instrumentName={instrument} 
            beatIndex={index} 
            isActive={beats[`beat-${instrument.toLowerCase()}-${index}`] || false}
            isCurrent={playing && index === currentQuarterBeat}
            updateBeat={updateBeat}
            className={`beat-group-${i}`}
          />
        );
      }
      groups.push(
        <div key={`group-${i}`} className="beat-group">
          {groupButtons}
        </div>
      );
    }
    return groups;
  };

  return (
    <div className="pattern">
      <button className="instrument-button" onClick={playSound}>{instrument}</button>
      <div className="beat-buttons">
        {renderBeatButtons()}
      </div>
    </div>
  );
};

export default Pattern;
