import React, { useState, useEffect, useRef } from 'react';
import { getAudioContext, getMasterGainNode } from '../audioUtils';
import './LatencyMeasurer.css';

const LatencyMeasurer = ({ onClose, onLatencyMeasured, microphoneReady, stream }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const sourceRef = useRef(null);
  const processorRef = useRef(null);
  const timeoutRef = useRef(null);

  const startMeasurement = async () => {
    setIsRunning(true);
    setResult(null);
    setError(null);

    try {
      const audioContext = getAudioContext();
      await audioContext.audioWorklet.addModule('processor.js');

      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      const processor = new AudioWorkletNode(audioContext, 'latency-processor');
      processorRef.current = processor;

      const masterGainNode = getMasterGainNode();
      source.connect(processor).connect(masterGainNode);

      processor.port.onmessage = (event) => {
        if (event.data.type === 'result') {
          setResult({
            average: event.data.latency,
            measurements: event.data.measurements
          });
          setIsRunning(false);
          onLatencyMeasured(event.data.latency);
          clearTimeout(timeoutRef.current);
        }
      };

      processor.port.postMessage({ type: 'start' });

      // Set a timeout for the entire measurement process
      timeoutRef.current = setTimeout(() => {
        setError('Measurement timed out. Please check your audio setup and try again.');
        setIsRunning(false);
        if (processorRef.current) {
          processorRef.current.disconnect();
        }
      }, 30000); // 30 seconds timeout

    } catch (error) {
      console.error('Error starting measurement:', error);
      setError('An error occurred while measuring latency. Please try again.');
      setIsRunning(false);
    }
  };

  useEffect(() => {
    return () => {
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (processorRef.current) {
        processorRef.current.disconnect();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="latency-measurer">
      <h2>Measure Audio Latency</h2>
      <p>This will play 5 short tones (440 Hz) with pauses between them. Please ensure your speakers are on and your microphone is enabled.</p>
      {error && <p className="error-message">{error}</p>}
      <button onClick={startMeasurement} disabled={isRunning || !microphoneReady}>
        {isRunning ? 'Measuring... (up to 30 seconds)' : 'Start Measurement'}
      </button>
      {result && (
        <div>
          <p>Average latency: {result.average.toFixed(2)} ms</p>
          <p>Individual measurements:</p>
          <ul>
            {result.measurements.map((measurement, index) => (
              <li key={index}>{measurement.toFixed(2)} ms</li>
            ))}
          </ul>
        </div>
      )}
      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default LatencyMeasurer;
