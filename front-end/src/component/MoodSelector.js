import React, { useState, useRef, useEffect } from 'react';
import './MoodSelector.css';

export default function MoodSelector({ activeMood, setActiveMood }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const moods = [
    { id: 'scifi', label: 'SCI-FI MODE' },
    { id: 'hw', label: 'HW MODE' },
    { id: 'islamic', label: 'ISLAMIC MODE' }
  ];

  const getActiveLabel = () => {
    const found = moods.find(m => m.id === activeMood);
    return found ? found.label : 'SCI-FI MODE';
  };

  return (
    <div className="mood-selector-container" ref={menuRef}>
      <button 
        className={`mood-fab ${isOpen ? 'active' : ''} mood-${activeMood}`}
        onClick={() => setIsOpen(!isOpen)}
        title={`Active Mood: ${getActiveLabel()}`}
      >
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke={activeMood === 'hw' ? '#ff5500' : '#00ffe1'} 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="mood-fab-icon"
        >
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          <path d="M12 18a6 6 0 0 0 6-6H6a6 6 0 0 0 6 6z" />
          <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" />
          <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" />
        </svg>
      </button>

      {isOpen && (
        <div className="mood-menu">
          <div className="mood-menu-header">◆ SELECT THEME MOOD</div>
          {moods.map(mood => (
            <button
              key={mood.id}
              className={`mood-option ${activeMood === mood.id ? 'selected' : ''}`}
              onClick={() => {
                setActiveMood(mood.id);
                setIsOpen(false);
              }}
            >
              <span className={`mood-dot dot-${mood.id}`} />
              {mood.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
