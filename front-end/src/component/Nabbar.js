import React from 'react';
import './Navbar.css';
import logo from '../images/hexperai.png';

export default function Nabbar({ showStatus, setShowStatus, showTerminal, setShowTerminal, apiHealth, showHUD, setShowHUD }) {

  return (
    <nav className="futuristic-navbar">
      {/* Background element that handles the clip-path and glass effect */}
      <div className="navbar-background"></div>

      <div className="navbar-logo">
        <img src={logo} alt="Hexpar AI Logo" className="navbar-logo-img" />
        Hexpar AI
      </div>
      <ul className="navbar-links">
        <li className="nav-item">
          <button 
            className={`nav-button ${showStatus ? 'active' : ''}`}
            onClick={() => setShowStatus(!showStatus)}
          >
            STATUS
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-button ${showTerminal ? 'active' : ''}`}
            onClick={() => setShowTerminal(!showTerminal)}
          >
            CHAT
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-button ${showHUD ? 'active' : ''}`}
            onClick={() => setShowHUD && setShowHUD(!showHUD)}
          >
            SYSTEMS
          </button>
        </li>
      </ul>
      <div className="navbar-status" title={apiHealth ? `Backend: ${apiHealth.backend} | Gemini: ${apiHealth.gemini} | Groq: ${apiHealth.groq} | OpenRouter: ${apiHealth.openrouter}` : 'Checking...'}>
        <span
          className="status-dot"
          style={{
            backgroundColor: (!apiHealth || apiHealth.backend !== 'ok') ? '#ff4444' :
              (apiHealth.groq !== 'connected' || apiHealth.gemini !== 'connected' || apiHealth.openrouter !== 'connected') ? '#ffb400' : '#00ffe1',
            boxShadow: (!apiHealth || apiHealth.backend !== 'ok')
              ? '0 0 10px #ff4444, 0 0 20px #ff4444'
              : (apiHealth.groq !== 'connected' || apiHealth.gemini !== 'connected' || apiHealth.openrouter !== 'connected')
              ? '0 0 10px #ffb400, 0 0 20px #ffb400'
              : '0 0 10px #00ffe1, 0 0 20px #00ffe1',
          }}
        />
        <span style={{
          color: (!apiHealth || apiHealth.backend !== 'ok') ? '#ff4444' :
            (apiHealth.groq !== 'connected' || apiHealth.gemini !== 'connected' || apiHealth.openrouter !== 'connected') ? '#ffb400' : '#00ffe1'
        }}>
          {!apiHealth ? 'CHECKING...' :
            apiHealth.backend !== 'ok' ? 'OFFLINE' :
            (apiHealth.groq !== 'connected' || apiHealth.gemini !== 'connected' || apiHealth.openrouter !== 'connected') ? 'API ERROR' : 'ONLINE'}
        </span>
      </div>
    </nav>
  );
}
