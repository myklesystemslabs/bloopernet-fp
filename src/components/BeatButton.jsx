import React from 'react';
import Box from '@mui/material/Box';

const BeatButton = ({ isActive, onClick, instrumentName, beatIndex }) => {
  const buttonId = `beat-${instrumentName.toLowerCase().replace(/\s+/g, '-')}-${beatIndex}`;

  return (
    <Box
      onClick={onClick}
      sx={{
        width: 30,
        height: 30,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: '0 2px',
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
        },
      }}
      data-id={buttonId}
      className={`w-8 h-8 rounded-full ${
        isActive ? 'bg-blue-500' : 'bg-gray-300'
      } hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200`}
    >
      <Box
        sx={{
          width: isActive ? 20 : 16,
          height: isActive ? 20 : 16,
          borderRadius: '50%',
          backgroundColor: isActive ? '#ff4136' : '#8B4513',
          transition: 'all 0.2s ease',
        }}
      />
    </Box>
  );
};

export default BeatButton;
