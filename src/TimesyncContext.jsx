import React, { createContext, useContext, useState, useEffect } from 'react';
// the timesync.js library sets a global variable, so we don't need to import it
let timesync = window.timesync;

const TimesyncContext = createContext();

export const useTimesync = () => useContext(TimesyncContext);

export const TimesyncProvider = ({ children, partyKitHost }) => {
  const [ts, setTs] = useState(null);

  useEffect(() => {
    const connectToTimesync = async () => {
      const timesyncURL = `https://${partyKitHost}/parties/partytime/w00t`;
      const tsInstance = timesync.create({
        server: timesyncURL,
        timeout: 1000,
      });
      setTs(tsInstance);
    };

    connectToTimesync();
  }, [partyKitHost]);

  return (
    <TimesyncContext.Provider value={ts}>
      {children}
    </TimesyncContext.Provider>
  );
};