import React, { useState, useEffect } from 'react';
import { useFireproof, useLiveQuery } from 'use-fireproof';
import { connect } from '@fireproof/partykit';
import PatternSet from './components/PatternSet';
import TopControls from './components/TopControls';
import { TimesyncProvider } from './TimesyncContext';
import './App.css';

function App() {
  const instruments = ['Kick', 'Snare', 'Hi-hat', 'Tom', 'Clap'];
  const { database } = useFireproof();
  //const partyKitHost = import.meta.env.VITE_REACT_APP_PARTYKIT_HOST;
  const partyKitHost = "https://cursor-drum-test-party.myklemykle.partykit.dev";

  let beats = {};
  const result = useLiveQuery('type', { key: 'beat' });
  result.rows.forEach(row => {
    beats[row.doc._id] = row.doc.isActive;
  });

  // Connect to PartyKit
  useEffect(() => {
    const connectToPartyKit = async () => {
      if (window.fireproofIsConnected) {
        console.log('Already connected, skipping...');
        return; // Prevent multiple connections
      }

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

  const updateBeat = async (id, instrumentName, beatIndex, isActive) => {
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
            isActive: isActive,
            instrumentName: instrumentName,
            beatIndex: beatIndex
          };
        } else {
          throw error;
        }
      }
      
      const updatedDoc = { ...doc, isActive };
      await database.put(updatedDoc);
    } catch (error) {
      console.error('Error updating beat:', error);
    }
  };

  const updateBPM = async (bpm, ts) => {
    if (!ts) {
      console.error('Timesync object not initialized');
      return;
    }

    const timestamp = ts.now();
    const bpmDoc = {
      _id: 'bpm',
      type: 'bpm',
      bpm: bpm,
      lastChanged: timestamp
    };

    try {
      await database.put(bpmDoc);
      console.log('BPM updated:', bpmDoc);
    } catch (error) {
      console.error('Error updating BPM:', error);
    }
  };

  return (
    <TimesyncProvider partyKitHost={partyKitHost}>
      <div className="app">
        <h1 className="app-title">Loopernet Demo</h1>
        <div className="top-controls">
          <TopControls database={database} updateBPM={updateBPM} />
        </div>
        <div className="pattern-set">
          <PatternSet instruments={instruments} beats={beats} updateBeat={updateBeat} />
        </div> 
      </div>
    </TimesyncProvider>
  );
}

export default App;
