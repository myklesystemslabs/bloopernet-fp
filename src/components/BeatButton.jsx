import React from 'react';
import './BeatButton.css';

const BeatButton = ({ instrumentId, beatIndex, isActive, isCurrent, isStarting, updateBeat, className }) => {
  const handleClick = () => {
    updateBeat(instrumentId, beatIndex, !isActive);
  };

  return (
    <div
      onClick={handleClick}
      className={`beat-button ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''} ${isStarting ? 'starting' : ''} ${className}`}
      data-id={`beat-${instrumentId}-${beatIndex}`}
    >
      <div className="beat-button-inner" />
    </div>
  );
};

export default BeatButton;
