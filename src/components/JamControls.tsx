import React, { useState, useEffect } from 'react';

const JamControls = () => {
  const [newJamTitle, setNewJamTitle] = useState('');

  useEffect(() => {
    const pathSegments = document.location.pathname.split('/');
    const currentJamId = pathSegments[2] || '';
    if (!currentJamId) {
      window.location.href = '/jam/welcome';
    }
    setNewJamTitle(currentJamId);
  }, []);

  const handleJamTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewJamTitle(e.target.value);
  };

  const handleJoinJam = () => {
    if (newJamTitle) {
      window.location.href = `/jam/${newJamTitle}`;
    }
  };

  return (
    <div className="top-controls">
      <div className="button-group">
        <input
          type="text"
          className="jam-input"
          value={newJamTitle}
          onChange={handleJamTitleChange}
          placeholder="Enter jam title"
        />
        <button className="control-button join-button" onClick={handleJoinJam}>
          Join Jam
        </button>
      </div>
    </div>
  );
};

export default JamControls;
