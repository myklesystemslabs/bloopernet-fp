import React, { useState, useEffect, useRef } from 'react';
import { getAudioContext, getMasterGainNode } from '../audioUtils';
import './LatencyMeasurer.css';

const LatencyMeasurer = ({ onClose, onLatencyMeasured }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const sourceRef = useRef(null);
  const processorRef = useRef(null);

  const requestMicrophoneAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      return stream;
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Microphone access denied. Please grant permission and try again.');
      return null;
    }
  };

  const startMeasurement = async () => {
    setIsRunning(true);
    setResult(null);
    setError(null);

    try {
      const stream = await requestMicrophoneAccess();
      if (!stream) {
        setIsRunning(false);
        return;
      }

      const audioContext = getAudioContext();
      await audioContext.audioWorklet.addModule('processor.js');

      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      const processor = new AudioWorkletNode(audioContext, 'latency-processor');
      processorRef.current = processor;

      // Connect to the master gain node instead of directly to the destination
      const masterGainNode = getMasterGainNode();
      source.connect(processor).connect(masterGainNode);

      processor.port.onmessage = (event) => {
        if (event.data.type === 'result') {
          setResult(event.data.latency);
          setIsRunning(false);
          onLatencyMeasured(event.data.latency);
        } else if (event.data.type === 'timeout') {
          setError('Measurement timed out. Please check your audio setup and try again.');
          setIsRunning(false);
        }
      };

      processor.port.postMessage({ type: 'start' });

    } catch (error) {
      console.error('Error starting measurement:', error);
      setError('An error occurred while measuring latency. Please try again.');
      setIsRunning(false);
    }
  };

  return (
    <div className="latency-measurer">
      <h2>Measure Audio Latency</h2>
      <p>This will play a short tone (440 Hz) for 0.5 seconds. Please ensure your speakers are on and your microphone is enabled.</p>
      {error && <p className="error-message">{error}</p>}
      <button onClick={startMeasurement} disabled={isRunning}>
        {isRunning ? 'Measuring... (up to 3 seconds)' : 'Start Measurement'}
      </button>
      {result !== null && <p>Measured latency: {result.toFixed(2)} ms</p>}
      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default LatencyMeasurer;
