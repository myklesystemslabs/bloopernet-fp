import React, { useState } from 'react';
import './InstrumentInfo.css';

const InstrumentInfo = ({ instrument, instrumentId, audioFile, onNameChange }) => {
  const [editName, setEditName] = useState(instrument);

  const handleNameChange = (e) => {
    setEditName(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNameChange(instrumentId, editName);
  };

  return (
    <div className="instrument-info">
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          value={editName} 
          onChange={handleNameChange} 
          placeholder="Instrument Name"
        />
        <button type="submit">Update</button>
      </form>
      <span className="info-text">ID: {instrumentId}</span>
      <span className="info-text">File: {audioFile}</span>
    </div>
  );
};

export default InstrumentInfo;