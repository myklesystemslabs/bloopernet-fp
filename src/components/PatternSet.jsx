import React from 'react';
import { useLiveQuery } from 'use-fireproof';
import { useTimesync } from '../TimesyncContext';
import Pattern from './Pattern';
import './PatternSet.css';

const PatternSet = ({ instruments, beats, updateBeat }) => {
  const ts = useTimesync(); // Access the timesync object
  
  // Fetch the BPM document from the database
  const bpmResult = useLiveQuery('type', { key: 'bpm' });
  const bpmDoc = bpmResult.rows[0]?.doc;
  
  // Extract BPM, lastChanged, and playing from the query result
  const bpm = bpmDoc?.bpm || 120;
  const lastChanged = bpmDoc?.lastChanged || (ts ? ts.now() : Date.now()); // Use timesync for default value if available

  const playing = bpmDoc?.playing || false;

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
          playing={playing}
        />
      ))}
    </div>
  );
};

export default PatternSet;
