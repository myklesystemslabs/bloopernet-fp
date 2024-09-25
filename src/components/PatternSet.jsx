import React from 'react';
import Pattern from './Pattern';
import './PatternSet.css';

const PatternSet = ({ instruments, beats, updateBeat }) => {
  return (
    <div className="pattern-set">
      {instruments.map((instrument) => (
        <Pattern 
          key={instrument} 
          instrument={instrument} 
          beats={beats} 
          updateBeat={updateBeat}
        />
      ))}
    </div>
  );
};

export default PatternSet;
