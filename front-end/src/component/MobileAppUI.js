import React from 'react';
import './MobileAppUI.css';

const MobileAppUI = () => {
  return (
    <div className="mobile-ui-container">
      {/* Header */}
      <header className="mobile-header">
        <div className="brand-container">
          <div className="brand-icon-box">
            {/* Hexagonal/Cube icon placeholder to match the 3D look in the image */}
          </div>
          <div className="brand-text">
            <span className="brand-title">Hexpar AI</span>
            <span className="brand-subtitle">POWERED BY COGNITIVE</span>
          </div>
        </div>
        
        <button className="menu-btn">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </header>

      {/* Main Scrollable Content */}
      <main className="mobile-content">
        <section className="hero-section">
          <h1 className="hero-text">
            How can I<br />
            <span className="cyan-grad">assist you, </span>
            <span className="purple-grad">Master?</span>
          </h1>
          <div className="hero-subtitle">TAP TO SPEAK OR TYPE YOUR REQUEST</div>
        </section>

        {/* Search / Input */}
        <div className="input-wrapper">
          <div className="input-mic">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
          </div>
          <input type="text" className="input-field" placeholder="Ask anything..." />
          <button className="input-send">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2,21L23,12L2,3V10L17,12L2,14V21Z" /></svg>
          </button>
        </div>

        {/* Action Grid */}
        <div className="action-grid">
          {/* Card 1 */}
          <div className="action-card">
            <div className="action-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            </div>
            <div className="action-text">
              <h3>Create an image</h3>
              <p>Generate with AI</p>
            </div>
          </div>
          
          {/* Card 2 */}
          <div className="action-card">
            <div className="action-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </div>
            <div className="action-text">
              <h3>Write or edit</h3>
              <p>Enhance your content</p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="action-card">
            <div className="action-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <div className="action-text">
              <h3>Look something up</h3>
              <p>Get real-time answers</p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="action-card">
            <div className="action-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
            </div>
            <div className="action-text">
              <h3>Code assistant</h3>
              <p>Solve, debug, integrate</p>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <div className="nav-item active">
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
          <span>Home</span>
        </div>
        <div className="nav-item">
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" /></svg>
          <span>History</span>
        </div>
        
        {/* Center Orb */}
        <div className="orb-container">
          <div className="orb-base-curve"></div>
          <div className="orb-glow"></div>
          <div className="orb-core"></div>
        </div>

        <div className="nav-item">
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24"><path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"/></svg>
          <span>Favorites</span>
        </div>
        <div className="nav-item">
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          <span>Profile</span>
        </div>
      </nav>
    </div>
  );
};

export default MobileAppUI;
