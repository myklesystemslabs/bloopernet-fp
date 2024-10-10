import React, { useState, useRef } from 'react';

const UploadAudio = ({ onDataChange, onCancel }) => {
  const [name, setName] = useState('');
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (file && name) {
      onDataChange(file, file.type, 'database', name);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="upload-audio">
      <input 
        type="text" 
        value={name} 
        onChange={(e) => setName(e.target.value)} 
        placeholder="Instrument Name"
        required
      />
      <input 
        type="file" 
        onChange={handleFileChange} 
        ref={fileInputRef}
        accept="audio/*"
        required
      />
      {file && <span>{file.name}</span>}
      <button type="submit" disabled={!file || !name}>Add Track</button>
      <button type="button" onClick={onCancel}>Back</button>
    </form>
  );
};

export default UploadAudio;