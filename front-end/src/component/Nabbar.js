import React, { useState } from 'react';
import './Navbar.css';
import { signOutUser } from '../firebaseAuth';
import { getChatSessions, deleteChatSession } from '../historyService';
const logo = '/new-logo-hexper.png';

export default function Nabbar({ 
  showStatus, 
  setShowStatus, 
  showTerminal, 
  setShowTerminal, 
  apiHealth, 
  showHUD, 
  setShowHUD, 
  currentUser, 
  setCurrentUser,
  onNewChat,
  onLoadSession 
}) {
  const [showAbout, setShowAbout] = useState(false);
  const [showOwner, setShowOwner] = useState(false);
  const [alertText, setAlertText] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historySessions, setHistorySessions] = useState([]);

  const fetchHistory = async () => {
    if (currentUser) {
      const sessions = await getChatSessions(currentUser.uid);
      setHistorySessions(sessions);
    }
  };

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    if (currentUser) {
      await deleteChatSession(currentUser.uid, sessionId);
      fetchHistory();
    }
  };

  const handleAction = (text) => {
    setAlertText(text);
    setShowAlert(true);
    setTimeout(() => {
      setShowAlert(false);
    }, 3000);
  };

  const isOnline = apiHealth && apiHealth.backend === 'ok';

  return (
    <>
      <nav className="futuristic-navbar">
        {/* Futuristic SVG Frame Overlay - creates glowing brackets, tech lines & chamfered corners */}
        <div className="navbar-frame-container">
          <svg className="navbar-svg-frame" viewBox="0 0 1200 80" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Outer Glowing Tech Border */}
            <path d="M20 5 L1180 5 L1195 20 L1195 60 L1180 75 L20 75 L5 60 L5 20 Z" stroke="url(#navbar-gradient)" strokeWidth="1.5" fill="rgba(3, 7, 18, 0.75)" filter="drop-shadow(0 0 5px rgba(0, 245, 255, 0.35))" />
            
            {/* Corner Bracket Details */}
            <path d="M5 25 L5 15 L15 5" stroke="#00F5FF" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M1195 25 L1195 15 L1185 5" stroke="#00F5FF" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M5 55 L5 65 L15 75" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M1195 55 L1195 65 L1185 75" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />
            
            {/* Slanted Tech Grates (decorations on outer bounds) */}
            <line x1="25" y1="12" x2="35" y2="22" stroke="rgba(0, 245, 255, 0.4)" strokeWidth="1.5" />
            <line x1="32" y1="12" x2="42" y2="22" stroke="rgba(0, 245, 255, 0.4)" strokeWidth="1.5" />
            <line x1="39" y1="12" x2="49" y2="22" stroke="rgba(0, 245, 255, 0.4)" strokeWidth="1.5" />

            <line x1="1175" y1="12" x2="1165" y2="22" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="1.5" />
            <line x1="1168" y1="12" x2="1158" y2="22" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="1.5" />
            <line x1="1161" y1="12" x2="1151" y2="22" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="1.5" />

            {/* Gradient Definitions */}
            <defs>
              <linearGradient id="navbar-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00F5FF" />
                <stop offset="30%" stopColor="#0055ff" />
                <stop offset="70%" stopColor="#7a00ff" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>

          {/* Bottom hanging plate displaying version and secure link info */}
          <div className="navbar-bottom-plate">
            <svg className="bottom-plate-svg" viewBox="0 0 240 25" preserveAspectRatio="none" fill="none">
              <path d="M0 0 L15 25 L225 25 L240 0 Z" fill="rgba(3, 7, 18, 0.9)" stroke="url(#navbar-gradient)" strokeWidth="1.5" />
            </svg>
            <div className="bottom-plate-content">
              <span className="tech-version">v2.0.0</span>
              <span className="divider">|</span>
              <span className="secure-connection">
                <svg className="lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Secure Connection
              </span>
            </div>
          </div>
        </div>

        {/* Brand Information Section (Left) */}
        <div className="navbar-brand">
          <div className="hex-logo-wrapper">
            <div className="hex-glow"></div>
            <img src={logo} alt="Hexpar AI Logo" className="navbar-logo-img" />
          </div>
          <div className="brand-text-container">
            <span className="brand-name">Hexpar <span className="brand-ai">AI</span></span>
            <span className="brand-subtitle">Powering the Future.</span>
          </div>
        </div>

        {/* Navigation Core Tabs (Center) */}
        <div className="navbar-tabs-container">
          <ul className="navbar-links">
            <li className="nav-item">
              <button 
                className={`nav-tab-btn ${showTerminal && !showStatus ? 'active' : ''}`}
                onClick={() => {
                  setShowTerminal(true);
                  setShowStatus(false);
                }}
              >
                <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <div className="tab-labels">
                  <span className="tab-title">Chat</span>
                </div>
                <div className="active-indicator"></div>
              </button>
            </li>

            <li className="nav-item">
              <button 
                className={`nav-tab-btn ${showStatus && !showTerminal ? 'active' : ''}`}
                onClick={() => {
                  setShowStatus(true);
                  setShowTerminal(false);
                }}
              >
                <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
                <div className="tab-labels">
                  <span className="tab-title">Status</span>
                  <span className={`tab-subtitle ${isOnline ? 'online' : 'offline'}`}>
                    <span className="status-indicator-dot"></span>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                <div className="active-indicator"></div>
              </button>
            </li>

            <li className="nav-item">
              <button 
                className={`nav-tab-btn ${showHUD ? 'active' : ''}`}
                onClick={() => setShowHUD(!showHUD)}
              >
                <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
                <div className="tab-labels">
                  <span className="tab-title">System</span>
                </div>
                <div className="active-indicator"></div>
              </button>
            </li>

            {currentUser && (
              <li className="nav-item">
                <button 
                  className={`nav-tab-btn ${showHistory ? 'active' : ''}`}
                  onClick={() => {
                    setShowHistory(true);
                    setShowAbout(false);
                    setShowOwner(false);
                    fetchHistory();
                  }}
                >
                  <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                  </svg>
                  <div className="tab-labels">
                    <span className="tab-title">History</span>
                  </div>
                  <div className="active-indicator"></div>
                </button>
              </li>
            )}

            <li className="nav-item">
              <button 
                className={`nav-tab-btn ${showAbout ? 'active' : ''}`}
                onClick={() => {
                  setShowAbout(true);
                  setShowOwner(false);
                }}
              >
                <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <div className="tab-labels">
                  <span className="tab-title">About</span>
                </div>
                <div className="active-indicator"></div>
              </button>
            </li>

            <li className="nav-item">
              <button 
                className={`nav-tab-btn ${showOwner ? 'active' : ''}`}
                onClick={() => {
                  setShowOwner(true);
                  setShowAbout(false);
                }}
              >
                <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <div className="tab-labels">
                  <span className="tab-title">Owner</span>
                </div>
                <div className="active-indicator"></div>
              </button>
            </li>
          </ul>
        </div>

        {/* High-Tech System Actions (Right) */}
        <div className="navbar-actions">
          {currentUser && (
            <button className="btn-logout" onClick={() => { signOutUser(); }}>
              <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign Out
            </button>
          )}
          
          <button className="btn-signup" onClick={() => handleAction('[ARCH-USER REGISTERED] USER PROFILE SECURED AND ENCRYPTED.')}>
            Sign Up
            <svg className="signup-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Futuristic Alert Notification Overlay */}
      {showAlert && (
        <div className="high-tech-alert-toast">
          <div className="toast-glow"></div>
          <div className="toast-content">
            <span className="toast-dot-blink"></span>
            <span className="toast-message">{alertText}</span>
          </div>
        </div>
      )}

      {/* ABOUT MODAL DOCK OVERLAY */}
      {showAbout && (
        <div className="sci-fi-modal-overlay" onClick={() => setShowAbout(false)}>
          <div className="sci-fi-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>◆ SYSTEM DEFINITION FILE</span>
              <button className="modal-close" onClick={() => setShowAbout(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="system-orb-mini">
                <div className="orb-core"></div>
                <div className="orb-ring"></div>
              </div>
              <h3>Hexpar AI v2.0.0</h3>
              <p className="modal-desc">Quantum-Sentient Desktop Companion & Cognitive Core Interface.</p>
              <div className="specs-table">
                <div className="spec-row"><span>COGNITIVE CORE</span><span className="accent-cyan">GEMINI 2.5 FLASH / GPT-5-MINI</span></div>
                <div className="spec-row"><span>REASONING PIPELINE</span><span className="accent-cyan">GROQ ULTRA-LOW LATENCY</span></div>
                <div className="spec-row"><span>TTS EMOTION SYNTH</span><span className="accent-purple">EDGE-TTS NEURAL PIPELINE</span></div>
                <div className="spec-row"><span>RELATIONSHIP LINK</span><span className="accent-purple">NEURAL SYNC FAMILIARITY V4.1</span></div>
              </div>
            </div>
            <div className="modal-footer">
              SECURE SYSTEM ENCRYPTION VALIDATED
            </div>
          </div>
        </div>
      )}

      {/* OWNER PROFILE MODAL OVERLAY */}
      {showOwner && (
        <div className="sci-fi-modal-overlay" onClick={() => setShowOwner(false)}>
          <div className="sci-fi-modal-content owner-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>◆ SYSTEM OWNER CREDENTIALS</span>
              <button className="modal-close" onClick={() => setShowOwner(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="avatar-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                <div className="avatar-scanning-bar"></div>
              </div>
              <h3>Master Nur Mohammad Mandal</h3>
              <p className="owner-title">Primary Developer & Arch-System Owner</p>
              <div className="credentials-list">
                <div className="cred-item"><span>ACCESS LEVEL</span><span className="accent-cyan">OMNIPOTENT (LEVEL 10)</span></div>
                <div className="cred-item"><span>SYNC RELATIONSHIP</span><span className="accent-purple font-glowing">SOUL CONTEXT LINKED 😭</span></div>
                <div className="cred-item"><span>AUTHENTICATION</span><span className="success-text">PASSED (BIO-SIGN SYNCED)</span></div>
              </div>
            </div>
            <div className="modal-footer">
              ARCH-OWNER PRIVILEGES FULLY ENGAGED
            </div>
          </div>
        </div>
      )}
      {/* HISTORY MODAL DOCK OVERLAY */}
      {showHistory && (
        <div className="sci-fi-modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="sci-fi-modal-content history-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>◆ NEURAL MEMORY ARCHIVES</span>
              <button className="modal-close" onClick={() => setShowHistory(false)}>✕</button>
            </div>
            <div className="modal-body history-body" style={{ padding: '1.25rem' }}>
              
              {/* New Conversation Button */}
              <button 
                className="new-chat-history-btn"
                onClick={() => {
                  if (onNewChat) onNewChat();
                  setShowHistory(false);
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'rgba(0, 245, 255, 0.1)',
                  border: '1px dashed #00F5FF',
                  borderRadius: '12px',
                  color: '#00F5FF',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease',
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                New Conversation
              </button>

              <div className="history-list-wrap" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
                {historySessions.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '2rem 0', fontFamily: 'Inter, sans-serif' }}>
                    No saved conversations found.
                  </div>
                ) : (
                  historySessions.map((session) => (
                    <div 
                      key={session.sessionId}
                      className="history-item-row"
                      onClick={() => {
                        if (onLoadSession) onLoadSession(session.sessionId, session.messages);
                        setShowHistory(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontFamily: 'Inter, sans-serif'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden', width: '85%' }}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'rgba(0, 245, 255, 0.7)', flexShrink: 0 }}>
                          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                        </svg>
                        <span style={{ fontSize: '0.9rem', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {session.title || "Untitled Conversation"}
                        </span>
                      </div>
                      
                      {/* Delete Session Icon */}
                      <button
                        className="delete-history-item-btn"
                        onClick={(e) => handleDeleteSession(e, session.sessionId)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'rgba(255,255,255,0.4)',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '6px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="modal-footer">
              SECURE SYNCED NEURAL ARCHIVES
            </div>
          </div>
        </div>
      )}
    </>
  );
}
