import React, { useState } from 'react';
import './NewTrackForm.css';
import LinkAudio from './AudioOptions/LinkAudio';
import UploadAudio from './AudioOptions/UploadAudio';
import RecordAudio from './AudioOptions/RecordAudio';

const NewTrackForm = ({ onSubmit, onCancel, existingTrackNames }) => {
  const [audioOption, setAudioOption] = useState(null);
  const [audioData, setAudioData] = useState(null);
  const [mimeType, setMimeType] = useState(null);
  const [referenceType, setReferenceType] = useState(null);

  const handleAudioDataChange = (data, type, reference, name) => {
    setAudioData(data);
    setMimeType(type);
    setReferenceType(reference);
    if (name) {
      handleSubmit(name, data, type, reference);
    }
  };

  const handleSubmit = (name, data, type, reference) => {
    onSubmit({ name, audioData: data, mimeType: type, referenceType: reference });
  };

  const renderAudioOption = () => {
    switch (audioOption) {
      case 'link':
        return <LinkAudio onDataChange={handleAudioDataChange} onCancel={() => setAudioOption(null)} existingTrackNames={existingTrackNames} />;
      case 'upload':
        return <UploadAudio onDataChange={handleAudioDataChange} onCancel={() => setAudioOption(null)} existingTrackNames={existingTrackNames} />;
      case 'record':
        return <RecordAudio onDataChange={handleAudioDataChange} onCancel={() => setAudioOption(null)} existingTrackNames={existingTrackNames} />;
      default:
        return null;
    }
  };

  return (
    <div className="new-track-form">
      {!audioOption ? (
        <div className="audio-options">
          <button type="button" onClick={() => setAudioOption('link')}>Link</button>
          <button type="button" onClick={() => setAudioOption('upload')}>Upload</button>
          <button type="button" onClick={() => setAudioOption('record')}>Record</button>
        </div>
      ) : (
        renderAudioOption()
      )}
      <button type="button" onClick={onCancel} className="cancel-button">Cancel</button>
    </div>
  );
};

export default NewTrackForm;