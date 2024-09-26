import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'use-fireproof';
import { useTimesync } from '../TimesyncContext';
import './TopControls.css';

const TopControls = ({ database, updateBPM }) => {
  const ts = useTimesync(); // Access the timesync object
  const [bpm, setBpm] = useState(120); // Default BPM value
  const [tempBpm, setTempBpm] = useState(120); // Temporary BPM value for the slider
  const timeoutRef = useRef(null);

  // Fetch BPM from the database
  const bpmResult = useLiveQuery('type', { key: 'bpm' });

  useEffect(() => {
    if (bpmResult.rows.length > 0) {
      const bpmDoc = bpmResult.rows[0].doc;
      setBpm(bpmDoc.bpm);
      setTempBpm(bpmDoc.bpm);
    }
  }, [bpmResult]);

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

  const handleBpmChange = (e) => {
    const newBpm = Math.max(30, Math.min(240, parseInt(e.target.value, 10)));
    setTempBpm(newBpm);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setBpm(newBpm);
      updateBPM(newBpm, ts); // Update BPM in the database with the timesync object
    }, 250); // throttle with 250ms delay

  };

  const handleBpmChangeComplete = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setBpm(tempBpm);
    updateBPM(tempBpm, ts); // Update BPM in the database with the timesync object
  };

  return (
    <div className="top-controls">
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
