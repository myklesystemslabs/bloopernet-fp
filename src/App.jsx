import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import PatternSet from './components/PatternSet';
import TopControls from './components/TopControls';
import { useFireproof } from 'use-fireproof';
import { connect } from '@fireproof/partykit';
import './App.css';

function App() {
  const instruments = ['Kick', 'Snare', 'Hi-hat', 'Tom', 'Clap'];
  const { database } = useFireproof();
  window.myfireproofDB = database;

  // Connect to PartyKit
  React.useEffect(() => {
    const connectToPartyKit = async () => {
      // if (isConnectedRef.current) {
      if (window.fireproofIsConnected) {
        console.log('Already connected, skipping...');
        return; // Prevent multiple connections
      }

      //const partyKitHost = import.meta.env.VITE_REACT_APP_PARTYKIT_HOST;
      const partyKitHost = "https://cursor-drum-test-party.myklemykle.partykit.dev"
      if (!partyKitHost) {
        console.error('PartyKit host not set. Please check your .env file.');
        return;
      }

      console.log('PartyKit Host:', partyKitHost);  // Debug log
      try {
        const connection = connect.partykit(database, partyKitHost, {
          onConnect: () => console.log("Connected to PartyKit server"),
          onDisconnect: () => console.log("Disconnected from PartyKit server"),
          onMessage: (message) => console.log("Received message from PartyKit:", message),
          onSend: (message) => console.log("Sending message to PartyKit:", message),
        });

        console.log('PartyKit connection established:', connection);
        window.fireproofIsConnected = true;
      } catch (error) {
        console.error('Failed to connect to PartyKit:', error);
      }
    };

    connectToPartyKit();
  }, [database]);

  return (
    <Box sx={{ textAlign: 'center', padding: '20px' }}>
      <Typography variant="h3" gutterBottom>
        Loopernet Demo 🦆⚡
      </Typography>
      <TopControls />
      <PatternSet instruments={instruments} />
    </Box>
  );
}

export default App;
