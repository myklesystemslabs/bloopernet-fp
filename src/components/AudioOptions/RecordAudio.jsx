import React, { useState, useRef, useEffect } from 'react';

const RecordAudio = ({ onDataChange, onCancel }) => {
  const [name, setName] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    audioChunksRef.current = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    mediaRecorderRef.current.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };
    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudioURL(audioUrl);
    };
    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (audioURL && name) {
      fetch(audioURL)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `${name}.wav`, { type: 'audio/wav' });
          onDataChange(file, 'audio/wav', 'database', name);
        });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="record-audio">
      <input 
        type="text" 
        value={name} 
        onChange={(e) => setName(e.target.value)} 
        placeholder="Instrument Name"
        required
      />
      {!isRecording ? (
        <button type="button" onClick={startRecording}>Start Recording</button>
      ) : (
        <button type="button" onClick={stopRecording}>Stop Recording</button>
      )}
      {audioURL && (
        <audio src={audioURL} controls />
      )}
      <button type="submit" disabled={!audioURL || !name}>Add Track</button>
      <button type="button" onClick={onCancel}>Back</button>
    </form>
  );
};

export default RecordAudio;