import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page-container">
      <header className="landing-header">
        <div className="landing-logo" onClick={() => navigate('/')} style={{cursor:'pointer'}}>
          <span className="logo-text">Hexpar AI</span>
        </div>
        <nav className="landing-nav">
          <button className="nav-btn" onClick={() => navigate('/')}>Back to Home</button>
        </nav>
      </header>

      <main className="landing-main">
        <section className="about-section" style={{textAlign: 'left'}}>
          <h1 className="hero-title">Terms of Service</h1>
          <p style={{color: '#bbb', marginBottom: '20px'}}>Last Updated: June 12, 2026</p>
          
          <div className="about-text" style={{textAlign: 'left'}}>
            <h3>1. Acceptance of Terms</h3>
            <p>By accessing or using Hexpar AI, you agree to be bound by these Terms. If you disagree with any part of the terms then you may not access the Service.</p>
            <br/>
            <h3>2. User Responsibilities</h3>
            <p>You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password, whether your password is with our Service or a third-party service.</p>
            <br/>
            <h3>3. Usage Policies</h3>
            <p>You agree not to use the Service for any unlawful purpose or in any way that interrupts, damages, or impairs the service. Hexpar AI reserves the right to terminate access for violating these policies.</p>
            <br/>
            <h3>4. Limitation of Liability</h3>
            <p>In no event shall Hexpar AI, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <p>&copy; {new Date().getFullYear()} Hexpar AI. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default TermsOfService;
