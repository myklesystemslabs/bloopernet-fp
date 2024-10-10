import React, { useState } from 'react';
import './NewTrackForm.css';
import LinkAudio from './AudioOptions/LinkAudio';
import UploadAudio from './AudioOptions/UploadAudio';
import RecordAudio from './AudioOptions/RecordAudio';

const NewTrackForm = ({ onSubmit, onCancel, existingTrackNames }) => {
  const [audioOption, setAudioOption] = useState(null);

  const handleAudioDataChange = (data, type, reference, name) => {
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
          <button type="button" onClick={() => setAudioOption('link')} className="audio-option-button" aria-label="Link Audio">
            <span className="material-icons">link</span>
          </button>
          <button type="button" onClick={() => setAudioOption('upload')} className="audio-option-button" aria-label="Upload Audio">
            <span className="material-icons">upload_file</span>
          </button>
          <button type="button" onClick={() => setAudioOption('record')} className="audio-option-button" aria-label="Record Audio">
            <span className="material-icons">mic</span>
          </button>
        </div>
      ) : (
        renderAudioOption()
      )}
      <button type="button" onClick={onCancel} className="cancel-button" aria-label="Cancel">
        <span className="material-icons">close</span>
      </button>
    </div>
  );
};

export default NewTrackForm;