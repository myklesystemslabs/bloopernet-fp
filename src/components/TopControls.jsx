import React, { useState } from 'react';
import './TopControls.css';

const TopControls = ({ database, setBeats }) => {
  const [bpm, setBpm] = useState(120); // Default BPM value

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

  return (
    <div className="top-controls">
      <div className="bpm-control">
        <label htmlFor="bpm-input">BPM</label>
        <input
          id="bpm-input"
          type="number"
          className="bpm-input"
          value={bpm}
          onChange={(e) => setBpm(Math.max(30, Math.min(240, parseInt(e.target.value, 10))))}
          min="30"
          max="240"
        />
      </div>
      <button className="control-button" onClick={handleClear}>Clear</button>
      <button className="control-button nuke" onClick={handleNuke}>Nuke</button>
    </div>
  );
};

export default TopControls;
