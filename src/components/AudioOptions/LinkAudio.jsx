import React, { useState } from 'react';

const LinkAudio = ({ onDataChange }) => {
  const [url, setUrl] = useState('');

  const handleChange = (e) => {
    setUrl(e.target.value);
    onDataChange(e.target.value);
  };

  return (
    <input 
      type="url" 
      value={url} 
      onChange={handleChange} 
      placeholder="Audio File URL"
      required
    />
  );
};

export default LinkAudio;