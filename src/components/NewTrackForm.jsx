import React, { useState } from 'react';
import './NewTrackForm.css';
import LinkAudio from './AudioOptions/LinkAudio';
import UploadAudio from './AudioOptions/UploadAudio';
import RecordAudio from './AudioOptions/RecordAudio';

const NewTrackForm = ({ onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [audioOption, setAudioOption] = useState(null);
  const [audioData, setAudioData] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, audioOption, audioData });
  };

  const renderAudioOption = () => {
    switch (audioOption) {
      case 'link':
        return <LinkAudio onDataChange={setAudioData} />;
      case 'upload':
        return <UploadAudio onDataChange={setAudioData} />;
      case 'record':
        return <RecordAudio onDataChange={setAudioData} />;
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