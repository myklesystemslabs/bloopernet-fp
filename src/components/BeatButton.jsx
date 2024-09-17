import React from 'react';
import Box from '@mui/material/Box';

const BeatButton = ({ isActive, onClick }) => {
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
