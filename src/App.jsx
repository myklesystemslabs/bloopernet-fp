import React, { useState, useEffect } from 'react';
import { useFireproof } from 'use-fireproof';
import { ConnectS3 } from '@fireproof/aws'
import { ConnectPartyKit } from '@fireproof/partykit'

import PatternSet from './components/PatternSet';
import TopControls from './components/TopControls';
import { TimesyncProvider } from './TimesyncContext';
import './App.css';

const partyCxs = new Map();
function partykitS3({ name, blockstore }, partyHost, refresh) {
  if (!name) throw new Error('database name is required')
  if (!refresh && partyCxs.has(name)) {
    return partyCxs.get(name)
  }
  const s3conf = { // example values, replace with your own by deploying https://github.com/fireproof-storage/valid-cid-s3-bucket
    upload: 'https://04rvvth2b4.execute-api.us-east-2.amazonaws.com/uploads',
    download: 'https://sam-app-s3uploadbucket-e6rv1dj2kydh.s3.us-east-2.amazonaws.com'
  }
  const s3conn = new ConnectS3(s3conf.upload, s3conf.download, '')
  s3conn.connectStorage(blockstore)

  if (!partyHost) {
    console.warn('partyHost not provided, using localhost:1999')
    partyHost = 'http://localhost:1999'
  }
  const connection = new ConnectPartyKit({ name, host: partyHost })
  connection.connectMeta(blockstore)
  partyCxs.set(name, connection)
  return connection
}


function App() {
  const instruments = ['Kick', 'Snare', 'Hi-hat', 'Tom', 'Clap'];
  //const { database } = useFireproof("fireproof", {public: true});
  const { database, useLiveQuery } = useFireproof("drum-machine");
  //const partyKitHost = import.meta.env.VITE_REACT_APP_PARTYKIT_HOST;
  const partyKitHost = "https://cursor-drum-test-party.myklemykle.partykit.dev";

  const connection = partykitS3(database, partyKitHost);
  console.log("Connection", connection);


  let beats = {};
  const result = useLiveQuery('type', { key: 'beat' });
  result.rows.forEach(row => {
    beats[row.doc._id] = row.doc.isActive;
  });

  const updateBeat = async (id, instrumentName, beatIndex, isActive) => {
    const doc = await database.get(id).catch(error => {
      if (error.message.includes('Not found')) {
        return {
          _id: id,
          type: 'beat',
          isActive: isActive,
          instrumentName: instrumentName,
          beatIndex: beatIndex
        };
      } else {
        throw error;
      }
    })
    await database.put({ ...doc, isActive });
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
        <TopControls updateBPM={updateBPM} />
        <PatternSet instruments={instruments} beats={beats} updateBeat={updateBeat} />
      </div>
    </TimesyncProvider>
  );
}

export default App;
