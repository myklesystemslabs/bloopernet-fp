import React, { useState, useRef } from 'react';

const RecordAudio = ({ onDataChange }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      const fileName = `recording-${Date.now()}.wav`;
      const audioFile = new File([audioBlob], fileName, { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioFile);
      setAudioURL(audioUrl);
      onDataChange(audioFile, 'audio/wav', 'database');
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  return (
    <div className="record-audio">
      {!isRecording && !audioURL && (
        <button type="button" onClick={startRecording}>Start Recording</button>
      )}
      {isRecording && (
        <button type="button" onClick={stopRecording}>Stop Recording</button>
      )}
      {audioURL && (
        <audio src={audioURL} controls />
      )}
    </div>
  );
};

export default RecordAudio;