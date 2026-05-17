import React, { useState, useRef, useEffect } from 'react';
import './LanguageSelector.css';

export default function LanguageSelector({ speechLang, setSpeechLang }) {
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

  const languages = [
    { code: 'en-US', label: 'English (US)' },
    { code: 'en-IN', label: 'English (India)' },
    { code: 'hi-IN', label: 'Hindi (India)' },
    { code: 'bn-IN', label: 'Bengali (India)' },
    { code: 'kn-IN', label: 'Kannada (India)' }
  ];

  return (
    <div className="language-selector-container" ref={menuRef}>
      <button 
        className={`lang-fab ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Change Language"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00ffe1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
      </button>

      {isOpen && (
        <div className="language-menu">
          {languages.map(lang => (
            <button
              key={lang.code}
              className={`lang-option ${speechLang === lang.code ? 'selected' : ''}`}
              onClick={() => {
                setSpeechLang(lang.code);
                setIsOpen(false);
              }}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
