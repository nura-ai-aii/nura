import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);

  useEffect(() => {
    // Reveal elements on scroll
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => elements.forEach((el) => observer.unobserve(el));
  }, []);

  return (
    <div className="landing-page-container">
      {/* Background Video */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="landing-bg-video"
      >
        <source src="/welcomenew-pop-up.mp4" type="video/mp4" />
      </video>
      <div className="landing-bg-overlay"></div>

      <header className="landing-header">
        <div className="landing-logo">
          <span className="logo-text pulse-glow">Hexpar AI</span>
        </div>
        <nav className="landing-nav">
          <button className="nav-btn" onClick={() => navigate('/log-in')}>Log In</button>
          <button className="nav-btn primary glass-btn" onClick={() => navigate('/sign-in')}>Sign Up</button>
        </nav>
      </header>

      <main className="landing-main">
        <section className="hero-section-lp reveal-on-scroll">
          <h1 className="hero-title float-anim">
            Experience the Future with <span className="highlight-text gradient-flow">Cognitive AI</span>
          </h1>
          <p className="hero-subtitle">
            Hexpar AI is your ultimate personal assistant. From advanced neural brain diagnostics and image generation 
            to complex coding architectures, Hexpar AI redefines what's possible.
          </p>
          <div className="cta-group">
            <button className="cta-btn primary glow-btn" onClick={() => navigate('/sign-in')}>Start Your Journey</button>
          </div>
        </section>

        <section className="blob-section reveal-on-scroll">
          <div className="blob-content">
            <div className="blob-text">
              <h2 className="section-title">The Cognitive Core</h2>
              <p>
                At the heart of Hexpar AI is the <strong>Cognitive Core</strong>—often affectionately called the "Blob". 
                This isn't just a visual effect; it is a real-time representation of the AI's neural state. 
              </p>
              <ul className="blob-features">
                <li><span className="icon">🎤</span> <strong>Listening:</strong> It ripples when capturing your voice.</li>
                <li><span className="icon">🧠</span> <strong>Thinking:</strong> It pulsates with deep calculations.</li>
                <li><span className="icon">🗣️</span> <strong>Speaking:</strong> It resonates in sync with its synthesized voice.</li>
              </ul>
            </div>
            <div className="blob-visual-placeholder">
              <div className="simulated-blob"></div>
            </div>
          </div>
        </section>

        <section className="features-section reveal-on-scroll">
          <h2 className="section-title">Powerful Capabilities</h2>
          <div className="features-grid">
            <div className="feature-card tilt-anim">
              <div className="feature-icon" style={{background: 'rgba(239, 68, 68, 0.15)', color: '#f87171'}}>🎥</div>
              <h3>AI Video Generation</h3>
              <p>Turn images into cinematic video scenes instantly using LTX-2 19B Distilled models.</p>
            </div>
            <div className="feature-card tilt-anim">
              <div className="feature-icon" style={{background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc'}}>🧠</div>
              <h3>Neural Diagnostics</h3>
              <p>Visualize thought processes and memory interactions through our proprietary interface.</p>
            </div>
            <div className="feature-card tilt-anim">
              <div className="feature-icon" style={{background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa'}}>💻</div>
              <h3>Advanced Coding</h3>
              <p>Write, debug, and optimize code effortlessly with an AI that understands your entire codebase.</p>
            </div>
            <div className="feature-card tilt-anim">
              <div className="feature-icon" style={{background: 'rgba(16, 185, 129, 0.15)', color: '#34d399'}}>💬</div>
              <h3>Personalized Companion</h3>
              <p>Hexpar AI learns your nickname, profession, and communication style to be your perfect buddy.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="footer-links">
          <span onClick={() => navigate('/privacy')}>Privacy Policy</span>
          <span onClick={() => navigate('/terms')}>Terms of Service</span>
        </div>
        <p>&copy; {new Date().getFullYear()} Hexpar AI. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
