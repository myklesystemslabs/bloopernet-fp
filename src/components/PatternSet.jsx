import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useFireproof } from 'use-fireproof';
import { useTimesync } from '../TimesyncContext';
import Pattern from './Pattern';
import './PatternSet.css';

const DEFAULT_INSTRUMENTS = ['Kick', 'Snare', 'Hi-hat', 'Tom', 'Clap'];

const PatternSet = ({ dbName, beats }) => {
  const ts = useTimesync();
  const [elapsedQuarterBeats, setElapsedQuarterBeats] = useState(0);

  // Fetch the BPM document from the database
  const { database, useLiveQuery } = useFireproof(dbName);
  const bpmResult = useLiveQuery('type', { key: 'bpm' });
  const bpmDoc = bpmResult.rows[0]?.doc;
  
  // Extract BPM, lastChanged, and playing from the query result
  const bpm = bpmDoc?.bpm || 120;
  const lastChanged_ms = bpmDoc?.lastChanged_ms || (ts ? ts.now() : Date.now()); // Use timesync for default value if available
  const playing = bpmDoc?.playing || false;
  const prevQuarterBeats = bpmDoc?.prevQuarterBeats || 0;


  // Fetch instruments from the database
  const dbInstruments = useLiveQuery('type', { key: 'instrument' });

  // Combine default and database instruments, sort by creation date
  const instruments = useMemo(() => {
    const defaultInstruments = DEFAULT_INSTRUMENTS.map(name => ({
      id: name.toLowerCase(),
      name,
      createdAt: new Date(0), // Ensure default instruments appear last
      audioFile: `/sounds/${name.toLowerCase()}.wav`
    }));

    const allInstruments = [
      ...dbInstruments.rows.map(row => ({
        id: row.doc._id,
        name: row.doc.name,
        createdAt: new Date(row.doc.createdAt),
        audioFile: row.doc.audioFile
      })),
      ...defaultInstruments
    ];

    return allInstruments.sort((a, b) => b.createdAt - a.createdAt);
  }, [dbInstruments]);

  const calculateElapsedQuarterBeats = useCallback(() => {
    if (!ts){console.warn("no timesync"); return 0;}
    if (!ts || !bpm || !lastChanged_ms || !playing) return 0;
    const currentTime_ms = ts.now();
    const elapsedTime_ms = currentTime_ms - lastChanged_ms;
    const elapsedQuarterBeats = Math.floor((elapsedTime_ms / 60000) * bpm * 4) + prevQuarterBeats; // 60000 ms in a minute, 4 quarter beats per beat
    // console.log("elapsedQuarterBeats: ", elapsedQuarterBeats);
    if (elapsedQuarterBeats == 0){
      console.log("elapsedQuarterBeats is 0");
    } 
    return elapsedQuarterBeats;
  }, [ts, bpm, lastChanged_ms, playing, prevQuarterBeats]);

  useEffect(() => {
    if (playing) {
      const intervalId = setInterval(() => {
        setElapsedQuarterBeats(calculateElapsedQuarterBeats());
      }, 1000/ (4 * (bpm/60) ) ); // Update 4x per quarter beat
      return () => clearInterval(intervalId);
    } else {
      setElapsedQuarterBeats(0);
    }
  }, [playing, calculateElapsedQuarterBeats]);

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


  //////////////////////////////////////////////////////////////////////////////
  // Manage track settings in local storage
  const [trackSettings, setTrackSettings] = useState({});

  useEffect(() => {
    // Load track settings from local storage
    const storedSettings = JSON.parse(localStorage.getItem('trackSettings')) || {};
    setTrackSettings(storedSettings);
  }, []);

  const updateTrackSetting = useCallback((instrumentId, setting, value) => {
    setTrackSettings(prev => {
      const updated = {
        ...prev,
        [instrumentId]: {
          ...prev[instrumentId],
          [setting]: value
        }
      };
      localStorage.setItem('trackSettings', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleMuteToggle = useCallback((instrumentId) => {
    updateTrackSetting(instrumentId, 'muted', !trackSettings[instrumentId]?.muted);
  }, [trackSettings, updateTrackSetting]);

  const handleSoloToggle = useCallback((instrumentId) => {
    updateTrackSetting(instrumentId, 'soloed', !trackSettings[instrumentId]?.soloed);
  }, [trackSettings, updateTrackSetting]);

  const anyTrackSoloed = Object.values(trackSettings).some(track => track.soloed);

  const handleNameChange = useCallback(async (instrumentId, newName) => {
    const instrument = instruments.find(i => i.id === instrumentId);
    if (instrument) {
      if (DEFAULT_INSTRUMENTS.includes(instrument.name)) {
        console.warn("Cannot rename default instruments");
        return;
      }
      const doc = await database.get(instrumentId);
      await database.put({
        ...doc,
        name: newName
      });
    }
  }, [database, instruments]);

  return (
    <div className="pattern-set">
      {instruments.map((instrument) => (
        <Pattern
          key={instrument.id}
          instrument={instrument.name}
          instrumentId={instrument.id}
          audioFile={instrument.audioFile}
          beats={beats}
          updateBeat={updateBeat}
          bpmDoc={bpmDoc}
          elapsedQuarterBeats={elapsedQuarterBeats}
          isMuted={trackSettings[instrument.id]?.muted || false}
          isSolo={trackSettings[instrument.id]?.soloed || false}
          onMuteToggle={() => handleMuteToggle(instrument.id)}
          onSoloToggle={() => handleSoloToggle(instrument.id)}
          anyTrackSoloed={anyTrackSoloed}
          onNameChange={handleNameChange}
        />
      ))}
    </div>
  );
};

export default PatternSet;
