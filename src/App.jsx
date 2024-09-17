import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import PatternSet from './components/PatternSet';
import './App.css';

function App() {
  const instruments = ['Kick', 'Snare', 'Hi-hat', 'Tom', 'Clap'];

  return (
    <Box sx={{ textAlign: 'center', padding: '20px' }}>
      <Typography variant="h3" gutterBottom>
        Loopernet 🦆⚡
      </Typography>
      <PatternSet instruments={instruments} />
    </Box>
  );
}

export default App;
