import React, { useRef } from 'react';

const UploadAudio = ({ onDataChange }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onDataChange(file);
    }
  };

  return (
    <div className="upload-audio">
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="audio/*"
        style={{ display: 'none' }}
      />
      <button type="button" onClick={() => fileInputRef.current.click()}>
        Choose File
      </button>
      {fileInputRef.current?.files[0]?.name && <span>{fileInputRef.current.files[0].name}</span>}
    </div>
  );
};

export default UploadAudio;