import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'use-fireproof';
import { useTimesync } from '../TimesyncContext';
import './TopControls.css';

const TopControls = ({ database }) => {
  const ts = useTimesync();
  const [tempBpm, setTempBpm] = useState(120);
  const [playing, setPlaying] = useState(false);
  const timeoutRef = useRef(null);

  // Fetch the current BPM document from the database
  const bpmResult = useLiveQuery('type', { key: 'bpm' });
  const bpmDoc = bpmResult.rows[0]?.doc;

  useEffect(() => {
    if (bpmDoc) {
      setTempBpm(bpmDoc.bpm);
      setPlaying(bpmDoc.playing);
    }
  }, [bpmDoc]);

  const handleClear = async () => {
    try {
      // Query for documents where type equals "beat"
      const result = await database.query('type', { key: 'beat', include_docs: true });
      
      // Reset all beat documents
      const updatePromises = result.rows.map(row => {
        const updatedDoc = { ...row.doc, isActive: false };
        return database.put(updatedDoc);
      });
      
      await Promise.all(updatePromises);
      console.log('All beats cleared');
    } catch (error) {
      console.error('Error clearing beats:', error);
    }
  };

  const handleNuke = async () => {
    try {
      // Get all documents
      const allDocs = await database.allDocs({ include_docs: true });
      
      // Filter for beat documents by _id format
      const beatDocs = allDocs.rows.filter(row => row.value.beatIndex != undefined);
      
      // Delete all beat documents
      const deletePromises = beatDocs.map(row => database.del(row.key));
      
      await Promise.all(deletePromises);
      console.log(`All beats nuked (deleted). Total: ${beatDocs.length}`);
    } catch (error) {
      console.error('Error nuking beats:', error);
    }
  };

  const updateBPMDoc = async (updates) => {
    const timestamp = ts.now();
    const newBpmDoc = {
      ...bpmDoc,
      ...updates,
      lastChanged: timestamp
    };

    try {
      if (bpmDoc) {
        await database.put({ ...bpmDoc, ...newBpmDoc });
      } else {
        await database.put({ _id: 'bpm', type: 'bpm', ...newBpmDoc });
      }
    } catch (error) {
      console.error('Error updating BPM document:', error);
    }
  };


  const handleBpmChange = (e) => {
    const newBpm = Math.max(30, Math.min(240, parseInt(e.target.value, 10)));
    setTempBpm(newBpm);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      updateBPMDoc({ bpm: newBpm });
    }, 500);
  };

  const handleBpmChangeComplete = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    updateBPMDoc({ bpm: tempBpm });
  };

  const togglePlay = () => {
    const newPlayingState = !playing;
    setPlaying(newPlayingState);
    updateBPMDoc({ 
      playing: newPlayingState, 
      bpm: tempBpm,
      lastChanged: ts.now() // Reset the start time when playing is toggled to true
    });
  };

  return (
    <div className="top-controls">
      <button className="play-pause-button" onClick={togglePlay}>
        {playing ? 'Pause' : 'Play'}
      </button>
      <div className="bpm-control">
        <label htmlFor="bpm-slider">BPM</label>
        <input
          id="bpm-slider"
          type="range"
          className="bpm-slider"
          value={tempBpm}
          onChange={handleBpmChange}
          onMouseUp={handleBpmChangeComplete}
          onTouchEnd={handleBpmChangeComplete}
          min="30"
          max="240"
        />
        <span className="bpm-value">{tempBpm}</span>
      </div>
      <button className="control-button" onClick={handleClear}>Clear</button>
      <button className="control-button nuke" onClick={handleNuke}>Nuke</button>
    </div>
  );
};

export default TopControls;
