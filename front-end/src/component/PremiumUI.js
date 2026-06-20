import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import './PremiumUI.css';
import NeonIcon from './NeonIcon';
import { getChatSessions, deleteChatSession, createSharedChat } from '../historyService';
import { signOutUser } from '../firebaseAuth';
import { emitAlert } from './AlertSystem';
import PaymentModal from './PaymentModal';
import LoadingSpinner from './LoadingSpinner';
import BrainNetwork from './BrainNetwork';
import shareIcon from '../images/shere-.png';
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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBrainNetwork, setShowBrainNetwork] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [primedImageFile, setPrimedImageFile] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [manusTaskId, setManusTaskId] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [manusStatus, setManusStatus] = useState(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState(null);

  // New Image Chat UI and Share State
  const [activeImageMenu, setActiveImageMenu] = useState(null);
  const [isSharingChat, setIsSharingChat] = useState(false);
  const [generatedShareUrl, setGeneratedShareUrl] = useState("");

  const handleCopyShareLink = () => {
    if (generatedShareUrl) {
      navigator.clipboard.writeText(generatedShareUrl)
        .then(() => emitAlert('SYS_RESTORED', 'TRANSMISSION SECURED: LINK COPIED! 🔗', false))
        .catch(() => emitAlert('SYS_ERROR', 'UPLINK FAILURE: FAILED TO COPY LINK.', true));
    }
  };

  const handleShareSession = async () => {
    if (!currentUser) return;
    setIsSharingChat(true);
    setGeneratedShareUrl("");
    try {
      const chatId = await createSharedChat(currentUser.uid, `Session ${new Date().toLocaleDateString()}`, chatHistory);
      if (chatId) {
        const url = `${window.location.origin}/share/${chatId}`;
        setGeneratedShareUrl(url);
      } else {
        emitAlert('SYS_ERROR', 'UPLINK FAILURE: COULD NOT ESTABLISH SHARE LINK.', true);
      }
    } catch (err) {
      console.error("Error creating shared chat:", err);
      emitAlert('SYS_ERROR', 'UPLINK FAILURE: COULD NOT ESTABLISH SHARE LINK.', true);
    } finally {
      setIsSharingChat(false);
    }
  };

  const handleImageDownload = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `neural_output_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      window.open(url, '_blank');
    }
  };

  const handleImageCopy = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      emitAlert('SYS_RESTORED', 'VISUAL COPIED TO CLIPBOARD.', false);
    } catch (error) {
      emitAlert('SYS_ERROR', 'FAILED TO COPY VISUAL DIRECTLY.', true);
    }
  };

  const handleImageShare = async (url) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Neural Image Output',
          text: 'Check out this AI generated image from Hexper AI.',
          url: url
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      handleImageCopy(url);
    }
  };
  
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

  const handleGenerateShortVideo = async () => {
    if (!inputValue.trim()) {
      emitAlert('SYS_ERROR', 'Prompt required for video generation.', true);
      return;
    }
    setGeneratedVideoUrl(null);
    try {
      const res = await fetch('/api/generate-short-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: inputValue.trim(), duration: 15 })
      });
      const data = await res.json();
      if (data.videoUrl) {
        setGeneratedVideoUrl(data.videoUrl);
        emitAlert('SYS_SUCCESS', 'Video generated successfully!', false);
      } else {
        emitAlert('SYS_ERROR', data.error || 'Failed to generate video.', true);
      }
    } catch (e) {
      console.error('[Short Video UI]', e);
      emitAlert('SYS_ERROR', 'Error contacting server.', true);
    }
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

  const handleUpgradeClick = () => {
    setIsUpgrading(true);
    setTimeout(() => {
      setIsUpgrading(false);
      setShowPaymentModal(true);
    }, 3000);
  };

  if (isUpgrading) {
    return <LoadingSpinner fullScreen={true} message="Loading Plans..." />;
  }

  return (
    <div className="premium-ui-container">
      {/* 1. LEFT SIDEBAR */}
      <aside className={`premium-sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
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
            <button className="sidebar-nav-item upgrade-btn" onClick={handleUpgradeClick} style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(99, 102, 241, 0.2))', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
              <span className="nav-item-icon" style={{ color: '#c084fc' }}><NeonIcon icon="Sparkles" size={18} colorClass="neon-primary" /></span>
              <span className="nav-item-text" style={{ color: '#fff', fontWeight: 600 }}>Upgrade to Hexper Pro</span>
            </button>
            <button className="sidebar-nav-item" onClick={() => setShowBrainNetwork(true)}>
              <span className="nav-item-icon" style={{ color: '#10b981' }}><NeonIcon icon="BrainCircuit" size={18} colorClass="neon-green" /></span>
              <span className="nav-item-text">Brain Network</span>
            </button>
            <button className="sidebar-nav-item" onClick={() => handleCardClick("Create an image of ")}>
              <span className="nav-item-icon image"><NeonIcon icon="Image" size={18} colorClass="neon-blue" /></span>
              <span className="nav-item-text">AI Image Generator</span>
            </button>
            <button className="sidebar-nav-item" onClick={() => handleCardClick("Generate a video with AI of ")}>
              <span className="nav-item-icon video" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}><NeonIcon icon="Video" size={18} colorClass="neon-pink" /></span>
              <span className="nav-item-text">AI Video Generator</span>
            </button>
            <button className="sidebar-nav-item" onClick={handleGenerateShortVideo}>
              <span className="nav-item-icon video" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}><NeonIcon icon="Clock" size={18} colorClass="neon-pink" /></span>
              <span className="nav-item-text">Generate Short Video</span>
            </button>
            <button className="sidebar-nav-item" onClick={() => handleAnimateImageClick()}>
              <span className="nav-item-icon video" style={{ background: 'rgba(167, 139, 250, 0.15)', color: '#c084fc' }}><NeonIcon icon="Film" size={18} colorClass="neon-primary" /></span>
              <span className="nav-item-text">Animate Image</span>
            </button>
            <button className="sidebar-nav-item" onClick={() => handleCardClick("Create a modern website layout for ")}>
              <span className="nav-item-icon website"><NeonIcon icon="LayoutTemplate" size={18} colorClass="neon-blue" /></span>
              <span className="nav-item-text">UI/UX Builder</span>
            </button>
            <button className="sidebar-nav-item" onClick={() => handleCardClick("Create a presentation draft about ")}>
              <span className="nav-item-icon presentation"><NeonIcon icon="BarChart3" size={18} colorClass="neon-green" /></span>
              <span className="nav-item-text">Presentation Maker</span>
            </button>
            <button className="sidebar-nav-item" onClick={() => {
              if (fileInputRef.current) fileInputRef.current.click();
            }}>
              <span className="nav-item-icon vision"><NeonIcon icon="Eye" size={18} colorClass="neon-primary" /></span>
              <span className="nav-item-text">Vision AI Analysis</span>
            </button>
            <button className="sidebar-nav-item" onClick={() => handleCardClick("Explore AI applications for ")}>
              <span className="nav-item-icon explore"><NeonIcon icon="Rocket" size={18} colorClass="neon-pink" /></span>
              <span className="nav-item-text">Explore Solutions</span>
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
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                      {msg.imageUrl && (
                        <div className="chat-image-wrapper" onClick={() => setActiveImageMenu(activeImageMenu === index ? null : index)} style={{ position: 'relative', marginTop: '10px' }}>
                          <img src={msg.imageUrl} alt="Neural Output" className="chat-inline-image" style={{ maxWidth: '100%', borderRadius: '8px', cursor: 'pointer', border: '1px solid rgba(0, 245, 255, 0.2)' }} />
                          {activeImageMenu === index && (
                            <div className="image-options-popover" style={{
                              position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(5, 5, 10, 0.85)',
                              backdropFilter: 'blur(10px)', border: '1px solid #00F5FF', borderRadius: '8px', padding: '5px',
                              display: 'flex', gap: '8px', zIndex: 10
                            }}>
                              <button onClick={(e) => { e.stopPropagation(); handleImageDownload(msg.imageUrl); setActiveImageMenu(null); }} style={{ background: 'transparent', color: '#00F5FF', border: 'none', cursor: 'pointer', fontSize: '12px' }}>⬇️ Download</button>
                              <button onClick={(e) => { e.stopPropagation(); handleImageCopy(msg.imageUrl); setActiveImageMenu(null); }} style={{ background: 'transparent', color: '#00F5FF', border: 'none', cursor: 'pointer', fontSize: '12px' }}>📋 Copy</button>
                              <button onClick={(e) => { e.stopPropagation(); handleImageShare(msg.imageUrl); setActiveImageMenu(null); }} style={{ background: 'transparent', color: '#00F5FF', border: 'none', cursor: 'pointer', fontSize: '12px' }}>🔗 Share</button>
                            </div>
                          )}
                        </div>
                      )}
                      {msg.videoUrl && (
                        <div className="chat-video-wrapper" style={{ marginTop: '10px' }}>
                          <video src={msg.videoUrl} controls autoPlay loop className="chat-inline-video" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid rgba(168, 85, 247, 0.2)' }} />
                        </div>
                      )}
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
              
