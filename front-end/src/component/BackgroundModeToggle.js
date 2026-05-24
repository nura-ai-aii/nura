import React from 'react';
import './BackgroundModeToggle.css';
import shortcutIcon from '../images/blobshortcutscr.png';

export default function BackgroundModeToggle({ active, onClick }) {
  return (
    <div className="background-toggle-container">
      <button 
        className={`bg-toggle-fab ${active ? 'active' : ''}`}
        onClick={onClick}
        title={active ? "Restore Full Console" : "Activate Mood Changing Mode"}
      >
        <img 
          src={shortcutIcon} 
          alt="Toggle Mood Changing Mode" 
          className="bg-toggle-fab-img" 
        />
        <div className="glowing-ring"></div>
      </button>
    </div>
  );
}
