import React, { useState } from 'react';

const LinkAudio = ({ onDataChange, onCancel }) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url && name) {
      onDataChange(url, 'audio/mpeg', 'url', name); // Assuming 'audio/mpeg' as default MIME type for linked audio
    }
  };

  return (
    <form onSubmit={handleSubmit} className="link-audio">
      <input 
        type="text" 
        value={name} 
        onChange={(e) => setName(e.target.value)} 
        placeholder="Instrument Name"
        required
      />
      <input 
        type="url" 
        value={url} 
        onChange={(e) => setUrl(e.target.value)} 
        placeholder="Audio URL"
        required
      />
      <button type="submit" disabled={!url || !name}>Add Track</button>
      <button type="button" onClick={onCancel}>Back</button>
    </form>
  );
};

export default LinkAudio;