import React, { useState, useEffect, useRef } from 'react';
import './PremiumUI.css';
import { getChatSessions, deleteChatSession } from '../historyService';
import { signOutUser } from '../firebaseAuth';
import { emitAlert } from './AlertSystem';

export default function PremiumUI({
  currentUser,
  chatHistory = [],
  transcript,
  aiResponse,
  interactionState,
  speechLang,
  setSpeechLang,
  selectedModel,
  setSelectedModel,
  activeMood,
  setActiveMood,
  blobColor,
  setBlobColor,
  blobSize,
  setBlobSize,
  apiHealth,
  apiStatus,
  generatedImage,
  setGeneratedImage,
  onSendMessage,
  onAnalyzeImage,
  handleNewChat,
  currentSessionId,
  setCurrentSessionId,
  onLoadSession,
  uiMode,
  setUiMode,
  setShowAbout
}) {
  const [historySessions, setHistorySessions] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [primedImageFile, setPrimedImageFile] = useState(null);
  
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const profileMenuRef = useRef(null);

  const fetchHistory = async () => {
    if (currentUser) {
      const sessions = await getChatSessions(currentUser.uid);
      setHistorySessions(sessions);
    }
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatHistory, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, transcript, aiResponse, imagePreview]);

  // Handle clicking outside profile menu to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim(), primedImageFile);
      setInputValue("");
      setPrimedImageFile(null);
      setImagePreview(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleMicClick = () => {
    const micBtn = document.getElementById('mic-toggle-btn');
    if (micBtn) {
      micBtn.click();
      emitAlert('SYS_WAKEWORD', 'COGNITIVE TELEMETRY VOICE INPUT ENGAGED! 🎤', false);
    } else {
      emitAlert('SYS_ERROR', 'SPEECH COMPONENT INTERRUPT: UNABLE TO ACCESS MICROPHONE DRIVER.', true);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      if (inputValue.toLowerCase().includes("video from image") || inputValue.toLowerCase().includes("animate")) {
        setPrimedImageFile(file);
        emitAlert('SYS_CONSOLE', 'STARTING FRAME PRIMED FOR LTX-2 ANIMATION. TYPE A PROMPT AND SEND!', false);
      } else {
        if (onAnalyzeImage) {
          onAnalyzeImage(file);
        }
      }
    }
  };

  const clearImagePreview = () => {
    setImagePreview(null);
    setPrimedImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAnimateImageClick = () => {
    setInputValue("Generate video from image: ");
    setTimeout(() => {
      if (fileInputRef.current) fileInputRef.current.click();
    }, 150);
    emitAlert('SYS_WAKEWORD', 'SELECT A STARTING FRAME IMAGE FOR LTX-2 19B VIDEO GENERATION.', false);
  };

  const handleCardClick = (promptText) => {
    setInputValue(promptText);
  };

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    if (currentUser) {
      await deleteChatSession(currentUser.uid, sessionId);
      fetchHistory();
      if (currentSessionId === sessionId) {
        handleNewChat();
      }
      emitAlert('SYS_RESTORED', 'NEURAL MEMORY BLOCK SUCCESSFULLY PURGED.', false);
    }
  };

  return (
    <div className="premium-ui-container">
      {/* 1. LEFT SIDEBAR */}
      <aside className="premium-sidebar">
        {/* Brand Logo Header */}
        <div className="sidebar-brand-header">
          <div className="sidebar-brand-left">
            <img src="/new-logo-hexper.png" alt="Hexper Logo" className="sidebar-logo-img" />
            <span className="sidebar-brand-name">Hexper <span className="ai-badge">AI</span></span>
          </div>
          <button className="sidebar-collapse-btn" title="Collapse Workspace">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
          </button>
        </div>

        {/* New Chat Action */}
        <button 
          className="sidebar-new-chat-btn" 
          onClick={() => {
            handleNewChat();
            emitAlert('SYS_RESTORED', 'NEW COGNITIVE FLOW SECURED.', false);
          }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          New Chat
        </button>

        {/* AI Tools List */}
        <div className="sidebar-section">
          <span className="sidebar-section-title">AI TOOLS</span>
          <nav className="sidebar-nav-list">
            <button className="sidebar-nav-item" onClick={() => handleCardClick("Create an image of ")}>
              <span className="nav-item-icon image">🎨</span>
              <span>AI Image Generator</span>
            </button>
            <button className="sidebar-nav-item" onClick={() => handleCardClick("Generate a video with AI of ")}>
              <span className="nav-item-icon video" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>🎥</span>
              <span>Generate Video with AI</span>
            </button>
            <button className="sidebar-nav-item" onClick={() => handleAnimateImageClick()}>
              <span className="nav-item-icon video" style={{ background: 'rgba(167, 139, 250, 0.15)', color: '#c084fc' }}>🖼️</span>
              <span>Animate Image with LTX-2</span>
            </button>
            <button className="sidebar-nav-item" onClick={() => handleCardClick("Create a modern website layout for ")}>
              <span className="nav-item-icon website">🌐</span>
              <span>Website Generator</span>
            </button>
            <button className="sidebar-nav-item" onClick={() => handleCardClick("Create a presentation draft about ")}>
              <span className="nav-item-icon presentation">📊</span>
              <span>Presentation Maker</span>
            </button>
            <button className="sidebar-nav-item" onClick={() => {
              if (fileInputRef.current) fileInputRef.current.click();
            }}>
              <span className="nav-item-icon vision">👁</span>
              <span>AI Vision scanner</span>
            </button>
            <button className="sidebar-nav-item" onClick={() => handleCardClick("Explore AI applications for ")}>
              <span className="nav-item-icon explore">🚀</span>
              <span>Explore AI Apps</span>
            </button>
          </nav>
        </div>

        {/* Chats History Logs */}
        <div className="sidebar-section chats-section">
          <div className="chats-section-header">
            <span className="sidebar-section-title">CHATS</span>
            <button className="chats-search-btn" title="Search Logs">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </div>
          
          <div className="sidebar-chats-list">
            {historySessions.length === 0 ? (
              <div className="sidebar-empty-state">No active sessions.</div>
            ) : (
              historySessions.map((session) => (
                <div 
                  key={session.sessionId}
                  className={`sidebar-chat-row ${currentSessionId === session.sessionId ? 'active' : ''}`}
                  onClick={() => {
                    if (onLoadSession) onLoadSession(session.sessionId, session.messages);
                  }}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" className="chat-bubble-icon">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <span className="chat-title-text">{session.title || "Untitled Chat"}</span>
                  
                  {/* Inline Delete Button */}
                  <button 
                    className="chat-item-delete-btn" 
                    onClick={(e) => handleDeleteSession(e, session.sessionId)}
                    title="Purge session"
                  >
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bottom User Card Profile */}
        <div className="sidebar-user-footer" ref={profileMenuRef}>
          <div className="sidebar-user-card" onClick={() => setShowProfileMenu(!showProfileMenu)}>
            <img 
              src={currentUser?.photoURL || "/new-logo-hexper.png"} 
              alt="User profile" 
              className="user-footer-avatar" 
            />
            <div className="user-footer-info">
              <span className="user-footer-name">{currentUser?.displayName || "Nur Mohammad"}</span>
              <span className="user-footer-status">Online</span>
            </div>
            <button className="user-footer-menu-trigger">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="12" cy="5" r="1"></circle>
                <circle cx="12" cy="19" r="1"></circle>
              </svg>
            </button>
          </div>

          {/* User Options Dropdown menu */}
          {showProfileMenu && (
            <div className="user-dropdown-menu">
              <div className="dropdown-user-header">
                <strong>{currentUser?.displayName || "Nur Mohammad"}</strong>
                <span className="dropdown-user-email">{currentUser?.email || "owner@hexper.ai"}</span>
              </div>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item" onClick={() => handleCardClick("Plan upgrade details request:")}>
                <span className="item-icon">✨</span> Upgrade plan
              </button>
              <button className="dropdown-item" onClick={() => {
                setShowProfileMenu(false);
                if (setShowAbout) setShowAbout(true);
              }}>
                <span className="item-icon">🎨</span> Personalization
              </button>
              <button className="dropdown-item" onClick={() => handleCardClick("Profile credentials display:")}>
                <span className="item-icon">👤</span> Profile
              </button>
              <button className="dropdown-item" onClick={() => {
                setShowProfileMenu(false);
                if (setShowAbout) setShowAbout(true);
              }}>
                <span className="item-icon">⚙️</span> Settings
              </button>
              <button className="dropdown-item" onClick={() => handleCardClick("Help manual guide request:")}>
                <span className="item-icon">❓</span> Help
              </button>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item logout" onClick={() => {
                signOutUser();
                emitAlert('SYS_RESTORED', 'SYSTEM SECURE DE-AUTHORIZATION COMPLETED.', false);
              }}>
                <span className="item-icon">🚪</span> Log out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* 2. RIGHT MAIN WORKSPACE */}
      <main className="premium-workspace">
        {/* Top Header Navigation Panel */}
        <header className="premium-top-bar">
          <div className="top-bar-left">
            <div className="model-selector-container">
              <button 
                className="top-bar-model-selector"
                onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
              >
                <span className="model-lightning-bolt">⚡</span>
                <span className="model-label-text">Hexper Smart</span>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" className={`dropdown-chevron ${modelDropdownOpen ? 'open' : ''}`}>
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {modelDropdownOpen && (
                <div className="model-selection-dropdown">
                  <button className="model-dropdown-item active" onClick={() => { setSelectedModel('AUTO'); setModelDropdownOpen(false); }}>
                    <strong>⚡ Hexper Smart</strong>
                    <span className="model-description">Auto-routes to the best model based on prompt complexity</span>
                  </button>
                  <button className="model-dropdown-item" onClick={() => { setSelectedModel('GROQ'); setModelDropdownOpen(false); }}>
                    <strong>🚀 Groq Reasoning Core</strong>
                    <span className="model-description">Ultra-fast real-time reasoning responses</span>
                  </button>
                  <button className="model-dropdown-item" onClick={() => { setSelectedModel('GEMINI'); setModelDropdownOpen(false); }}>
                    <strong>🪐 Gemini Pro</strong>
                    <span className="model-description">Rich educational deep dives and scans</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="top-bar-right">
            <button className="upgrade-pill-btn" onClick={() => handleCardClick("Upgrade plan info request:")}>
              <span className="diamond-glow">✦</span>
              Upgrade
            </button>
            <div className="user-profile-circle-wrap" onClick={() => setShowProfileMenu(!showProfileMenu)}>
              <img 
                src={currentUser?.photoURL || "/new-logo-hexper.png"} 
                alt="User Profile" 
                className="top-bar-avatar"
              />
            </div>
          </div>
        </header>

        {/* Central Workspace Content Stream */}
        <div className="premium-viewport">
          {chatHistory.length > 0 || interactionState === 'THINKING' || transcript ? (
            /* ACTIVE MESSAGES SCROLL area */
            <div className="premium-messages-scroll-area">
              {chatHistory.map((msg, index) => (
                <div key={index} className={`premium-msg-row ${msg.role === 'user' ? 'user-row' : 'assistant-row'}`}>
                  <div className="premium-avatar-box">
                    <img 
                      src={msg.role === 'user' ? (currentUser?.photoURL || "/new-logo-hexper.png") : "/new-logo-hexper.png"} 
                      alt="Avatar" 
                      className="msg-avatar-img"
                    />
                  </div>
                  <div className="premium-msg-bubble">
                    <div className="premium-bubble-sender">
                      {msg.role === 'user' ? 'USER_INPUT' : 'HEXPAR_SYSTEM'}
                    </div>
                    <div className="premium-bubble-text">
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}

              {/* Speech transcript loading state */}
              {transcript && (
                <div className="premium-msg-row user-row pending">
                  <div className="premium-avatar-box">
                    <img 
                      src={currentUser?.photoURL || "/new-logo-hexper.png"} 
                      alt="User Avatar" 
                      className="msg-avatar-img"
                    />
                  </div>
                  <div className="premium-msg-bubble">
                    <div className="premium-bubble-sender">
                      USER_INPUT.LOG {interactionState === 'LISTENING' && <span className="mic-pulse-dot-glow"></span>}
                    </div>
                    <div className="premium-bubble-text">
                      {transcript}
                      <span className="premium-terminal-cursor"></span>
                    </div>
                  </div>
                </div>
              )}

              {/* System Thinking spinner state */}
              {interactionState === 'THINKING' && !aiResponse && (
                <div className="premium-msg-row assistant-row pending">
                  <div className="premium-avatar-box">
                    <img src="/new-logo-hexper.png" alt="System Avatar" className="msg-avatar-img" />
                  </div>
                  <div className="premium-msg-bubble">
                    <div className="premium-bubble-sender">SYSTEM_THINKING</div>
                    <div className="premium-bubble-text">
                      <div className="premium-sci-fi-loading">
                        <div className="premium-loading-fill"></div>
                      </div>
                      Uplinking queries to cognitive grid...
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          ) : (
            /* EMPTY VIEWPORT WELCOME CARD Layout (Identical to user screenshot layout!) */
            <div className="premium-empty-viewport">
              <div className="premium-welcome-wrapper">
                <h1 className="welcome-gradient-heading">Ready when you are.</h1>
                <p className="welcome-subtext">Ask anything. Create anything. Hexper AI is here to help.</p>
              </div>

              {/* Horizontal actions grid */}
              <div className="premium-actions-cards-grid">
                <div className="action-card-pill" onClick={() => handleCardClick("Create an image of ")}>
                  <div className="action-card-top">
                    <span className="action-card-icon image">🎨</span>
                    <h3>Create an Image</h3>
                  </div>
                  <p>Generate stunning images with AI</p>
                  <span className="action-card-arrow">→</span>
                </div>

                <div className="action-card-pill" onClick={() => handleCardClick("Generate a video with AI of ")}>
                  <div className="action-card-top">
                    <span className="action-card-icon video" style={{ background: 'rgba(239, 68, 68, 0.12)' }}>🎥</span>
                    <h3>Generate Video</h3>
                  </div>
                  <p>Render gorgeous animated loops with AI</p>
                  <span className="action-card-arrow">→</span>
                </div>

                <div className="action-card-pill" onClick={() => handleAnimateImageClick()}>
                  <div className="action-card-top">
                    <span className="action-card-icon image-video" style={{ background: 'rgba(167, 139, 250, 0.12)' }}>🖼️</span>
                    <h3>Animate Image</h3>
                  </div>
                  <p>Render video from image using LTX-2</p>
                  <span className="action-card-arrow">→</span>
                </div>

                <div className="action-card-pill" onClick={() => handleCardClick("Help me write and enhance: ")}>
                  <div className="action-card-top">
                    <span className="action-card-icon write">✍️</span>
                    <h3>Write or Edit</h3>
                  </div>
                  <p>Improve your writing or edit content</p>
                  <span className="action-card-arrow">→</span>
                </div>

                <div className="action-card-pill" onClick={() => handleCardClick("Look up real-time information about ")}>
                  <div className="action-card-top">
                    <span className="action-card-icon search">🔍</span>
                    <h3>Research</h3>
                  </div>
                  <p>Get in-depth answers and insights</p>
                  <span className="action-card-arrow">→</span>
                </div>

                <div className="action-card-pill" onClick={() => handleCardClick("Create a modern website landing page for ")}>
                  <div className="action-card-top">
                    <span className="action-card-icon website">🌐</span>
                    <h3>Generate Website</h3>
                  </div>
                  <p>Build a modern website in seconds</p>
                  <span className="action-card-arrow">→</span>
                </div>

                <div className="action-card-pill" onClick={() => {
                  if (fileInputRef.current) fileInputRef.current.click();
                }}>
                  <div className="action-card-top">
                    <span className="action-card-icon pdf">📄</span>
                    <h3>Analyze PDF</h3>
                  </div>
                  <p>Extract insights from any PDF document</p>
                  <span className="action-card-arrow">→</span>
                </div>
              </div>

              {/* Small branding footer inside main container */}
              <footer className="premium-main-footer">
                <span>Powered by Gemini</span>
                <span className="footer-dot-divider">◆</span>
                <span>Grok</span>
                <span className="footer-dot-divider">◆</span>
                <span>and more</span>
              </footer>
            </div>
          )}
        </div>

        {/* Modern Pill Input Workspace Panel */}
        <div className="premium-input-box-wrapper">
          {imagePreview && (
            <div className="premium-scan-image-preview">
              <img src={imagePreview} alt="Primed scan upload" />
              <button className="remove-preview-btn" onClick={clearImagePreview}>✕</button>
              <span className="preview-indicator-label">
                {primedImageFile ? "LTX-2 STARTING FRAME PRIMED" : "SCAN SCANNER PRIMED"}
              </span>
            </div>
          )}

          <div className="premium-pill-input-bar">
            {/* Attachment scanner button */}
            <label className="input-action-btn attach-btn" title="Analyze image scan">
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleFileChange}
              />
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </label>

            {/* Core prompt text field */}
            <input 
              type="text" 
              className="premium-prompt-input-field" 
              placeholder="Ask anything..." 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            {/* Action deck triggers */}
            <div className="premium-pill-actions">
              <button 
                className={`input-action-btn mic-btn ${interactionState === 'LISTENING' ? 'active' : ''}`}
                onClick={handleMicClick}
                title="Microphone trigger scan"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="22"></line>
                </svg>
              </button>

              <button 
                className="premium-send-circle-btn"
                onClick={handleSend}
                title="Transmit prompt queries"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5"></line>
                  <polyline points="5 12 12 5 19 12"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
