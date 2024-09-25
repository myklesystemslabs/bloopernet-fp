import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import BeatButton from './BeatButton';
import { loadSound, playSoundBuffer } from '../audioUtils';

const Pattern = ({ instrumentName }) => {
  const [beatStates, setBeatStates] = useState(Array(16).fill(false));
  const [soundBuffer, setSoundBuffer] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleBeatToggle = (index) => {
    const newBeatStates = [...beatStates];
    newBeatStates[index] = !newBeatStates[index];
    setBeatStates(newBeatStates);
  };

  useEffect(() => {
    const loadInstrumentSound = async () => {
      try {
        const buffer = await loadSound(`/sounds/${instrumentName.toLowerCase()}.wav`);
        setSoundBuffer(buffer);
      } catch (error) {
        console.error(`Failed to load sound for ${instrumentName}:`, error);
      }
    };
    loadInstrumentSound();
  }, [instrumentName]);

  const playSound = () => {
    if (soundBuffer) {
      playSoundBuffer(soundBuffer);
    } else {
      console.log(`Sound for ${instrumentName} not loaded yet`);
    }
  };


  const renderBeatButtons = () => {
    if (isMobile) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex' }}>
            {beatStates.slice(0, 8).map((isActive, index) => (
              <BeatButton
                key={index}
                instrumentName={instrumentName}
                beatIndex={index}
              />
            ))}
          </Box>
          <Box sx={{ display: 'flex' }}>
            {beatStates.slice(8).map((isActive, index) => (
              <BeatButton
                key={index + 8}
                instrumentName={instrumentName}
                beatIndex={index + 8}
              />
            ))}
          </Box>
        </Box>
      );
    } else {
      return (
        <Box sx={{ display: 'flex' }}>
          {beatStates.map((isActive, index) => (
            <BeatButton
              key={index}
              instrumentName={instrumentName}
              beatIndex={index}
            />
          ))}
        </Box>
      );
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: isMobile ? 'flex-start' : 'center', 
      marginBottom: 2,
      gap: 2 
    }}>
      <div style={{ width: '100px', marginRight: '10px' }}>
        <button onClick={playSound}>{instrumentName}</button>
      </div>
      {/* <Typography 
        variant="body1" 
        sx={{ 
          width: isMobile ? 'auto' : 80,
          textAlign: isMobile ? 'left' : 'right',
          fontWeight: 'bold',
          marginBottom: isMobile ? 1 : 0
        }}
      >
        {instrumentName}
      </Typography> */}
      {renderBeatButtons()}
    </Box>
  );
};

export default Pattern;
