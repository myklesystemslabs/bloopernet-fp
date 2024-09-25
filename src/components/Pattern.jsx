import React, { useEffect, useState } from 'react';
import BeatButton from './BeatButton';
import { loadSound, playSoundBuffer } from '../audioUtils';
import './Pattern.css'; // We'll create this CSS file

const Pattern = ({ instrument, beats, updateBeat }) => {
  const [soundBuffer, setSoundBuffer] = useState(null);

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
        {Array(16).fill().map((_, index) => (
          <BeatButton 
            key={index} 
            instrumentName={instrument} 
            beatIndex={index} 
            isActive={beats[`beat-${instrument.toLowerCase()}-${index}`] || false}
            updateBeat={updateBeat}
          />
        ))}
      </div>
    </div>
  );
};

export default Pattern;
