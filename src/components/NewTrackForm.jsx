import React, { useState } from 'react';
import './NewTrackForm.css';
import LinkAudio from './AudioOptions/LinkAudio';
import UploadAudio from './AudioOptions/UploadAudio';
import RecordAudio from './AudioOptions/RecordAudio';

const NewTrackForm = ({ onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [audioOption, setAudioOption] = useState(null);
  const [audioData, setAudioData] = useState(null);
  const [mimeType, setMimeType] = useState(null);
  const [referenceType, setReferenceType] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, audioData, mimeType, referenceType });
  };

  const handleAudioDataChange = (data, type, reference) => {
    setAudioData(data);
    setMimeType(type);
    setReferenceType(reference);
  };

  const renderAudioOption = () => {
    switch (audioOption) {
      case 'link':
        return <LinkAudio onDataChange={(data) => handleAudioDataChange(data, 'audio/wav', 'url')} />;
      case 'upload':
        return <UploadAudio onDataChange={(data, type) => handleAudioDataChange(data, type, 'database')} />;
      case 'record':
        return <RecordAudio onDataChange={(data) => handleAudioDataChange(data, 'audio/wav', 'database')} />;
      default:
        return (
          <div className="audio-options">
            <button type="button" onClick={() => setAudioOption('link')}>Link</button>
            <button type="button" onClick={() => setAudioOption('upload')}>Upload</button>
            <button type="button" onClick={() => setAudioOption('record')}>Record</button>
          </div>
        );
    }
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
      {renderAudioOption()}
      <button type="button" onClick={onCancel}>Cancel</button>
      {audioOption && audioData && <button type="submit">Add Track</button>}
    </form>
  );
};

export default NewTrackForm;