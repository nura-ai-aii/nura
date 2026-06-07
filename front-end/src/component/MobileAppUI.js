import React, { useState, useRef } from 'react';
import './MobileAppUI.css';
import { uploadAvatar, signOutUser } from '../firebaseAuth';
import { createSharedChat } from '../historyService';
import { emitAlert } from './AlertSystem';
import shareIcon from '../images/shere-.png';

const MobileAppUI = ({ currentUser, chatHistory, onSendMessage, interactionState, aiResponse, onNavigate, activePath, onAnalyzeImage }) => {
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSharingChat, setIsSharingChat] = useState(false);
  const [generatedShareUrl, setGeneratedShareUrl] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const fileInputRef = useRef(null);
  const avatarInputRef = useRef(null);

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (onAnalyzeImage) {
        onAnalyzeImage(file);
      } else {
        onSendMessage("Analyze this image", file);
      }
    }
  };

  const handleAvatarChange = async (e) => {
    if (e.target.files && e.target.files[0] && currentUser) {
      const file = e.target.files[0];
      setIsUploading(true);
      try {
        await uploadAvatar(file, currentUser);
        emitAlert('SYSTEM', "Avatar updated securely in Firebase.");
      } catch (err) {
        emitAlert('SYS_ERROR', "Avatar upload failed.", true);
      }
      setIsUploading(false);
    }
  };

  const handleShareSession = async () => {
    if (!currentUser || chatHistory.length === 0) return;
    setIsSharingChat(true);
    try {
      const shareUrl = await createSharedChat(currentUser.uid, chatHistory);
      setGeneratedShareUrl(shareUrl);
      emitAlert('SYSTEM', "Conversation Shared!");
    } catch (err) {
      console.error(err);
      emitAlert('SYS_ERROR', "Failed to share conversation", true);
    }
    setIsSharingChat(false);
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      emitAlert('SYSTEM', "User logged out securely.");
    } catch (err) {
      emitAlert('SYS_ERROR', "Error logging out.", true);
    }
  };

  return (
    <div className="mobile-ui-container">
      {/* Header */}
      <header className="mobile-header">
        <div className="brand-container">
          <div className="brand-icon-box"></div>
          <div className="brand-text">
            <span className="brand-title">Hexpar AI</span>
            <span className="brand-subtitle">POWERED BY COGNITIVE</span>
          </div>
        </div>
        
        <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
          <span></span>
          <span></span>
          <span></span>
        </button>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="mobile-sidebar-overlay" onClick={() => setSidebarOpen(false)}>
          <div className="mobile-sidebar" onClick={(e) => e.stopPropagation()}>
            <div className="sidebar-header">
              <h2>Menu</h2>
              <button onClick={() => setSidebarOpen(false)}>✕</button>
            </div>
            <div className="sidebar-nav">
              <div onClick={() => { setSidebarOpen(false); if(onNavigate) onNavigate('/'); }}>Home</div>
              <div onClick={() => { setSidebarOpen(false); if(onNavigate) onNavigate('/history'); }}>History</div>
              <div onClick={() => { setSidebarOpen(false); if(onNavigate) onNavigate('/about'); }}>Profile</div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal Popup */}
      {generatedShareUrl && (
        <div className="share-popup-overlay">
          <div className="share-popup-content">
            <button className="close-share-popup" onClick={() => setGeneratedShareUrl('')}>✕</button>
            <h3>Conversation Shared</h3>
            <p>Your encrypted link is ready.</p>
            <div className="share-link-box">{generatedShareUrl}</div>
            <button className="copy-link-btn" onClick={() => {
              navigator.clipboard.writeText(generatedShareUrl);
              emitAlert('SYSTEM', "Link copied to clipboard");
            }}>COPY LINK</button>
          </div>
        </div>
      )}

      {/* Main Content Area based on route */}
      <main className="mobile-content">
        {activePath === '/about' ? (
          <div className="mobile-profile-section">
            <h2>User Profile</h2>
            <div className="avatar-upload-wrapper">
              <img 
                src={currentUser?.photoURL || "/new-logo-hexper.png"} 
                alt="User Avatar" 
                className="mobile-avatar-display" 
              />
              <div className="upload-controls">
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={avatarInputRef} 
                  style={{ display: 'none' }} 
                  onChange={handleAvatarChange}
                />
                <button 
                  className="upload-avatar-btn" 
                  onClick={() => avatarInputRef.current && avatarInputRef.current.click()}
                  disabled={isUploading}
                >
                  {isUploading ? "Uploading..." : "Change Avatar (Firebase)"}
                </button>
              </div>
            </div>
            <div className="profile-details">
              <p><strong>Email:</strong> {currentUser?.email || 'Guest'}</p>
              <button className="sign-out-btn" onClick={handleSignOut}>Sign Out</button>
            </div>
          </div>
        ) : (
          /* Chat Area */
          <>
            {chatHistory && chatHistory.length > 0 ? (
              <div className="mobile-chat-log" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                {chatHistory.map((msg, idx) => (
                  <div key={idx} style={{ 
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    background: msg.role === 'user' ? 'rgba(0,242,254,0.1)' : 'rgba(161,140,209,0.1)',
                    border: `1px solid ${msg.role === 'user' ? 'rgba(0,242,254,0.3)' : 'rgba(161,140,209,0.3)'}`,
                    padding: '12px 16px',
                    borderRadius: '16px',
                    maxWidth: '85%',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    color: '#fff'
                  }}>
                    {msg.imageUrl && (
                      <img src={msg.imageUrl} alt="AI output" style={{maxWidth: '100%', borderRadius: '8px', marginBottom: '8px'}} />
                    )}
                    {msg.content}
                  </div>
                ))}
                {interactionState === 'THINKING' && (
                  <div style={{ alignSelf: 'flex-start', color: '#00f2fe', fontSize: '12px', marginTop: '8px' }}>
                    {aiResponse || 'Thinking...'}
                  </div>
                )}
              </div>
            ) : (
              <section className="hero-section">
                <h1 className="hero-text">
                  How can I<br />
                  <span className="cyan-grad">assist you, </span>
                  <span className="purple-grad">Master?</span>
                </h1>
                <div className="hero-subtitle">TAP TO SPEAK OR TYPE YOUR REQUEST</div>
              </section>
            )}

            {/* Input Bar */}
            <div className="input-wrapper">
              <label className="input-plus-btn">
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

              <input 
                type="text" 
                className="input-field" 
                placeholder="Ask anything..." 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
              />

              {chatHistory && chatHistory.length > 0 && interactionState !== 'THINKING' && (
                <button 
                  className="input-share-btn"
                  onClick={handleShareSession}
                  style={{ opacity: isSharingChat ? 0.5 : 1 }}
                >
                  <img src={shareIcon} alt="Share" style={{ height: '20px' }} />
                </button>
              )}

              <div className="input-mic" onClick={() => {
                const micBtn = document.getElementById('mic-toggle-btn');
                if (micBtn) micBtn.click();
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={interactionState === 'LISTENING' ? '#00f2fe' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
              </div>

              <button className="input-send" onClick={handleSend}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2,21L23,12L2,3V10L17,12L2,14V21Z" /></svg>
              </button>
            </div>
          </>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <div className={`nav-item ${activePath === '/' || activePath === '/chat' ? 'active' : ''}`} onClick={() => onNavigate && onNavigate('/')}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
          <span>Home</span>
        </div>
        <div className={`nav-item ${activePath === '/history' ? 'active' : ''}`} onClick={() => onNavigate && onNavigate('/history')}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" /></svg>
          <span>History</span>
        </div>
        
        {/* Center Orb */}
        <div className="orb-container" onClick={() => {
            const micBtn = document.getElementById('mic-toggle-btn');
            if (micBtn) micBtn.click();
          }} style={{cursor: 'pointer'}}>
          <div className="orb-base-curve"></div>
          <div className="orb-glow"></div>
          <div className="orb-core"></div>
        </div>

        <div className={`nav-item ${activePath === '/system' ? 'active' : ''}`} onClick={() => setSidebarOpen(true)}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24"><path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"/></svg>
          <span>Favorites</span>
        </div>
        <div className={`nav-item ${activePath === '/about' ? 'active' : ''}`} onClick={() => onNavigate && onNavigate('/about')}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          <span>Profile</span>
        </div>
      </nav>
    </div>
  );
};

export default MobileAppUI;
