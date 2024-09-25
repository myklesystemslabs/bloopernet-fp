import React, { useState, useEffect } from 'react';
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
  const [beats, setBeats] = useState({});
  const connectionPromiseRef = React.useRef(null);

  useEffect(() => {
    const fetchBeats = async () => {
      try {
        const result = await database.query('type', { key: 'beat', include_docs: true });
        const beatsObj = {};
        result.rows.forEach(row => {
          beatsObj[row.doc._id] = row.doc.isActive;
        });
        setBeats(beatsObj);
      } catch (error) {
        console.error('Error fetching beats:', error);
      }
    };

    fetchBeats();
  }, [database]);

  // Connect to PartyKit
  useEffect(() => {
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

  const updateBeat = async (id, isActive) => {
    try {
      let doc;
      try {
        doc = await database.get(id);
      } catch (error) {
        if (error.message.includes('Not found')) {
          // Create a new document if it doesn't exist
          doc = {
            _id: id,
            type: 'beat',
            isActive: false,
            instrumentName: id.split('-')[1],
            beatIndex: parseInt(id.split('-')[2])
          };
        } else {
          throw error;
        }
      }
      
      const updatedDoc = { ...doc, isActive };
      await database.put(updatedDoc);
      setBeats(prevBeats => ({ ...prevBeats, [id]: isActive }));
    } catch (error) {
      console.error('Error updating beat:', error);
    }
  };

  return (
    <Box sx={{ textAlign: 'center', padding: '20px' }}>
      <Typography variant="h3" gutterBottom>
        Loopernet Demo
      </Typography>
      <TopControls database={database} setBeats={setBeats} />
      <PatternSet instruments={instruments} beats={beats} updateBeat={updateBeat} />
    </Box>
  );
}

export default App;
