import React, { createContext, useContext, useState, useEffect } from 'react';
// the timesync.js library sets a global variable, so we don't need to import it
let timesync = window.timesync;

const TimesyncContext = createContext();

export const useTimesync = () => useContext(TimesyncContext);

export const TimesyncProvider = ({ children, partyKitHost }) => {
  const [ts, setTs] = useState(null);

  useEffect(() => {
    const connectToTimesync = async () => {
      console.log("connecting to timesync");
      const timesyncURL = `https://${partyKitHost}/parties/partytime/w00t`;
      const tsInstance = timesync.create({
        server: timesyncURL,
        timeout: 1000,
        interval: 10000,
      });
      tsInstance.sync();

      // tsInstance.on('sync', (state) => {
      //   console.log("timesync sync ", state);
      // });

      setTs(tsInstance);
    };

    if (!ts) {
      connectToTimesync();
    }
  }, [partyKitHost, ts]);

  return (
    <TimesyncContext.Provider value={ts}>
      {children}
    </TimesyncContext.Provider>
  );
};