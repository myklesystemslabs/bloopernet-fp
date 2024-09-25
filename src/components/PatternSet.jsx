import React from 'react';
import Box from '@mui/material/Box';
import Pattern from './Pattern';

const PatternSet = ({ instruments, beats, updateBeat }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {instruments.map((instrument, index) => (
        <Pattern 
        key={instrument} 
        instrument={instrument} 
        beats={beats} 
        updateBeat={updateBeat}
      />
      ))}
    </Box>
  );
};

export default PatternSet;
