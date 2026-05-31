import React, { useRef, useEffect, useState } from 'react';
import './Terminal.css';

export default function Terminal({ 
  transcript, 
  aiResponse, 
  isListening, 
  isProcessing, 
  showTerminal, 
  activeMood, 
  onSendMessage, 
  onAnalyzeImage,
  chatHistory = []
}) {
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const [inputValue, setInputValue] = useState("");
  const [imagePreview, setImagePreview] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, transcript, aiResponse, imagePreview, isProcessing]);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleMicClick = () => {
    const micBtn = document.getElementById('mic-toggle-btn');
    if (micBtn) micBtn.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      if (onAnalyzeImage) {
        onAnalyzeImage(file);
      }
    }
  };

  const clearImagePreview = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCardClick = (type) => {
    if (type === 'image') {
      setInputValue("Create an image of ");
    } else if (type === 'write') {
      setInputValue("Help me write and enhance: ");
    } else if (type === 'search') {
      setInputValue("Look up real-time information about ");
    }
    inputRef.current?.focus();
  };

  if (!showTerminal) return null;

  const hasMessages = chatHistory.length > 0 || isProcessing || transcript;

  return (
    <div className={`new-terminal-workspace ${activeMood === 'hw' ? 'mood-hw' : ''}`}>
      
      {/* 1. Chat History Scroll Container (Only visible when there is active chat) */}
      {hasMessages ? (
        <div className="new-terminal-messages-container">
          {chatHistory.map((msg, index) => (
            <div key={index} className={`new-chat-row ${msg.role === 'user' ? 'user-row' : 'assistant-row'}`}>
              <div className="new-chat-bubble">
                <div className="bubble-header">
                  {msg.role === 'user' ? 'USER_INPUT' : 'HEXPAR_SYSTEM'}
                </div>
                <div className="bubble-content">
                  {msg.content}
                </div>
              </div>
            </div>
          ))}

          {/* Render active transcript while listening */}
          {transcript && (
            <div className="new-chat-row user-row pending">
              <div className="new-chat-bubble">
                <div className="bubble-header">
                  USER_INPUT.LOG {isListening && <span className="mic-pulse-dot"></span>}
                </div>
                <div className="bubble-content">
                  {transcript}
                  <span className="terminal-cursor"></span>
                </div>
              </div>
            </div>
          )}

          {/* Render active processing / thinking state */}
          {isProcessing && !aiResponse && (
            <div className="new-chat-row assistant-row pending">
              <div className="new-chat-bubble">
                <div className="bubble-header">
                  SYSTEM_THINKING
                </div>
                <div className="bubble-content">
                  <div className="sci-fi-loading-bar">
                    <div className="loading-fill"></div>
                  </div>
                  Analyzing uplink data...
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      ) : (
        /* 2. Welcome Title Banner (Visible when empty) */
        <div className="new-terminal-welcome-banner">
          <h1>How can I assist you, Master?</h1>
          <p>Hexpar AI Cognitive Engine Online</p>
        </div>
      )}

      {/* 3. Image preview panel */}
      {imagePreview && (
        <div className="new-terminal-image-preview-panel">
          <div className="preview-image-wrap">
            <img src={imagePreview} alt="Lens Scan Input" />
            <button className="clear-preview-btn" onClick={clearImagePreview} title="Remove image">✕</button>
          </div>
          <span className="preview-label">GOOGLE LENS SCAN PRIMED</span>
        </div>
      )}

      {/* 4. Center Pill Search Input Bar */}
      <div className="new-terminal-pill-bar">
        {/* Plus file/image upload button */}
        <label className="pill-action-btn upload" title="Upload image for Google Lens analysis">
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

        {/* Input box */}
        <input 
          ref={inputRef}
          type="text" 
          className="pill-search-input" 
          placeholder="Ask anything" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {/* Right buttons: Mic & Speech soundwave toggle */}
        <div className="pill-right-actions">
          <button 
            type="button" 
            className={`pill-mic-btn ${isListening ? 'active' : ''}`} 
            onClick={handleMicClick}
            title="Toggle Voice Input"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="22"></line>
            </svg>
          </button>

          <span className="pill-actions-divider"></span>

          <button 
            type="button" 
            className={`pill-soundwave-btn ${isListening || isProcessing ? 'pulsing' : ''}`}
            onClick={handleMicClick}
            title="System Speech Telemetry"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="4" y1="9" x2="4" y2="15"></line>
              <line x1="9" y1="6" x2="9" y2="18"></line>
              <line x1="14" y1="4" x2="14" y2="20"></line>
              <line x1="19" y1="7" x2="19" y2="17"></line>
            </svg>
          </button>
        </div>
      </div>

      {/* 5. Helper Cards Underneath (Only visible when empty) */}
      {!hasMessages && (
        <div className="new-terminal-cards-grid">
          <div className="helper-card" onClick={() => handleCardClick('image')}>
            <div className="helper-card-icon image-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <div className="helper-card-text">
              <h4>Create an image</h4>
              <p>Generate with AI</p>
            </div>
          </div>

          <div className="helper-card" onClick={() => handleCardClick('write')}>
            <div className="helper-card-icon edit-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </div>
            <div className="helper-card-text">
              <h4>Write or edit</h4>
              <p>Enhance your content</p>
            </div>
          </div>

          <div className="helper-card" onClick={() => handleCardClick('search')}>
            <div className="helper-card-icon search-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
            </div>
            <div className="helper-card-text">
              <h4>Look something up</h4>
              <p>Get real-time answers</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
