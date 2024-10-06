import React, { useState, useEffect, useCallback, useRef } from 'react';
import BeatButton from './BeatButton';
import InstrumentInfo from './InstrumentInfo';
import { loadSound, clearScheduledEvents, getAudioContext, scheduleBeat, getHeadStart_ms, getMasterGainNode, playSoundBuffer } from '../audioUtils';
import { useTimesync } from '../TimesyncContext';
import './Pattern.css';

const Pattern = ({ 
  instrument, 
  instrumentId, 
  audioFile, 
  beats, 
  updateBeat, 
  bpmDoc, 
  elapsedQuarterBeats, 
  isMuted, 
  isSolo, 
  onMuteToggle, 
  onSoloToggle, 
  anyTrackSoloed, 
  onNameChange, 
  isTemporary, 
  onSubmitNewTrack,
  onDeleteTrack // New prop for delete functionality
}) => {
  const [soundBuffer, setSoundBuffer] = useState(null);
  const [wasPlaying, setWasPlaying] = useState(false);
  const gainNodeRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const ts = useTimesync();
  const patternLength = 16; // 16 quarter beats = 4 full beats
  const scheduledEventsRef = useRef([]);
  const timesyncStartTime_ms = useRef(null);
  const [editName, setEditName] = useState(instrument);
  const [editAudioFile, setEditAudioFile] = useState(audioFile);

  // used for decorating buttons
  const currentQuarterBeat = (elapsedQuarterBeats + patternLength) % patternLength;

  const bpm = bpmDoc?.bpm || 120;
  const playing = bpmDoc?.playing || false;

  useEffect(() => {
    const loadInstrumentSound = async () => {
      const buffer = await loadSound(audioFile);
      setSoundBuffer(buffer);
    };
    loadInstrumentSound();
  }, [audioFile]);

  useEffect(() => {
    if (!gainNodeRef.current) {
      const ctx = getAudioContext();
      gainNodeRef.current = ctx.createGain();
      gainNodeRef.current.connect(getMasterGainNode());
    }
  }, []);

  useEffect(() => {
    if (gainNodeRef.current) {
      const gain = (!isMuted && (isSolo || !anyTrackSoloed)) ? 1 : 0;
      gainNodeRef.current.gain.setValueAtTime(gain, getAudioContext().currentTime);
    }
  }, [isMuted, isSolo, anyTrackSoloed]);

  const scheduleBeats = useCallback((scheduleStart_s, quarterBeatsToSchedule = 1, startBeatNumber = 0) => {
    if (!soundBuffer || !playing) return [];

    const ctx = getAudioContext();
    const events = [];

    let nextBeatNumber = (startBeatNumber) % patternLength;
    for (let i = 0; i < quarterBeatsToSchedule; i++) {
      if (beats[`beat-${instrument.toLowerCase()}-${nextBeatNumber}`]) {

        sourceNodeRef.current = ctx.createBufferSource();
        sourceNodeRef.current.buffer = soundBuffer;
        sourceNodeRef.current.connect(gainNodeRef.current);

        const beatTime_s = scheduleStart_s + (i * 15 / bpm);
        const event = scheduleBeat(sourceNodeRef.current, beatTime_s);
        if (event) events.push(event);
      }
    }

    return events;
  }, [instrument, soundBuffer, beats, bpm, playing]);

  const scheduleNextQuarterBeat = useCallback(() => {
    if (!soundBuffer || !playing || !ts || timesyncStartTime_ms.current === null) return;

    const currentTimesyncTime_ms = ts.now();
    const elapsedTimesyncTime_ms = currentTimesyncTime_ms - timesyncStartTime_ms.current;
    const currentAudioTime_s = getAudioContext().currentTime;

    const quarterBeatDuration_s = 15 / bpm;
    const quarterBeatDuration_ms = quarterBeatDuration_s * 1000;

    // Calculate the next quarter beat start time
    const nextQuarterBeatNumber = Math.ceil((elapsedTimesyncTime_ms + getHeadStart_ms()) / quarterBeatDuration_ms);
    const nextQuarterBeatStart_ms = nextQuarterBeatNumber * quarterBeatDuration_ms;

    // relative time to schedule
    const relativeTimeToSchedule_ms = nextQuarterBeatStart_ms - elapsedTimesyncTime_ms;
    const audioTimeToSchedule_s = currentAudioTime_s + (relativeTimeToSchedule_ms / 1000);

    // if (instrument === "Kick") {
    //   console.log("beat number: ", nextQuarterBeatNumber, " start ms: ", nextQuarterBeatStart_ms);
    //   // console.log("syncDelta_ms: ", syncDelta_ms);
    //   console.log("audioTimeToSchedule_s: ", audioTimeToSchedule_s);
    //   console.log("relativeTimeToSchedule_ms: ", relativeTimeToSchedule_ms);
    // }

    // Only schedule if it's in the future
    if (audioTimeToSchedule_s > currentAudioTime_s) {
      scheduledEventsRef.current = scheduleBeats(
        audioTimeToSchedule_s,
        1,
        nextQuarterBeatNumber
      );
    } else {
      console.warn("too late to schedule by ", (audioTimeToSchedule_s - currentAudioTime_s), " seconds");
    }

  }, [instrument, soundBuffer, beats, bpm, playing, ts, isMuted, isSolo]);

  useEffect(() => {
    if (ts && playing && !wasPlaying) {
      console.log("play started");
      setWasPlaying(true);
      // Reset timing references when playback starts
      timesyncStartTime_ms.current = bpmDoc?.lastChanged_ms || ts.now();
      // time between when play started and when we rendered
      const delta_s = (ts.now() - (bpmDoc?.lastChanged_ms || 0)) / 1000;
      // console.log("timesyncStartTime secs: ", timesyncStartTime_ms.current / 1000);

      // // Play the first beat immediately
      // if (soundBuffer && beats[`beat-${instrument.toLowerCase()}-0`]) {
      //   playSoundBuffer(soundBuffer);
      // }

      // Schedule the next beat
      scheduleNextQuarterBeat();
    } else if (!playing && wasPlaying) {
      timesyncStartTime_ms.current = null;
      // Clear any scheduled events when stopping
      clearScheduledEvents(scheduledEventsRef.current);
      scheduledEventsRef.current = [];
      setWasPlaying(false);
    }
  //}, [playing, ts, soundBuffer, beats, instrument, scheduleNextQuarterBeat]);
  }, [playing, ts, soundBuffer, beats, instrument, isMuted, isSolo]);

  useEffect(() => {
    if (ts && playing) {
      const quarterBeatInterval_ms = (15 / bpm) * 1000; // Duration of one quarter beat in milliseconds
      const intervalId = setInterval(scheduleNextQuarterBeat, quarterBeatInterval_ms);
      return () => clearInterval(intervalId);
    }
  }, [ts, playing, scheduleNextQuarterBeat, bpm, isMuted, isSolo]);

  useEffect(() => {
    setEditName(instrument);
    setEditAudioFile(audioFile);
  }, [instrument, audioFile]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isTemporary) {
      onSubmitNewTrack({ id: instrumentId, name: editName, audioFile: editAudioFile });
    } else {
      onNameChange(instrumentId, editName);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete the ${instrument} track?`)) {
      onDeleteTrack(instrumentId);
    }
  };

  const playSound = () => {
    if (soundBuffer) {
      playSoundBuffer(soundBuffer);
    } else {
      console.warn(`Sound for ${instrument} not loaded yet`);
    }
  };

  const renderBeatButtons = () => {
    const groups = [];
    for (let i = 0; i < 4; i++) {
      const groupButtons = [];
      for (let j = 0; j < 4; j++) {
        const index = i * 4 + j;
        groupButtons.push(
          <BeatButton 
            key={`${instrument}-${index}`}
            instrumentName={instrument} 
            beatIndex={index} 
            isActive={beats[`beat-${instrument.toLowerCase()}-${index}`] || false}
            isCurrent={playing && index === currentQuarterBeat}
            isStarting={elapsedQuarterBeats < 0 && playing}
            updateBeat={updateBeat}
            className={`beat-group-${i}`}
          />
        );
      }
      groups.push(
        <div key={`group-${i}`} className="beat-group">
          {groupButtons}
        </div>
      );
    }
    return groups;
  };

  const [showInfo, setShowInfo] = useState(false);
  const toggleInfo = () => {
    setShowInfo(!showInfo);
  };


  return (
    <div className="pattern">
      <div className="pattern-controls">
        <button className={`info-button ${showInfo ? 'active' : ''}`} onClick={toggleInfo}>ⓘ</button>
        <button className="instrument-button" onClick={playSound}>{instrument}</button>
        <button className={`mute-button ${isMuted ? 'active' : ''}`} onClick={onMuteToggle}>M</button>
        <button className={`solo-button ${isSolo ? 'active' : ''}`} onClick={onSoloToggle}>S</button>
      </div>
      {(showInfo || isTemporary) ? (
        <form onSubmit={handleSubmit} className="edit-form">
          <input 
            type="text" 
            value={editName} 
            onChange={(e) => setEditName(e.target.value)} 
            placeholder="Instrument Name"
          />
          <input 
            type="text" 
            value={editAudioFile} 
            onChange={(e) => setEditAudioFile(e.target.value)} 
            placeholder="Audio File URL"
          />
          <button type="submit">{isTemporary ? 'Add Track' : 'Update'}</button>
          {!isTemporary && (
            <button type="button" className="delete-button" onClick={handleDelete}>Delete</button>
          )}
        </form>
      ) : (
        <div className="beat-buttons">
          {renderBeatButtons()}
        </div>
      )}
    </div>
  );
};

export default Pattern;