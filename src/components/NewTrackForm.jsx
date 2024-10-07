import React, { useState } from 'react';
import './NewTrackForm.css';

const NewTrackForm = ({ onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [audioFile, setAudioFile] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, audioFile });
  };

  return (
    <form onSubmit={handleSubmit} className="new-track-form">
      <input 
        type="text" 
        value={name} 
        onChange={(e) => setName(e.target.value)} 
        placeholder="Instrument Name"
        required
      />
      <input 
        type="text" 
        value={audioFile} 
        onChange={(e) => setAudioFile(e.target.value)} 
        placeholder="Audio File URL"
        required
      />
      <button type="submit">Add Track</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </form>
  );
};

export default NewTrackForm;