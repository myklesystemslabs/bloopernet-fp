import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useParams, useNavigate } from 'react-router-dom';
import AudioMotionVisualizer from './components/AudioMotionVisualizer';
import { getAnalyserNode, getDefaultLatency } from './audioUtils';
import { useFireproof } from 'use-fireproof';
import { ConnectS3 } from '@fireproof/aws'
import { ConnectPartyKit } from '@fireproof/partykit'
import PatternSet from './components/PatternSet';
import TopControls from './components/TopControls';
import { TimesyncProvider } from './TimesyncContext';
import './App.css';
import InviteButton from './components/InviteButton';


const partyCxs = new Map(); // q: why is this global?
function partykitS3({ name, blockstore }, partyHost, refresh) {
  if (!name) throw new Error('database name is required')
  if (!refresh && partyCxs.has(name)) {
    return partyCxs.get(name)
  }
  const s3conf = { // example values, replace with your own by deploying https://github.com/fireproof-storage/valid-cid-s3-bucket
    upload: import.meta.env.VITE_S3PARTYUP,
    download: import.meta.env.VITE_S3PARTYDOWN
  }
  const s3conn = new ConnectS3(s3conf.upload, s3conf.download, '')
  s3conn.connectStorage(blockstore)

  if (!partyHost) {
    console.warn('partyHost not provided, using localhost:1999')
    partyHost = 'http://localhost:1999'
  }
  const connection = new ConnectPartyKit({ name, host: partyHost })
  connection.connectMeta(blockstore)
  partyCxs.set(name, connection)
  return connection
}


