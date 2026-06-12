import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page-container">
      <header className="landing-header">
        <div className="landing-logo">
          <span className="logo-text">Hexpar AI</span>
        </div>
        <nav className="landing-nav">
          <button className="nav-btn" onClick={() => navigate('/log-in')}>Log In</button>
          <button className="nav-btn primary" onClick={() => navigate('/sign-in')}>Sign Up</button>
        </nav>
      </header>

      <main className="landing-main">
        <section className="hero-section-lp">
          <h1 className="hero-title">Experience the Future with <span className="highlight-text">Cognitive AI</span></h1>
          <p className="hero-subtitle">
            Hexpar AI is your ultimate personal assistant. From advanced neural brain diagnostics and image generation 
            to complex coding architectures, Hexpar AI redefines what's possible.
          </p>
          <div className="cta-group">
            <button className="cta-btn primary" onClick={() => navigate('/sign-in')}>Get Started for Free</button>
            <button className="cta-btn secondary" onClick={() => navigate('/about')}>Learn More</button>
          </div>
        </section>

        <section className="features-section">
          <h2 className="section-title">Powerful Capabilities</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>🎨 Image & Video Generation</h3>
              <p>Harness the power of the latest generative models to create stunning visuals and animations in seconds.</p>
            </div>
            <div className="feature-card">
              <h3>🧠 Neural Brain Diagnostics</h3>
              <p>Visualize thought processes and memory interactions through our proprietary neural network interface.</p>
            </div>
            <div className="feature-card">
              <h3>💻 Advanced Coding Assistant</h3>
              <p>Write, debug, and optimize code effortlessly with AI that understands the full context of your codebase.</p>
            </div>
          </div>
        </section>
        
        <section className="about-section">
          <h2 className="section-title">About Hexpar AI</h2>
          <p className="about-text">
            Hexpar AI represents the pinnacle of artificial intelligence interfaces. Designed for seamless human-computer 
            interaction, our platform integrates voice recognition, visual processing, and deep context analysis. 
            Whether you are a developer seeking to streamline your workflow or a creator looking to bring your ideas to life, 
            Hexpar AI provides the premium tools required to succeed in a digital-first world.
          </p>
        </section>
      </main>

      <footer className="landing-footer">
        <p>&copy; {new Date().getFullYear()} Hexpar AI. All rights reserved.</p>
        <div className="footer-links">
          <span onClick={() => navigate('/privacy')}>Privacy Policy</span>
          <span onClick={() => navigate('/terms')}>Terms of Service</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
