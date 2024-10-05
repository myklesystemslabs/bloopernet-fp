import React, { useState, useEffect, useCallback } from 'react';
import { useFireproof } from 'use-fireproof';
import { useTimesync } from '../TimesyncContext';
import Pattern from './Pattern';
import './PatternSet.css';

const PatternSet = ({ dbName, instruments, beats}) => {
  const ts = useTimesync();
  const [elapsedQuarterBeats, setElapsedQuarterBeats] = useState(0);
  const { database, useLiveQuery } = useFireproof(dbName);
   // Fetch the BPM document from the database
   const bpmResult = useLiveQuery('type', { key: 'bpm' });
   const bpmDoc = bpmResult.rows[0]?.doc;
   
   // Extract BPM, lastChanged, and playing from the query result
   const bpm = bpmDoc?.bpm || 120;
   const lastChanged_ms = bpmDoc?.lastChanged_ms || (ts ? ts.now() : Date.now()); // Use timesync for default value if available
   const playing = bpmDoc?.playing || false;
   const prevQuarterBeats = bpmDoc?.prevQuarterBeats || 0;

  const calculateElapsedQuarterBeats = useCallback(() => {
    if (!ts){console.warn("no timesync"); return 0;}
    if (!ts || !bpm || !lastChanged_ms || !playing) return 0;
    const currentTime_ms = ts.now();
    const elapsedTime_ms = currentTime_ms - lastChanged_ms;
    const elapsedQuarterBeats = Math.floor((elapsedTime_ms / 60000) * bpm * 4) + prevQuarterBeats; // 60000 ms in a minute, 4 quarter beats per beat
    // console.log("elapsedQuarterBeats: ", elapsedQuarterBeats);
    if (elapsedQuarterBeats == 0){
      console.log("elapsedQuarterBeats is 0");
    } 
    return elapsedQuarterBeats;
  }, [ts, bpm, lastChanged_ms, playing, prevQuarterBeats]);

  useEffect(() => {
    if (playing) {
      const intervalId = setInterval(() => {
        setElapsedQuarterBeats(calculateElapsedQuarterBeats());
      }, 1000/ (4 * (bpm/60) ) ); // Update 4x per quarter beat
      return () => clearInterval(intervalId);
    } else {
      setElapsedQuarterBeats(0);
    }
  }, [playing, calculateElapsedQuarterBeats]);

  const updateBeat = async (id, instrumentName, beatIndex, isActive) => {
    const doc = await database.get(id).catch(error => {
      if (error.message.includes('Not found')) {
        return {
          _id: id,
          type: 'beat',
          isActive: isActive,
          instrumentName: instrumentName,
          beatIndex: beatIndex
        };
      } else {
        throw error;
      }
    })
    await database.put({ ...doc, isActive });
  };

  return (
    <div className="pattern-set">
      {instruments.map(instrument => (
        <Pattern
          key={instrument}
          instrument={instrument}
          beats={beats}
          updateBeat={updateBeat}
          bpmDoc={bpmDoc}
          elapsedQuarterBeats={elapsedQuarterBeats}
        />
      ))}
    </div>
  );
};

export default PatternSet;
