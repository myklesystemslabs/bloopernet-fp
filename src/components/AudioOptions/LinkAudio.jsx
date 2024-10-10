import React, { useState, useEffect } from 'react';
import '../NewTrackForm.css';

const LinkAudio = ({ onDataChange, existingTrackNames }) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

  const generateInstrumentName = (url) => {
    // Extract the last part of the URL path
    let baseName = url.split('/').pop().split('?')[0];
    
    // Remove file extension if present
    baseName = baseName.split('.').slice(0, -1).join('.');
    
    // Remove leading illegal characters and truncate at first illegal character after legal ones
    baseName = baseName.replace(/^[^a-zA-Z0-9]+/, '').replace(/[^a-zA-Z0-9].*$/, '');
    
    // Limit to 9 characters
    baseName = baseName.slice(0, 9);
    
    // Check for duplicates and add incrementing integer if necessary
    let uniqueName = baseName;
    let counter = 2;
    while (existingTrackNames.includes(uniqueName.toLowerCase())) {
      const suffix = `-${counter}`;
      uniqueName = baseName.slice(0, 9 - suffix.length) + suffix;
      counter++;
    }
    
    return uniqueName;
  };

  useEffect(() => {
    if (url && !name) {
      const generatedName = generateInstrumentName(url);
      setName(generatedName);
    }
  }, [url, name, existingTrackNames]);

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
      <button type="submit" disabled={!url || !name} className="audio-option-button" aria-label="Add Track">
        <span className="material-icons">check</span>
      </button>
    </form>
  );
};

export default LinkAudio;