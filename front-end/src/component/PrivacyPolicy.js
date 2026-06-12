import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css'; // Re-use landing page styles for consistency

const PrivacyPolicy = () => {
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
          <h1 className="hero-title">Privacy Policy</h1>
          <p style={{color: '#bbb', marginBottom: '20px'}}>Last Updated: June 12, 2026</p>
          
          <div className="about-text" style={{textAlign: 'left'}}>
            <h3>1. Information We Collect</h3>
            <p>We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us.</p>
            <br/>
            <h3>2. How We Use Information</h3>
            <p>We may use the information we collect to provide, maintain, and improve our services, including to facilitate payments, send receipts, provide products and services you request, develop new features, provide customer support, and send updates.</p>
            <br/>
            <h3>3. Data Storage and Security</h3>
            <p>We use Firebase Authentication and Firestore to securely store your data. We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access.</p>
            <br/>
            <h3>4. Changes to the Policy</h3>
            <p>We may change this Privacy Policy from time to time. If we make significant changes, we will notify you through our application or by other means.</p>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <p>&copy; {new Date().getFullYear()} Hexpar AI. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
