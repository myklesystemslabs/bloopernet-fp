import React from 'react';
import './BeatButton.css';

const BeatButton = ({ instrumentName, beatIndex, isActive, isCurrent, isStarting, updateBeat, className }) => {
  const buttonId = `beat-${instrumentName.toLowerCase().replace(/\s+/g, '-')}-${beatIndex}`;

  const handleClick = () => {
    updateBeat(buttonId, instrumentName, beatIndex, !isActive);
  };

  return (
    <div
      onClick={handleClick}
      className={`beat-button ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''} ${isStarting ? 'starting' : ''} ${className}`}
      data-id={buttonId}
    >
      <div className="beat-button-inner" />
    </div>
  );
};

export default BeatButton;
