import React from 'react';
import './BeatButton.css';

const BeatButton = ({ instrumentId, beatIndex, isActive, isCurrent, isStarting, isSilent, updateBeat, className }) => {
  const handleClick = () => {
    updateBeat(instrumentId, beatIndex, !isActive);
  };

  return (
    <div
      className={`beat-button ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''} ${isSilent ? 'silent' : ''}`}
      onClick={handleClick}
      data-id={`beat-${instrumentId}-${beatIndex}`}
    >
      <div className="beat-button-inner" />
    </div>
  );
};

export default BeatButton;
