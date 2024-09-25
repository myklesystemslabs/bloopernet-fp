import React from 'react';
import { useLiveQuery, useFireproof } from 'use-fireproof';
import './BeatButton.css';

const BeatButton = ({ instrumentName, beatIndex, updateBeat }) => {
  const buttonId = `beat-${instrumentName.toLowerCase().replace(/\s+/g, '-')}-${beatIndex}`;
  // const { useLiveQuery } = useFireproof();

  // Use useLiveQuery to listen for changes to this specific beat document
  //const result = useLiveQuery('_id', buttonId);
  const result = useLiveQuery('_id', {key:buttonId});
  const beatDoc = result.docs[0];

  const isActive = beatDoc ? beatDoc.isActive : false;

  const handleClick = () => {
    updateBeat(buttonId, instrumentName, beatIndex, !isActive);
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
