import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSharedChat } from '../historyService';
import { emitAlert } from './AlertSystem';
import './ShareChat.css';

export default function ShareChat() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [chatData, setChatData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChat() {
      setLoading(true);
      try {
        const data = await getSharedChat(chatId);
        setChatData(data);
      } catch (err) {
        console.error("Error retrieving shared chat session:", err);
      } finally {
        setLoading(false);
      }
    }
    if (chatId) {
      fetchChat();
    }
  }, [chatId]);

  // Set document title and SEO metadata programmatically
  useEffect(() => {
    if (chatData) {
      document.title = `${chatData.title} | Shared Chat on Hexper AI`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', `Read this public AI conversation: "${chatData.title}" on Hexper AI.`);
      }
    } else {
      document.title = `Hexper AI - Shared Conversation`;
    }
  }, [chatData]);

  const handleCopyLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link)
      .then(() => {
        emitAlert('SYS_RESTORED', 'TRANSMISSION SECURED: LINK COPIED TO CLIPBOARD! 🔗', false);
      })
      .catch((err) => {
        console.error("Failed to copy share link:", err);
        emitAlert('SYS_ERROR', 'UPLINK FAILURE: FAILED TO COPY LINK.', true);
      });
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: chatData?.title || 'Shared Conversation on Hexper AI',
          text: `Check out this interesting conversation on Hexper AI: "${chatData?.title || 'Shared Chat'}"`,
          url: window.location.href,
        });
        emitAlert('SYS_RESTORED', 'TRANSMISSION ROUTED VIA SYSTEM API! 🚀', false);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error("Native share failed:", error);
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const getSocialShareUrl = (platform) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out this conversation on Hexper AI: "${chatData?.title || 'Shared Chat'}"`);
    
    switch (platform) {
      case 'whatsapp':
        return `https://api.whatsapp.com/send?text=${text}%20${url}`;
      case 'telegram':
        return `https://t.me/share/url?url=${url}&text=${text}`;
      case 'x':
        return `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="share-workspace-container loading-state">
        <div className="share-header-glass">
          <div className="share-brand-wrap">
            <span className="brand-dot-glow pulse"></span>
            <span className="brand-logo-text">HEXPER AI // UPLINK</span>
          </div>
          <div className="skeleton-btn"></div>
        </div>
        <div className="share-chat-viewport">
          <div className="skeleton-title"></div>
          <div className="skeleton-message-row left">
            <div className="skeleton-avatar"></div>
            <div className="skeleton-bubble"></div>
          </div>
          <div className="skeleton-message-row right">
            <div className="skeleton-bubble"></div>
            <div className="skeleton-avatar"></div>
          </div>
          <div className="skeleton-message-row left">
            <div className="skeleton-avatar"></div>
            <div className="skeleton-bubble"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!chatData) {
    return (
      <div className="share-workspace-container error-state">
        <div className="error-card-glass">
          <div className="error-icon-glow">!</div>
          <h1 className="error-title">DATA EXPUNGED</h1>
          <p className="error-subtitle">TRANSMISSION ID NOT FOUND OR RETRIEVAL FAILED</p>
          <div className="error-code-panel">
            <span className="prompt">&gt;</span> ERROR: SECURE_UPLINK_RESOLVE_FAILED [404]
            <br />
            <span className="prompt">&gt;</span> STATUS: SESSION DOES NOT EXIST OR IS EXPIRED
          </div>
          <button className="error-back-btn" onClick={() => navigate('/log-in')}>
            ESTABLISH NEW LINK (LOGIN)
          </button>
        </div>
        <div className="error-scan-line-h"></div>
      </div>
    );
  }

  return (
    <div className="share-workspace-container">
      {/* Sleek Top Navigation Bar */}
      <header className="share-header-glass">
        <div className="share-brand-wrap" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <span className="brand-dot-glow"></span>
          <span className="brand-logo-text">HEXPER AI // MEMORY</span>
        </div>
        <div className="share-header-actions">
          <button className="try-hexper-btn-glow" onClick={() => navigate('/log-in')}>
            TRY HEXPER AI
            <span className="btn-glow-element"></span>
          </button>
        </div>
      </header>

      {/* Main Conversation Window */}
      <main className="share-chat-viewport">
        <div className="share-conversation-header">
          <span className="share-meta-label">TRANSMISSION STREAM ARCHIVE</span>
          <h1 className="share-chat-title">{chatData.title}</h1>
          <p className="share-chat-date">
            ARCHIVED: {chatData.createdAt ? new Date(chatData.createdAt.toMillis ? chatData.createdAt.toMillis() : chatData.createdAt).toLocaleString() : 'SYSTEM DATETIME RECORDED'}
          </p>
        </div>

        {/* Messaging Logs */}
        <div className="share-messages-thread">
          {chatData.messages && chatData.messages.map((msg, index) => (
            <div key={index} className={`share-chat-row ${msg.role === 'user' ? 'user-row' : 'assistant-row'}`}>
              <div className="share-chat-bubble">
                <div className="share-bubble-header">
                  {msg.role === 'user' ? 'USER_INPUT' : 'HEXPAR_SYSTEM'}
                </div>
                <div className="share-bubble-content">
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Futuristic Fixed Sharing Deck & CTA Banner */}
      <footer className="share-footer-dock">
        <div className="share-footer-glass-wrap">
          <div className="share-social-deck-section">
            <span className="deck-title">PROPAGATE STREAM</span>
            <div className="share-buttons-grid">
              <button 
                className="deck-icon-btn copy-btn" 
                onClick={handleCopyLink} 
                title="Copy Link to Clipboard"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Copy Link</span>
              </button>

              {navigator.share && (
                <button 
                  className="deck-icon-btn native-btn" 
                  onClick={handleNativeShare} 
                  title="Share via System API"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                  </svg>
                  <span>Share</span>
                </button>
              )}

              <a 
                href={getSocialShareUrl('whatsapp')} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="deck-icon-btn whatsapp-btn"
                title="Share on WhatsApp"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.59 1.98 14.117.95 11.5.952c-5.439 0-9.863 4.371-9.867 9.8a9.73 9.73 0 0 0 1.503 5.179l-1.007 3.675 3.769-.989zm13.406-7.071c-.3-.15-1.771-.875-2.029-.969-.258-.094-.446-.14-.633.14-.187.281-.726.912-.89 1.096-.164.184-.328.206-.628.056-.3-.15-1.267-.467-2.414-1.488-.893-.796-1.496-1.78-1.671-2.081-.175-.3-.019-.462.131-.611.135-.134.3-.349.45-.524.15-.175.2-.299.3-.499.1-.2.05-.374-.025-.524-.075-.15-.633-1.527-.868-2.091-.229-.551-.48-.476-.66-.485-.17-.008-.364-.01-.557-.01-.194 0-.51.072-.776.364-.266.292-1.015.992-1.015 2.42 0 1.427 1.039 2.806 1.183 2.998.144.192 2.044 3.12 4.953 4.376.691.299 1.232.478 1.652.612.695.221 1.328.19 1.829.115.557-.083 1.771-.724 2.022-1.424.251-.7 2.51-1.233 2.51-1.328 0-.095-.145-.145-.446-.295z"/>
                </svg>
                <span>WhatsApp</span>
              </a>

              <a 
                href={getSocialShareUrl('telegram')} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="deck-icon-btn telegram-btn"
                title="Share on Telegram"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-1-.65-.35-1 .22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.24-5.54 3.65-.52.36-.99.53-1.41.52-.46-.01-1.35-.26-2.01-.48-.81-.27-1.46-.42-1.4-.88.03-.24.36-.49.99-.74 3.87-1.69 6.45-2.8 7.74-3.33 3.69-1.54 4.45-1.81 4.95-1.82.11 0 .36.03.52.16.14.11.18.26.2.37.01.07.03.22.01.35z"/>
                </svg>
                <span>Telegram</span>
              </a>

              <a 
                href={getSocialShareUrl('x')} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="deck-icon-btn x-btn"
                title="Share on X (formerly Twitter)"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span>Share on X</span>
              </a>
            </div>
          </div>
          <div className="share-cta-column">
            <div className="share-cta-text">
              <h3>Create Your Own Sessions</h3>
              <p>Converse, visualize ideas, and build products with Hexper AI.</p>
            </div>
            <button className="share-cta-action-btn" onClick={() => navigate('/log-in')}>
              GET STARTED FREE
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
