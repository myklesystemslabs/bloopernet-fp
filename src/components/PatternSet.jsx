import React from 'react';
import { useLiveQuery } from 'use-fireproof';
import { useTimesync } from '../TimesyncContext';
import Pattern from './Pattern';
import './PatternSet.css';

const PatternSet = ({ instruments, beats, updateBeat }) => {
  const ts = useTimesync(); // Access the timesync object
  
  // Fetch the BPM document from the database
  const bpmResult = useLiveQuery('type', { key: 'bpm' });
  
  // Extract BPM and lastChanged from the query result
  const bpm = bpmResult.rows[0]?.doc?.bpm || 120; // Default to 120 if not set
  const lastChanged = bpmResult.rows[0]?.doc?.lastChanged || (ts ? ts.now() : Date.now()); // Use timesync for default value

  return (
    <div className="pattern-set">
      {instruments.map(instrument => (
        <Pattern
          key={instrument}
          instrument={instrument}
          beats={beats}
          updateBeat={updateBeat}
          bpm={bpm}
          lastChanged={lastChanged}
        />
      ))}
    </div>
  );
};

export default PatternSet;
