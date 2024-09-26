import React, { useEffect, useState, useCallback, useRef } from 'react';
import BeatButton from './BeatButton';
import { loadSound, scheduleBeats, clearScheduledEvents, playSoundBuffer } from '../AudioUtils';
import { useTimesync } from '../TimesyncContext';
import './Pattern.css';

const Pattern = ({ instrument, beats, updateBeat, bpm, lastChanged, playing }) => {
  const [soundBuffer, setSoundBuffer] = useState(null);
  const ts = useTimesync(); // Access the timesync object
  const [currentQuarterBeat, setCurrentQuarterBeat] = useState(0);
  const [beatTrigger, setBeatTrigger] = useState(0);
  const patternLength = 16; // 16 quarter beats = 4 full beats
  const scheduledEventsRef = useRef([]);

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

  const scheduleNextPattern = useCallback(() => {
    if (!soundBuffer || !playing) return;

    clearScheduledEvents(scheduledEventsRef.current);
    scheduledEventsRef.current = scheduleBeats(instrument, soundBuffer, beats, bpm, playing);
  }, [instrument, soundBuffer, beats, bpm, playing]);

  useEffect(() => {
    if (playing) {
      scheduleNextPattern();
      // Schedule every 4 beats (16 quarter beats)
      const intervalId = setInterval(scheduleNextPattern, (60 / bpm) * 1000 * 4);
      return () => clearInterval(intervalId);
    }
  }, [playing, scheduleNextPattern, bpm]);

  const calculateCurrentQuarterBeat = useCallback(() => {
    if (!ts || !bpm || !lastChanged || !playing) return 0;
    const currentTime = ts.now();
    const elapsedTime = (currentTime - lastChanged) / 1000; // Convert to seconds
    const quarterBeatsElapsed = (elapsedTime / 60) * bpm * 4; // Multiply by 4 for quarter beats
    const absoluteQuarterBeat = Math.floor(quarterBeatsElapsed);
    return absoluteQuarterBeat % patternLength;
  }, [ts, bpm, lastChanged, patternLength, playing]);

  useEffect(() => {
    if (!ts || !bpm || !lastChanged || !playing) {
      setCurrentQuarterBeat(0);
      return;
    }

    const quarterBeatInterval = 15000 / bpm; // Calculate milliseconds per quarter beat
    let lastQuarterBeat = -1;

    const checkBeat = () => {
      const newQuarterBeat = calculateCurrentQuarterBeat();
      if (newQuarterBeat !== lastQuarterBeat) {
        setCurrentQuarterBeat(newQuarterBeat);
        setBeatTrigger(prev => prev + 1); // Increment to trigger re-render
        lastQuarterBeat = newQuarterBeat;
      }
    };

    const intervalId = setInterval(checkBeat, quarterBeatInterval / 2); // Check twice per quarter beat

    return () => clearInterval(intervalId);
  }, [ts, bpm, lastChanged, calculateCurrentQuarterBeat, playing]);

  const playSound = () => {
    if (soundBuffer) {
      playSoundBuffer(soundBuffer);
    } else {
      console.log(`Sound for ${instrument} not loaded yet`);
    }
  };

  // Log for debugging
  //console.log(`Pattern ${instrument} rendering. Quarter Beat: ${currentQuarterBeat}, Trigger: ${beatTrigger}`);

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
