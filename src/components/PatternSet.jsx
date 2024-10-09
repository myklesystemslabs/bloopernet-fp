import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useFireproof } from 'use-fireproof';
import { useTimesync } from '../TimesyncContext';
import Pattern from './Pattern';
import NewTrackForm from './NewTrackForm';
import { v4 as uuidv4 } from 'uuid';
import './PatternSet.css';

const DEFAULT_INSTRUMENTS = ['Kick', 'Snare', 'Hi-hat', 'Tom', 'Clap'];

const PatternSet = ({ dbName, beats, showNewTrackForm, onCancelNewTrack }) => {
  const ts = useTimesync();
  const [elapsedQuarterBeats, setElapsedQuarterBeats] = useState(0);
  const { database, useLiveQuery } = useFireproof(dbName);
  const [trackSettings, setTrackSettings] = useState({});

  // Fetch the BPM document from the database
  const bpmResult = useLiveQuery('type', { key: 'bpm' });
  const bpmDoc = bpmResult.rows[0]?.doc;
  
  // Extract BPM, lastChanged, and playing from the query result
  const bpm = bpmDoc?.bpm || 120;
  const lastChanged_ms = bpmDoc?.lastChanged_ms || (ts ? ts.now() : Date.now()); // Use timesync for default value if available
  const playing = bpmDoc?.playing || false;
  const prevQuarterBeats = bpmDoc?.prevQuarterBeats || 0;

  // Query for all instrument documents
  const instrumentDocs = useLiveQuery('type', { key: 'instrument' });

  // Create a map of instrument records with defaults for missing data
  const instrumentRecords = useMemo(() => {
    const records = {};
    instrumentDocs.rows.forEach(row => {
      records[row.id] = row.doc;
    });

    // Add default records for missing default instruments
    DEFAULT_INSTRUMENTS.forEach(instrument => {
      const id = instrument.toLowerCase();
      if (!records[id]) {
        records[id] = {
          _id: id,
          type: 'instrument',
          name: instrument,
          audioFile: `/samples/${id}.wav`,
          mimeType: 'audio/wav',
          referenceType: 'url',
          createdAt: ts ? ts.now() : Date.now()
        };
      }
    });

    return records;
  }, [instrumentDocs, ts]);

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

  const updateBeat = async (instrumentId, beatIndex, isActive) => {
    const beatId = `beat-${instrumentId}-${beatIndex}`;
    const doc = await database.get(beatId).catch(error => {
      if (error.message.includes('Not found')) {
        return {
          _id: beatId,
          type: 'beat',
          isActive: isActive,
          instrumentId: instrumentId,
          beatIndex: beatIndex
        };
      } else {
        throw error;
      }
    });
    await database.put({ ...doc, isActive });
  };


  //////////////////////////////////////////////////////////////////////////////
  // Manage track settings in local storage

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

  
  const handleSubmitNewTrack = useCallback(async (newTrack) => {
    const newId = `${newTrack.name.toLowerCase()}-${uuidv4()}`;
    const doc = {
      _id: newId,
      type: 'instrument',
      name: newTrack.name,
      mimeType: newTrack.mimeType,
      referenceType: newTrack.referenceType,
      createdAt: ts.now()
    };

    if (newTrack.referenceType === 'url') {
      doc.audioFile = newTrack.audioData;
    } else if (newTrack.referenceType === 'database') {
      doc._files = {
        [`${newId}.${newTrack.mimeType.split('/')[1]}`]: newTrack.audioData
      };
    }

    await database.put(doc);
    onCancelNewTrack(); // Close the form after submitting
  }, [database, onCancelNewTrack, ts]);

  const handleMuteToggle = useCallback((instrumentId) => {
    updateTrackSetting(instrumentId, 'muted', !trackSettings[instrumentId]?.muted);
  }, [trackSettings, updateTrackSetting]);

  const handleSoloToggle = useCallback((instrumentId) => {
    updateTrackSetting(instrumentId, 'soloed', !trackSettings[instrumentId]?.soloed);
  }, [trackSettings, updateTrackSetting]);

  const anyTrackSoloed = Object.values(trackSettings).some(track => track.soloed);

  const handleNameChange = useCallback(async (instrumentId, newName) => {
    const instrument = Object.values(instrumentRecords).find(i => i._id === instrumentId);
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
  }, [database, instrumentRecords]);

  const handleDeleteTrack = useCallback(async (instrumentId) => {
    // Don't allow deletion of default instruments
    if (DEFAULT_INSTRUMENTS.some(name => name.toLowerCase() === instrumentId)) {
      alert("Cannot delete default instruments");
      return;
    }

    try {
      // Delete the instrument document
      await database.del(instrumentId);

      // Delete associated beats
      const beatDocs = await database.query('type', { 
        key: 'beat', 
        filter: doc => doc._id.startsWith(`beat-${instrumentId}-`)
      });
      await Promise.all(beatDocs.rows.map(row => database.del(row.id)));

      // Remove from track settings
      setTrackSettings(prev => {
        const updated = { ...prev };
        delete updated[instrumentId];
        localStorage.setItem('trackSettings', JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error("Error deleting track:", error);
      alert("An error occurred while deleting the track");
    }
  }, [database]);

  const handleCancelNewTrack = useCallback(() => {
    onCancelNewTrack();
  }, []);

  const handleAddTrack = useCallback(() => {
    setShowNewTrackForm(true);
  }, []);

  return (
    <div className="pattern-set">
      {showNewTrackForm && (
        <NewTrackForm
          onSubmit={handleSubmitNewTrack}
          onCancel={handleCancelNewTrack}
        />
      )}
      {Object.values(instrumentRecords).map((instrumentRecord) => (
        <Pattern
          key={instrumentRecord._id}
          instrumentRecord={instrumentRecord}
          beats={beats}
          updateBeat={updateBeat}
          bpmDoc={bpmDoc}
          elapsedQuarterBeats={elapsedQuarterBeats}
          isMuted={trackSettings[instrumentRecord._id]?.muted || false}
          isSolo={trackSettings[instrumentRecord._id]?.soloed || false}
          onMuteToggle={() => handleMuteToggle(instrumentRecord._id)}
          onSoloToggle={() => handleSoloToggle(instrumentRecord._id)}
          anyTrackSoloed={anyTrackSoloed}
          onNameChange={handleNameChange}
          onDeleteTrack={handleDeleteTrack}
          isDefaultInstrument={DEFAULT_INSTRUMENTS.includes(instrumentRecord.name)}
          dbName={dbName}
        />
      ))}
    </div>
  );
};

export default PatternSet;