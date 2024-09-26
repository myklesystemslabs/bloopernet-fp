import React, { useEffect, useState, useCallback, useRef } from 'react';
import BeatButton from './BeatButton';
import { loadSound, scheduleBeats, clearScheduledEvents, playSoundBuffer, getAudioContext } from '../AudioUtils';
import { useTimesync } from '../TimesyncContext';
import './Pattern.css';

const Pattern = ({ instrument, beats, updateBeat, bpm, lastChanged_ms, playing }) => {
  const [soundBuffer, setSoundBuffer] = useState(null);
  const ts = useTimesync();
  const [currentQuarterBeat, setCurrentQuarterBeat] = useState(0);
  const [beatTrigger, setBeatTrigger] = useState(0);
  const patternLength = 16; // 16 quarter beats = 4 full beats
  const scheduledEventsRef = useRef([]);
  const audioContextStartTime_s = useRef(null);
  const timesyncStartTime_ms = useRef(null);

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

  const scheduleNextPattern = useCallback(() => {
    if (!soundBuffer || !playing || !ts || audioContextStartTime_s.current === null || timesyncStartTime_ms.current === null) return;

    const currentTimesyncTime_ms = ts.now();
    const elapsedTimesyncTime_ms = currentTimesyncTime_ms - timesyncStartTime_ms.current;
    const currentAudioTime_s = audioContextStartTime_s.current + (elapsedTimesyncTime_ms / 1000);

    const patternDuration_s = (60 / bpm) * 4; // Duration of 4 beats in seconds
    const patternDuration_ms = patternDuration_s * 1000;
    const nextPatternStart_ms = Math.ceil(currentTimesyncTime_ms / patternDuration_ms) * patternDuration_ms;

    //clearScheduledEvents(scheduledEventsRef.current);
    scheduledEventsRef.current = scheduleBeats(
      instrument,
      soundBuffer,
      beats,
      bpm,
      playing,
      nextPatternStart_ms,
      currentAudioTime_s + ((nextPatternStart_ms - currentTimesyncTime_ms) / 1000)
    );
  }, [instrument, soundBuffer, beats, bpm, playing, ts]);

  useEffect(() => {
    if (playing) {
      scheduleNextPattern();
      const intervalDuration_ms = (60 / bpm) * 1000 * 4;
      const intervalId = setInterval(scheduleNextPattern, intervalDuration_ms);
      return () => clearInterval(intervalId);
    }
  }, [playing, scheduleNextPattern, bpm]);

  const calculateCurrentQuarterBeat = useCallback(() => {
    if (!ts || !bpm || !lastChanged_ms || !playing) return 0;
    const currentTime_ms = ts.now();
    const elapsedTime_ms = currentTime_ms - lastChanged_ms;
    const quarterBeatsElapsed = (elapsedTime_ms / 60000) * bpm * 4; // 60000 ms in a minute
    const absoluteQuarterBeat = Math.floor(quarterBeatsElapsed);
    return absoluteQuarterBeat % patternLength;
  }, [ts, bpm, lastChanged_ms, patternLength, playing]);

  useEffect(() => {
    if (!ts || !bpm || !lastChanged_ms || !playing) {
      setCurrentQuarterBeat(0);
      return;
    }

    const quarterBeatInterval_ms = 15000 / bpm;
    let lastQuarterBeat = -1;

    const checkBeat = () => {
      const newQuarterBeat = calculateCurrentQuarterBeat();
      if (newQuarterBeat !== lastQuarterBeat) {
        setCurrentQuarterBeat(newQuarterBeat);
        setBeatTrigger(prev => prev + 1); // Increment to trigger re-render
        lastQuarterBeat = newQuarterBeat;
      }
    };

    const intervalId = setInterval(checkBeat, quarterBeatInterval_ms / 2);

    return () => clearInterval(intervalId);
  }, [ts, bpm, lastChanged_ms, calculateCurrentQuarterBeat, playing]);

  const playSound = () => {
    if (soundBuffer) {
      playSoundBuffer(soundBuffer);
    } else {
      console.log(`Sound for ${instrument} not loaded yet`);
    }
  };

  console.log(`painting ${instrument} ${currentQuarterBeat}`);

  return (
    <div className="pattern">
      <button className="instrument-button" onClick={playSound}>{instrument}</button>
      <div className="beat-buttons">
        {Array(patternLength).fill().map((_, index) => (
          <BeatButton 
            key={index} 
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