{generatedVideoUrl && (
  <div className="generated-video-wrapper" style={{ marginTop: '1rem' }}>
    <video src={generatedVideoUrl} controls style={{ maxWidth: '100%', borderRadius: '8px' }} />
  </div>
)}
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
              {chatHistory.length > 0 && !transcript && interactionState !== 'THINKING' && (
                <button 
                  className="input-action-btn"
                  onClick={handleShareSession}
                  title="Share this conversation"
                  style={{ opacity: isSharingChat ? 0.5 : 1, padding: '0 8px', border: 'none', background: 'transparent' }}
                >
                  <img src={shareIcon} alt="Share" style={{ height: '26px', filter: 'drop-shadow(0 0 5px rgba(0,245,255,0.5))' }} />
                </button>
              )}

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
        {/* 3. MOBILE UI (Hidden on Desktop) */}
        <div className="mobile-ui-wrapper">
          {/* Mobile Top Bar */}
          <header className="mobile-top-bar">
            <div className="mobile-brand">
              <div className="mobile-logo-box">
                <img src="/new-logo-hexper.png" alt="Logo" className="mobile-logo" />
              </div>
              <div className="mobile-brand-text">
                <span>It's present by Nur mandal</span>
              </div>
            </div>
            <button className="mobile-menu-btn" onClick={() => setMobileSidebarOpen(true)}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </header>

          {/* Mobile Sidebar Overlay */}
          {mobileSidebarOpen && (
            <div className="mobile-sidebar-overlay" onClick={() => setMobileSidebarOpen(false)}></div>
          )}

          {/* Mobile Main Content */}
          <div className="mobile-main-content">
            <div className="mobile-greeting">
              <h1>How can I <br/><span className="cyan-text">assist you,</span> <span className="purple-text">Master?</span></h1>
              <p className="mobile-subtitle">TAP TO SPEAK OR TYPE YOUR REQUEST</p>
            </div>

            <div className="mobile-input-bar">
              <button className="mobile-mic-btn" onClick={handleMicClick}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="22"></line>
                </svg>
              </button>
              <input 
                type="text" 
                className="mobile-prompt-input" 
                placeholder="Ask anything..." 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button className="mobile-send-btn" onClick={handleSend}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5"></line>
                  <polyline points="5 12 12 5 19 12"></polyline>
                </svg>
              </button>
            </div>

            <div className="mobile-action-grid">
              <div className="mobile-action-card" onClick={() => handleCardClick("Create an image of ")}>
                <div className="mobile-card-icon purple">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                </div>
                <div className="mobile-card-text">
                  <h3>Create an image</h3>
                  <p>Generate with AI</p>
                </div>
              </div>
              <div className="mobile-action-card" onClick={() => handleCardClick("Help me write and enhance: ")}>
                <div className="mobile-card-icon blue">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                </div>
                <div className="mobile-card-text">
                  <h3>Write or edit</h3>
                  <p>Enhance your content</p>
                </div>
              </div>
              <div className="mobile-action-card" onClick={() => handleCardClick("Look up real-time information about ")}>
                <div className="mobile-card-icon cyan">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
                <div className="mobile-card-text">
                  <h3>Look something up</h3>
                  <p>Get real-time answers</p>
                </div>
              </div>
              <div className="mobile-action-card" onClick={() => handleCardClick("Solve this code: ")}>
                <div className="mobile-card-icon pink">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                </div>
                <div className="mobile-card-text">
                  <h3>Code assistant</h3>
                  <p>Solve, debug, integrate</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Bottom Navigation */}
          <nav className="mobile-bottom-nav">
            <button className="mobile-nav-item active">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              <span>Home</span>
            </button>
            <button className="mobile-nav-item">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span>History</span>
            </button>
            <div className="mobile-nav-blob" onClick={() => handleCardClick("Activate voice interface")}>
              <div className="mobile-blob-glow"></div>
              <div className="mobile-blob-core"></div>
            </div>
            <button className="mobile-nav-item">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              <span>Favorites</span>
            </button>
            <button className="mobile-nav-item">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span>Profile</span>
            </button>
          </nav>
        </div>
      </main>

      {/* Payment & Subscription Wizard */}
      {showPaymentModal && <PaymentModal onClose={() => setShowPaymentModal(false)} />}

      {/* Neural Brain Diagnostics */}
      {showBrainNetwork && <BrainNetwork onClose={() => setShowBrainNetwork(false)} apiHealth={apiHealth} />}

      {/* Share Link Popup */}
      {generatedShareUrl && (
        <div className="sci-fi-modal-overlay" onClick={() => setGeneratedShareUrl("")} style={{ zIndex: 1100 }}>
          <div className="sci-fi-modal-content share-transmission-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center', background: 'rgba(5, 5, 10, 0.95)', border: '1px solid #00F5FF', borderRadius: '12px', padding: '24px', position: 'relative' }}>
            <button className="modal-close" onClick={() => setGeneratedShareUrl("")} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            <h3 style={{ color: '#00F5FF', marginBottom: '20px', marginTop: '0' }}>SHARE TRANSMISSION</h3>
            <div style={{ background: 'rgba(0, 245, 255, 0.1)', border: '1px solid #00F5FF', padding: '15px', borderRadius: '8px', wordBreak: 'break-all', marginBottom: '20px', fontFamily: 'monospace', color: '#00F5FF' }}>
              {generatedShareUrl}
            </div>
            <button onClick={handleCopyShareLink} style={{ background: '#00F5FF', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', width: '100%', fontSize: '1rem', transition: '0.2s' }}>
              COPY LINK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
