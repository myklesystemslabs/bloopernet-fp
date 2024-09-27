import React, { useEffect, useState, useCallback, useRef } from 'react';
import BeatButton from './BeatButton';
import { loadSound, scheduleBeats, clearScheduledEvents, playSoundBuffer, getAudioContext } from '../AudioUtils';
import { useTimesync } from '../TimesyncContext';
import './Pattern.css';

const Pattern = ({ instrument, beats, updateBeat, bpm, lastChanged_ms, playing, elapsedQuarterBeats }) => {
  const [soundBuffer, setSoundBuffer] = useState(null);
  const ts = useTimesync();
  const patternLength = 16; // 16 quarter beats = 4 full beats
  const scheduledEventsRef = useRef([]);
  const audioContextStartTime_s = useRef(null);
  const timesyncStartTime_ms = useRef(null);

  const currentQuarterBeat = elapsedQuarterBeats % patternLength;

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
    if (playing) {
      audioContextStartTime_s.current = getAudioContext().currentTime;
      timesyncStartTime_ms.current = ts.now();
    } else {
      audioContextStartTime_s.current = null;
      timesyncStartTime_ms.current = null;
    }
  }, [playing, ts]);

  const scheduleNextQuarterBeat = useCallback(() => {
    if (!soundBuffer || !playing || !ts || audioContextStartTime_s.current === null || timesyncStartTime_ms.current === null) return;

    const currentTimesyncTime_ms = ts.now();
    const elapsedTimesyncTime_ms = currentTimesyncTime_ms - timesyncStartTime_ms.current;
    const currentAudioTime_s = audioContextStartTime_s.current + (elapsedTimesyncTime_ms / 1000);

    const quarterBeatDuration_s = 15 / bpm;
    const quarterBeatDuration_ms = quarterBeatDuration_s * 1000;
    const nextQuarterBeatStart_ms = Math.ceil(currentTimesyncTime_ms / quarterBeatDuration_ms) * quarterBeatDuration_ms;

    clearScheduledEvents(scheduledEventsRef.current);
    scheduledEventsRef.current = scheduleBeats(
      instrument,
      soundBuffer,
      beats,
      bpm,
      playing,
      nextQuarterBeatStart_ms,
      currentAudioTime_s + ((nextQuarterBeatStart_ms - currentTimesyncTime_ms) / 1000),
      1 // Schedule 1 quarter beat ahead
    );

  }, [instrument, soundBuffer, beats, bpm, playing, ts]);

  useEffect(() => {
    if (playing) {
      const quarterBeatInterval_ms = (15 / bpm) * 1000; // Duration of one quarter beat in milliseconds
      const intervalId = setInterval(scheduleNextQuarterBeat, quarterBeatInterval_ms);
      return () => clearInterval(intervalId);
    }
  }, [playing, scheduleNextQuarterBeat, bpm]);

  const playSound = () => {
    if (soundBuffer) {
      playSoundBuffer(soundBuffer);
    } else {
      console.log(`Sound for ${instrument} not loaded yet`);
    }
  };

  return (
    <div className="pattern">
      <button className="instrument-button" onClick={playSound}>{instrument}</button>
      <div className="beat-buttons">
        {Array.from({ length: patternLength }, (_, index) => (
          <BeatButton 
            key={`${instrument}-${index}`} 
            instrumentName={instrument} 
            beatIndex={index} 
            isActive={beats[`beat-${instrument.toLowerCase()}-${index}`] || false}
            isCurrent={playing && index === currentQuarterBeat}
            updateBeat={updateBeat}
          />
        ))}
      </div>
    </div>
  );
};

export default Pattern;