function App() {
  const instruments = ['Kick', 'Snare', 'Hi-hat', 'Tom', 'Clap'];
  const { jamId } = useParams();
  const navigate = useNavigate();
  
  //////////////////////////////////////////////////////////////////////////////
  // URL path & Jam ID handling:
  //////////////////////////////////////////////////////////////////////////////
  // Truncate, sanitize, and validate jamId
  const truncatedJamId = jamId ? jamId.slice(0, 40) : '';
  const sanitizedJamId = truncatedJamId.replace(/[^a-zA-Z0-9-]/g, '');
  const isValidJamId = /^[a-zA-Z0-9-]+$/.test(sanitizedJamId);
  
  useEffect(() => {
    // Redirect to root if jamId is invalid or if the path is neither root nor a valid /jam/* path
    if ((jamId && !isValidJamId) || (jamId != sanitizedJamId) || (sanitizedJamId && window.location.pathname !== '/' && !window.location.pathname.startsWith('/jam/'))) {
      navigate('/', { replace: true });
    }
  }, [jamId, isValidJamId, navigate]);

  useEffect(() => {
    // If there's a path that's not / or /jam/*, redirect to /
    if (window.location.pathname !== '/' && !window.location.pathname.startsWith('/jam/')) {
      navigate('/', { replace: true });
    }
  }, [navigate]);


  //////////////////////////////////////////////////////////////////////////////
  // Database setup:
  //////////////////////////////////////////////////////////////////////////////
  // Construct the database name based on the jamId
  const firstPathSegment = document.location.pathname.split('/')[1];  
  const baseDbName = (import.meta.env.VITE_DBNAME || 'bloop-machine') + (firstPathSegment ? '-' + firstPathSegment : '');
  const dbName = isValidJamId ? `${baseDbName}-${sanitizedJamId}` : baseDbName;

  // connect to the database
  const { database, useLiveQuery } = useFireproof(dbName);

  // connect to the partykit server
  const partyKitHost = import.meta.env.VITE_REACT_APP_PARTYKIT_HOST;
  if (partyKitHost) {
    const connection = partykitS3(database, partyKitHost);
    console.log("Connection", connection);
  } else {
    console.warn("No connection");
  }

  //////////////////////////////////////////////////////////////////////////////
  // Head start calculation for latency compensation:
  //////////////////////////////////////////////////////////////////////////////
  let minimumHeadStart_ms = 200; 
  const [headStart_ms, setHeadStart_ms] = useState(0);
  const [localLatency, setLocalLatency] = useState(getDefaultLatency());
  // Fetch all device records to calculate head start based on the max latency
  // const devices = useLiveQuery('type', { key: 'device' });

  useEffect(() => {
    // if (devices) {
    //   const maxLatency = Math.max(...devices.docs.map(device => device.latency || 0));

      // This is the sophisticated way where the faster devices slow down to the speed of the slowest device
      // const newHeadStart = Math.floor(Math.max(maxLatency - localLatency))+minimumHeadStart_ms ;
      // unfortunately the other clients can stutter a lot when that happen, so one user can screw everyone else.

      // This is the simpler way where the slow devices slow down even more, to sync with the previous step
      const newHeadStart = localLatency+minimumHeadStart_ms ;

      setHeadStart_ms(newHeadStart);
      // console.log("newHeadStart: ", newHeadStart);
    // }
  //}, [devices, localLatency]);
  }, [localLatency]);

  const updateLocalLatency = useCallback((newLatency) => {
    setLocalLatency(newLatency);
  }, []);


  //////////////////////////////////////////////////////////////////////////////
  // UI state:
  //////////////////////////////////////////////////////////////////////////////

  const [isExpert, setIsExpert] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [visualsEnabled, setVisualsEnabled] = useState(() => {
    const saved = localStorage.getItem('visualsEnabled');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [analyserNode, setAnalyserNode] = useState(null);

  const toggleExpert = () => {
    setIsExpert(!isExpert);
  };

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  const handleLongPress = (callback, duration = 500) => {
    let timer;
    const start = () => {
      timer = setTimeout(callback, duration);
    };
    const clear = () => {
      clearTimeout(timer);
    };

    return {
      onTouchStart: start,
      onTouchEnd: clear,
      onTouchMove: clear,
      onMouseDown: start,
      onMouseUp: clear,
      onMouseLeave: clear
    };
  };

  const longPressHandlers = handleLongPress(toggleExpert);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    // Fix for mobile viewport height
    const appHeight = () => {
      const doc = document.documentElement;
      doc.style.setProperty('--app-height', `${window.innerHeight}px`);
    };
    window.addEventListener('resize', appHeight);
    appHeight();
    return () => window.removeEventListener('resize', appHeight);
  }, []);

  const toggleVisuals = () => {
    setVisualsEnabled(prev => {
      const newState = !prev;
      localStorage.setItem('visualsEnabled', JSON.stringify(newState));
      return newState;
    });
  };

  //////////////////////////////////////////////////////////////////////////////
  // Beat state:
  //////////////////////////////////////////////////////////////////////////////

  let beats = {};
  const result = useLiveQuery('type', { key: 'beat' });
  result.rows.forEach(row => {
    // it looks like after we delete an instrument, a null row can appear here.
    if (row.doc) {
      beats[row.doc._id] = row.doc.isActive;
    } else {
      console.log("null record in live query", row);
    }
  });

  //////////////////////////////////////////////////////////////////////////////
  // Analyser node:
  //////////////////////////////////////////////////////////////////////////////  
  // TODO: audiovisualizer should fetch this itself
  useEffect(() => {
    // Get the analyserNode from audioUtils
    const analyser = getAnalyserNode();
    setAnalyserNode(analyser);
  }, []);


  //////////////////////////////////////////////////////////////////////////////
  // New track form (pass click from TopControls to ui in PatternSet):
  //////////////////////////////////////////////////////////////////////////////  
  const [showNewTrackForm, setShowNewTrackForm] = useState(false);

  const handleAddTrack = () => {
    setShowNewTrackForm(true);
  };

  const handleCancelNewTrack = () => {
    setShowNewTrackForm(false);
  };

  return (
    <TimesyncProvider partyKitHost={partyKitHost}>
      <div className={`app ${theme}`}>
        <AudioMotionVisualizer 
          analyserNode={analyserNode} 
          visualsEnabled={visualsEnabled} 
        />
        <div className="app-content" style={{ height: 'var(--app-height)' }}>
          <h1 className="app-title" {...longPressHandlers}>Bloopernet FP-808</h1>
          <TopControls 
            dbName={dbName} 
            isExpert={isExpert} 
            toggleTheme={toggleTheme} 
            theme={theme}
            toggleVisuals={toggleVisuals}
            visualsEnabled={visualsEnabled}
            onAddTrack={handleAddTrack}
            headStart_ms={headStart_ms}
            updateLocalLatency={updateLocalLatency}
          />
          <PatternSet 
            dbName={dbName} 
            instruments={instruments} 
            beats={beats} 
            showNewTrackForm={showNewTrackForm}
            onCancelNewTrack={handleCancelNewTrack}
            headStart_ms={headStart_ms}
          />
					<AppInfo />
          <InviteButton />
        </div>
      </div>
    </TimesyncProvider>
  );
}

function RoutedApp() {
  return (
    <Router>
      <Routes>
        <Route path="/jam/:jamId" element={<App />} />
        <Route path="/" element={<App />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default RoutedApp;

const AppInfo = () => (
  <footer>
    <p>
      <a href="https://github.com/fireproof-storage/bloopernet">Fork us on GitHub</a>, try <a href="https://fireproof.storage">Fireproof</a>, and learn more about the <a href="https://bikeportland.org/2024/06/14/bloops-and-bleeps-ride-gives-cycling-new-sounds-387546">Bloopernet Project</a>.
    </p>
  </footer>
);
