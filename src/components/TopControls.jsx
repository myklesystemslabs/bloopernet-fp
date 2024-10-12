import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTimesync } from '../TimesyncContext';
import { useFireproof } from 'use-fireproof';
import { v4 as uuidv4 } from 'uuid';
import { setMasterMute, isMasterMuted, loadSilenceBuffer, getHeadStart_ms, setLatencyCompensation, getLatencyCompensation } from '../audioUtils';
import './TopControls.css';

const TopControls = ({ dbName, isExpert, toggleTheme, theme, toggleVisuals, visualsEnabled, onAddTrack }) => {
  const ts = useTimesync();
  const [tempBpm, setTempBpm] = useState(120);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(isMasterMuted()); // Start muted
  const timeoutRef = useRef(null);
  const { database, useLiveQuery } = useFireproof(dbName);
  // Fetch the current BPM document from the database
  const bpmResult = useLiveQuery('type', { key: 'bpm' });
  const bpmDoc = bpmResult.rows[0]?.doc;
  const [latency, setLatency] = useState(0);
  const [deviceId, setDeviceId] = useState(null);
  const latencyTimeoutRef = useRef(null);
  const [isEditingLatency, setIsEditingLatency] = useState(false);
  const latencyInputRef = useRef(null);
  const [isEditingBpm, setIsEditingBpm] = useState(false);
  const bpmInputRef = useRef(null);
  const [editingBpm, setEditingBpm] = useState(null);
  const [editingLatency, setEditingLatency] = useState(null);

  useEffect(() => {
    // Load or generate device ID
    let storedDeviceId = localStorage.getItem('deviceId');
    if (!storedDeviceId) {
      storedDeviceId = uuidv4();
      localStorage.setItem('deviceId', storedDeviceId);
    }
    setDeviceId(storedDeviceId);

    // Load stored latency
    const storedLatency = localStorage.getItem('latency');
    if (storedLatency !== null) {
      const parsedLatency = parseInt(storedLatency, 10);
      setLatency(parsedLatency);
      setLatencyCompensation(parsedLatency);
    } else {
      const initialLatency = getLatencyCompensation();
      setLatency(initialLatency);
      localStorage.setItem('latency', initialLatency.toString());
    }
  }, []);

  useEffect(() => {
    if (bpmDoc) {
      setTempBpm(bpmDoc.bpm);
      setPlaying(bpmDoc.playing);
    }
  }, [bpmDoc]);

  useEffect(() => {
    // Set initial volume
    setMasterMute(muted);
  }, [muted]);

  useEffect(() => {
    // Load the silence buffer when the component mounts
    loadSilenceBuffer();
  }, []);

  const handleClear = async () => {
    try {
      // Query for documents where type equals "beat"
      const result = await database.query('type', { key: 'beat', include_docs: true });
      
      // Reset all beat documents
      const updatePromises = result.rows.map(row => {
        const updatedDoc = { ...row.doc, isActive: false };
        return database.put(updatedDoc);
      });
      
      await Promise.all(updatePromises);
      console.log('All beats cleared');
    } catch (error) {
      console.error('Error clearing beats:', error);
    }
  };

  const updateBPMDoc = async (updates) => {
    if (!ts){console.warn("no timesync"); return;}
    if (! updates.lastChanged_ms) {
      updates.lastChanged_ms = ts.now();
    }
    const newBpmDoc = {
      ...bpmDoc,
      ...updates,
    };

    try {
      if (bpmDoc) {
        await database.put({ ...bpmDoc, ...newBpmDoc });
      } else {
        await database.put({ _id: 'bpm', type: 'bpm', ...newBpmDoc });
      }
    } catch (error) {
      console.error('Error updating BPM document:', error);
    }
  };

  const setBPM = (bpm) => {
    // calculate prevQuarterBeats based on bpm and current time
    const currentTime_ms = ts.now();
    const elapsedTime_ms = currentTime_ms - bpmDoc.lastChanged_ms;
    const elapsedQuarterBeats = Math.floor((elapsedTime_ms / 60000) * bpm * 4) + bpmDoc?.prevQuarterBeats || 0;
    updateBPMDoc({ bpm: bpm, prevQuarterBeats: elapsedQuarterBeats });
  };


  // update the BPM after the user has stopped moving the slider for 500ms, even if they don't release it yet.
  const handleBpmChange = (e) => {
    const newBpm = Math.max(30, Math.min(240, parseInt(e.target.value, 10)));
    setTempBpm(newBpm);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setBPM(newBpm);
    }, 500);
  };

  // update the BPM immediately if the user releases the slider
  const handleBpmChangeComplete = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setBPM(tempBpm);
  };

  const togglePlay = useCallback(() => {
    if (!ts){console.warn("no timesync"); return;}
    if (!ts) return;
    const newPlayingState = !playing;
    setPlaying(newPlayingState);
    let update = { 
      playing: newPlayingState, 
      bpm: bpmDoc ? bpmDoc.bpm : tempBpm,
      lastChanged_ms: newPlayingState ? ts.now() + getHeadStart_ms() : ts.now()
      //   lastChanged_ms: ts.now() + getHeadStart_ms()
      //   lastChanged_ms: ts.now()
    };
    if (newPlayingState){
      update.prevQuarterBeats = 0;
    }
    updateBPMDoc(update);
  }, [playing, bpmDoc, tempBpm, ts]);

  // // autoplay if paused at startup:
  // useEffect(() => {
  //   if (!ts){console.warn("no timesync"); return;}
  //   if (!ts) return;
  //   const timer = setTimeout(() => {
  //     if (!playing) {
  //       togglePlay();
  //     }
  //   }, Math.floor(Math.random() * 4000) + 1000);

  //   return () => clearTimeout(timer);
  // }, [ts]);


  const toggleMute = async () => {
    const newMutedState = !muted;
    setMasterMute(newMutedState);
    setMuted(newMutedState);
  };

  const updateDeviceDoc = async (newLatency) => {
    if (!ts) {
      console.warn("no timesync");
      return;
    }
    const deviceDoc = {
      _id: deviceId,
      type: 'device',
      latency: newLatency,
      timestamp: ts.now()
    };

    try {
      await database.put(deviceDoc);
      // Update localStorage after successful database update
      localStorage.setItem('latency', newLatency.toString());
    } catch (error) {
      console.error('Error updating device document:', error);
    }
  };

  const handleLatencyChange = (e) => {
    const newLatency = parseInt(e.target.value, 10);
    setLatency(newLatency);
    setLatencyCompensation(newLatency);

    if (latencyTimeoutRef.current) {
      clearTimeout(latencyTimeoutRef.current);
    }

    latencyTimeoutRef.current = setTimeout(() => {
      updateDeviceDoc(newLatency);
    }, 500);
  };

  const handleLatencyChangeComplete = () => {
    if (latencyTimeoutRef.current) {
      clearTimeout(latencyTimeoutRef.current);
    }
    updateDeviceDoc(latency);
  };

  const handleMeasureLatency = () => {
    // This function will be implemented later
    console.log('Measure latency');
  };

  const handleLatencyClick = () => {
    setEditingLatency(latency);
    setIsEditingLatency(true);
  };

  const handleLatencyInputChange = (e) => {
    const newLatency = parseInt(e.target.value, 10);
    if (!isNaN(newLatency) && newLatency >= 0 && newLatency <= 3000) {
      setEditingLatency(newLatency);
    }
  };

  const handleLatencyInputBlur = () => {
    setIsEditingLatency(false);
    if (editingLatency !== null) {
      setLatency(editingLatency);
      updateDeviceDoc(editingLatency);
    }
    setEditingLatency(null);
  };

  const handleLatencyInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      setIsEditingLatency(false);
      setLatency(editingLatency);
      updateDeviceDoc(editingLatency);
      setEditingLatency(null);
    } else if (e.key === 'Escape') {
      setIsEditingLatency(false);
      setEditingLatency(null);
    }
  };

  useEffect(() => {
    if (isEditingLatency && latencyInputRef.current) {
      latencyInputRef.current.focus();
      latencyInputRef.current.select();
    }
  }, [isEditingLatency]);

  const handleBpmClick = () => {
    setEditingBpm(tempBpm);
    setIsEditingBpm(true);
  };

  const handleBpmInputChange = (e) => {
    const newBpm = parseInt(e.target.value, 10);
    if (!isNaN(newBpm) && newBpm >= 30 && newBpm <= 240) {
      setEditingBpm(newBpm);
    }
  };

  const handleBpmInputBlur = () => {
    setIsEditingBpm(false);
    if (editingBpm !== null) {
      setTempBpm(editingBpm);
      setBPM(editingBpm);
    }
    setEditingBpm(null);
  };

  const handleBpmInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      setIsEditingBpm(false);
      setTempBpm(editingBpm);
      setBPM(editingBpm);
      setEditingBpm(null);
    } else if (e.key === 'Escape') {
      setIsEditingBpm(false);
      setEditingBpm(null);
    }
  };

  useEffect(() => {
    if (isEditingBpm && bpmInputRef.current) {
      bpmInputRef.current.focus();
      bpmInputRef.current.select();
    }
  }, [isEditingBpm]);

  return (
    <div className="top-controls">
      <div className="button-group">
        <button className={`control-button mute-button ${muted ? 'muted' : ''}`} onClick={toggleMute}>
          {muted ? 'Unmute' : 'Mute'}
        </button>
        {(!muted || isExpert) && (
          <button className="control-button add-track" onClick={onAddTrack}>Add Track</button>
        )}
      </div>
      {isExpert && (
        <>
          <div className="button-group">
            <button className="control-button play-pause-button" onClick={togglePlay}>
              {playing ? 'Pause' : 'Play'}
            </button>
            {/* <button className="control-button clear-button" onClick={handleClear}>Clear</button> */}
          </div>

          <div className="button-group-break"></div>

          <div className="button-group">
            <div className="bpm-control">
              <label htmlFor="bpm-slider">BPM</label>
              {isEditingBpm ? (
                <input
                  ref={bpmInputRef}
                  type="number"
                  value={editingBpm !== null ? editingBpm : tempBpm}
                  onChange={handleBpmInputChange}
                  onBlur={handleBpmInputBlur}
                  onKeyDown={handleBpmInputKeyDown}
                  min="30"
                  max="240"
                  className="bpm-input"
                />
              ) : (
                <span className="bpm-value" onClick={handleBpmClick}>
                  {tempBpm}
                </span>
              )}
              <input
                id="bpm-slider"
                type="range"
                className="bpm-slider"
                value={tempBpm}
                onChange={handleBpmChange}
                onMouseUp={handleBpmChangeComplete}
                onTouchEnd={handleBpmChangeComplete}
                min="30"
                max="240"
              />
            </div>
          </div>

          <div className="button-group-break"></div>

          <div className="button-group">
            <div className="latency-control">
              <label htmlFor="latency-slider">Latency</label>
              {isEditingLatency ? (
                <input
                  ref={latencyInputRef}
                  type="number"
                  value={editingLatency !== null ? editingLatency : latency}
                  onChange={handleLatencyInputChange}
                  onBlur={handleLatencyInputBlur}
                  onKeyDown={handleLatencyInputKeyDown}
                  min="0"
                  max="3000"
                  className="latency-input"
                />
              ) : (
                <span className="latency-value" onClick={handleLatencyClick}>
                  {latency} ms
                </span>
              )}
              <input
                id="latency-slider"
                type="range"
                className="latency-slider"
                value={latency}
                onChange={handleLatencyChange}
                onMouseUp={handleLatencyChangeComplete}
                onTouchEnd={handleLatencyChangeComplete}
                min="0"
                max="3000"
              />
              <button className="measure-latency-button" onClick={handleMeasureLatency}>
                Measure
              </button>
            </div>
          </div>

          <div className="button-group-break"></div>

          <div className="button-group">
            <button className="control-button visuals-toggle" onClick={toggleVisuals}>
              {visualsEnabled ? 'Disable Visuals' : 'Enable Visuals'}
            </button>
            <button className="control-button theme-toggle" onClick={toggleTheme}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default TopControls;