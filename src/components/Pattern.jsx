import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFireproof } from 'use-fireproof';
import BeatButton from './BeatButton';
import InstrumentInfo from './InstrumentInfo';
import { loadSound, clearScheduledEvents, getAudioContext, scheduleBeat, getHeadStart_ms, getMasterGainNode, playSoundBuffer } from '../audioUtils';
import { useTimesync } from '../TimesyncContext';
import './Pattern.css';
import TrackForm from './TrackForm';

const Pattern = ({ 
  instrumentId,
  instrument,
  audioFile,
  mimeType,
  referenceType,
  _files,
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
  onDeleteTrack,
  isDefaultInstrument,
  dbName,
  masterMuted,
  existingTrackNames
}) => {
  const { database } = useFireproof(dbName);
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [soundBuffer, setSoundBuffer] = useState(null);
  const [wasPlaying, setWasPlaying] = useState(false);
  const gainNodeRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const ts = useTimesync();
  const patternLength = 16; // 16 quarter beats = 4 full beats
  const scheduledEventsRef = useRef([]);
  const timesyncStartTime_ms = useRef(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showChangeForm, setShowChangeForm] = useState(false);

  // used for decorating buttons
  const currentQuarterBeat = (elapsedQuarterBeats + patternLength) % patternLength;

  const bpm = bpmDoc?.bpm || 120;
  const playing = bpmDoc?.playing || false;

  useEffect(() => {
    const loadAudio = async () => {
      setIsLoading(true);
      try {
        let audioData;
        if (referenceType === 'url') {
          audioData = audioFile;
        } else if (referenceType === 'database') {
          const fileName = Object.keys(_files)[0];
          const file = await _files[fileName].file();
          audioData = URL.createObjectURL(file);
        }
        const buffer = await loadSound(audioData);
        setSoundBuffer(buffer);
      } catch (error) {
        console.error('Error loading audio:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAudio();
  }, [referenceType, audioFile, _files]);

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
      if (beats[`beat-${instrumentId}-${nextBeatNumber}`]) {

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
      // if (soundBuffer && beats[`beat-${instrumentId}-0`]) {
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
  }, [playing, ts, soundBuffer, beats, instrument, isMuted, isSolo]);

  useEffect(() => {
    if (ts && playing) {
      const quarterBeatInterval_ms = (15 / bpm) * 1000; // Duration of one quarter beat in milliseconds
      const intervalId = setInterval(scheduleNextQuarterBeat, quarterBeatInterval_ms);
      return () => clearInterval(intervalId);
    }
  }, [ts, playing, scheduleNextQuarterBeat, bpm, isMuted, isSolo]);

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
            key={`${instrumentId}-${index}`}
            instrumentId={instrumentId}
            beatIndex={index} 
            isActive={beats[`beat-${instrumentId}-${index}`] || false}
            isCurrent={playing && index === currentQuarterBeat}
            isStarting={elapsedQuarterBeats < 0 && playing}
            updateBeat={updateBeat}
            className={`beat-group-${i}`}
            isSilent={isMuted || (anyTrackSoloed && !isSolo) || masterMuted}
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

  const isSilent = isMuted || (anyTrackSoloed && !isSolo) || masterMuted;

  return (
    <div className={`pattern ${isSilent ? 'silent' : ''}`}>
      <div className="pattern-controls">
        <button
          className={`info-button ${showInfo ? 'active' : ''}`} 
          onClick={() => setShowInfo(!showInfo)}
          role="button"
          tabIndex="0"
          aria-label="Information"
        >
          <span className="material-icons">info</span>
        </button>
        <button className="instrument-button" onClick={playSound} role="button" tabIndex="0">{instrument}</button>
        <button 
          className={`mute-button ${isMuted ? 'active' : ''}`} 
          onClick={onMuteToggle}
          role="button"
          tabIndex="0"
          aria-label="Mute"
        >
          <span className="material-icons">hearing_disabled</span>
        </button>
        <button 
          className={`solo-button ${isSolo ? 'active' : ''}`} 
          onClick={onSoloToggle}
          role="button"
          tabIndex="0"
          aria-label="Solo"
        >
          <span className="material-icons">hearing</span>
        </button>
      </div>
      {showInfo ? (
        <div className="info-panel">
          {!showChangeForm && (
            <button className="track-change-button" onClick={() => setShowChangeForm(true)} role="button" tabIndex="0">Change</button>
          )}
          {(!isDefaultInstrument && !showChangeForm) && (
            <button className="track-delete-button" onClick={() => onDeleteTrack(instrumentId)} role="button" tabIndex="0">Delete</button>
          )}
        </div>
      ) : (
        <div className="beat-buttons">
          {renderBeatButtons()}
        </div>
      )}
      {showChangeForm && (
        <TrackForm
          onSubmit={(newData) => {
            onNameChange(instrumentId, newData.name);
            // Here you would also update the audio file, mimeType, etc.
            setShowChangeForm(false);
          }}
          onCancel={() => setShowChangeForm(false)}
          existingTrackNames={existingTrackNames}
          initialData={{ name: instrument, audioFile, mimeType, referenceType }}
        />
      )}
      {isLoading && <div>Loading audio...</div>}
    </div>
  );
};

export default Pattern;