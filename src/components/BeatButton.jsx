import React from 'react';
import './BeatButton.css'; // We'll create this CSS file

const BeatButton = ({ instrumentName, beatIndex, isActive, updateBeat }) => {
  const buttonId = `beat-${instrumentName.toLowerCase().replace(/\s+/g, '-')}-${beatIndex}`;

  const handleClick = () => {
    updateBeat(buttonId, !isActive);
  };

  return (
    <div
      onClick={handleClick}
      className={`beat-button ${isActive ? 'active' : 'inactive'}`}
      data-id={buttonId}
    >
      <div className="beat-button-inner" />
    </div>
  );
};

export default BeatButton;
