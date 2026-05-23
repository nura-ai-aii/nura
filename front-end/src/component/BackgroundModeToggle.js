import React from 'react';
import './BackgroundModeToggle.css';
import shortcutIcon from '../blobshortcutscr.png';

export default function BackgroundModeToggle({ active, onClick }) {
  return (
    <div className="background-toggle-container">
      <button 
        className={`bg-toggle-fab ${active ? 'active' : ''}`}
        onClick={onClick}
        title={active ? "Restore Full Console" : "Activate Background Assistant Mode"}
      >
        <img 
          src={shortcutIcon} 
          alt="Toggle Background Assistant" 
          className="bg-toggle-fab-img" 
        />
        <div className="glowing-ring"></div>
      </button>
    </div>
  );
}
