import React, { useState, useRef, useEffect } from 'react';
import './LanguageSelector.css';

export default function LanguageSelector({ speechLang, setSpeechLang }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const languages = [
    { code: 'en-US', label: '1. English (US)' },
    { code: 'zh-CN', label: '2. Chinese (Mandarin)' },
    { code: 'es-ES', label: '3. Spanish (Spain)' },
    { code: 'hi-IN', label: '4. Hindi (India)' },
    { code: 'ar-SA', label: '5. Arabic (Saudi Arabia)' },
    { code: 'pt-PT', label: '6. Portuguese (Portugal)' },
    { code: 'fr-FR', label: '7. French (France)' },
    { code: 'bn-IN', label: '8. Bengali (India)' },
    { code: 'ru-RU', label: '9. Russian (Russia)' },
    { code: 'ja-JP', label: '10. Japanese (Japan)' },
    { code: 'de-DE', label: '11. German (Germany)' },
    { code: 'ko-KR', label: '12. Korean (South Korea)' },
    { code: 'tr-TR', label: '13. Turkish (Turkey)' },
    { code: 'it-IT', label: '14. Italian (Italy)' },
    { code: 'vi-VN', label: '15. Vietnamese (Vietnam)' },
    { code: 'id-ID', label: '16. Indonesian (Indonesia)' },
    { code: 'ur-PK', label: '17. Urdu (Pakistan)' },
    { code: 'fa-IR', label: '18. Persian (Iran)' },
    { code: 'th-TH', label: '19. Thai (Thailand)' },
    { code: 'pl-PL', label: '20. Polish (Poland)' },
    { code: 'nl-NL', label: '21. Dutch (Netherlands)' },
    { code: 'ta-IN', label: '22. Tamil (India)' },
    { code: 'te-IN', label: '23. Telugu (India)' },
    { code: 'mr-IN', label: '24. Marathi (India)' },
    { code: 'gu-IN', label: '25. Gujarati (India)' },
    { code: 'kn-IN', label: '26. Kannada (India)' },
    { code: 'ml-IN', label: '27. Malayalam (India)' },
    { code: 'pa-IN', label: '28. Punjabi (India)' },
    { code: 'sw-KE', label: '29. Swahili (Kenya)' },
    { code: 'uk-UA', label: '30. Ukrainian (Ukraine)' }
  ];

  const filteredLanguages = languages.filter(lang => 
    lang.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <input 
            type="text"
            className="lang-search-input"
            placeholder="Search language..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          <div className="lang-options-list">
            {filteredLanguages.map(lang => (
              <button
                key={lang.code}
                className={`lang-option ${speechLang === lang.code ? 'selected' : ''}`}
                onClick={() => {
                  setSpeechLang(lang.code);
                  setIsOpen(false);
                  setSearchQuery("");
                }}
              >
                {lang.label}
              </button>
            ))}
            {filteredLanguages.length === 0 && (
              <div className="lang-no-results">No languages found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
