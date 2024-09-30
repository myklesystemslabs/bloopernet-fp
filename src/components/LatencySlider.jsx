import React, { useState, useEffect } from 'react';
import { setLatencyCompensation, getLatencyCompensation, initLatencyCompensation } from '../audioUtils';
import './LatencySlider.css';

const LatencySlider = () => {
  const [latency, setLatency] = useState(0);

  useEffect(() => {
    initLatencyCompensation();
    setLatency(getLatencyCompensation());
  }, []);

  const handleLatencyChange = (e) => {
    const newLatency = parseFloat(e.target.value);
    setLatency(newLatency);
    setLatencyCompensation(newLatency);
  };

  const resetLatency = (e) => {
    e.preventDefault(); // Prevent any default action
    setLatency(0);
    setLatencyCompensation(0);
  };

  return (
    <div className="latency-slider">
      <div className="latency-label">
        <span>Latency Compensation: {latency} ms</span>
        <button 
          className="reset-button" 
          onClick={resetLatency}
          title="Click to reset to 0"
        >
          Reset
        </button>
      </div>
      <input
        id="latency-input"
        type="range"
        min="-500"
        max="500"
        step="1"
        value={latency}
        onChange={handleLatencyChange}
      />
    </div>
  );
};

export default LatencySlider;