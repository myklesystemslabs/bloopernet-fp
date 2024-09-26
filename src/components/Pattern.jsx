import React, { useEffect, useState, useCallback } from 'react';
import BeatButton from './BeatButton';
import { loadSound, playSoundBuffer } from '../audioUtils';
import { useTimesync } from '../TimesyncContext';
import './Pattern.css'; // We'll create this CSS file

const Pattern = ({ instrument, beats, updateBeat, bpm, lastChanged }) => {
  const [soundBuffer, setSoundBuffer] = useState(null);
  const ts = useTimesync(); // Access the timesync object
  const [currentQuarterBeat, setCurrentQuarterBeat] = useState(0);
  const [beatTrigger, setBeatTrigger] = useState(0); // New state to trigger re-renders
  const patternLength = 16; // 16 beats * 4 quarters per beat

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

  const calculateCurrentQuarterBeat = useCallback(() => {
    if (!ts || !bpm || !lastChanged) return 0;
    const currentTime = ts.now();
    const elapsedTime = (currentTime - lastChanged) / 1000; // Convert to seconds
    const beatsElapsed = (elapsedTime / 60) * bpm;
    const quarterBeatsElapsed = beatsElapsed * 4; // Multiply by 4 for quarter beats
    const absoluteQuarterBeat = Math.floor(quarterBeatsElapsed);
    return absoluteQuarterBeat % patternLength;
  }, [ts, bpm, lastChanged, patternLength]);

  useEffect(() => {
    if (!ts || !bpm || !lastChanged) return;

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
  }, [ts, bpm, lastChanged, calculateCurrentQuarterBeat]);

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
            isCurrent={index === currentQuarterBeat}
            updateBeat={updateBeat}
          />
        ))}
      </div>
    </div>
  );
};

export default Pattern;
