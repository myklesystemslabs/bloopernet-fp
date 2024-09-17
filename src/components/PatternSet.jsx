import React from 'react';
import Box from '@mui/material/Box';
import Pattern from './Pattern';

const PatternSet = ({ instruments }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {instruments.map((instrument, index) => (
        <Pattern key={index} instrumentName={instrument} />
      ))}
    </Box>
  );
};

export default PatternSet;
