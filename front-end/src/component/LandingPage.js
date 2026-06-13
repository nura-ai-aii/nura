/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container-new">
      
      {/* Navbar */}
      <nav className="lp-navbar">
        <div className="lp-logo">
          <img src="/new-logo-hexper.png" alt="Hexpar AI Logo" />
          Hexpar <span style={{color: '#8b5cf6'}}>AI</span>
        </div>
        <div className="lp-nav-links">
          <a href="#" className="active">Home</a>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#blog">Blog</a>
          <a href="#docs">Docs</a>
          <a href="#contact">Contact</a>
        </div>
        <div className="lp-nav-actions">
          <button className="lp-btn-outline" onClick={() => navigate('/log-in')}>Sign In</button>
          <button className="lp-btn-primary" onClick={() => navigate('/sign-in')}>Sign Up</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="lp-hero">
        <div className="lp-hero-content">
          <div className="lp-hero-badge">
            <span>✦</span> Powered by Gemini, Grok & More
          </div>
          <h1 className="lp-hero-title">
            <span className="gradient-text">Smarter</span> AI.<br/>
            <span className="gradient-text">Better</span> Solutions.
          </h1>
          <p className="lp-hero-subtitle">
            Hexpar AI brings the power of next-gen AI models together in one platform. Chat, create, code, analyze and automate your work like never before.
          </p>
          <div className="lp-hero-ctas">
            <button className="lp-btn-primary" onClick={() => navigate('/sign-in')}>Try Hexpar AI Now ➔</button>
            <button className="lp-btn-outline" onClick={() => {
              document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
            }}>Explore Features</button>
          </div>
          <div className="lp-users-loved">
            <div className="lp-avatars">
              <img src="/images/avatar-1.png" onError={(e) => e.target.src="https://i.pravatar.cc/100?img=1"} alt="User" />
              <img src="/images/avatar-2.png" onError={(e) => e.target.src="https://i.pravatar.cc/100?img=2"} alt="User" />
              <img src="/images/avatar-3.png" onError={(e) => e.target.src="https://i.pravatar.cc/100?img=3"} alt="User" />
              <img src="/images/avatar-4.png" onError={(e) => e.target.src="https://i.pravatar.cc/100?img=4"} alt="User" />
            </div>
            <div className="lp-users-text">
              <div className="lp-stars">★★★★★</div>
              Loved by 10,000+ users
            </div>
          </div>
        </div>
        <div className="lp-hero-visual">
          <img src="/images/hero-3d-h.png" alt="Hexpar AI Core" className="lp-hero-3d" />
        </div>
      </section>

      {/* Tech Stack Strip */}
      <div className="lp-tech-strip">
        <div className="lp-tech-title">BUILT WITH THE WORLD'S BEST AI TECHNOLOGY</div>
        <div className="lp-tech-logos">
          <span>✧ Gemini</span>
          <span>⊗ Grok</span>
          <span>◉ OpenAI</span>
          <span>∞ Meta</span>
          <span>M Mistral AI</span>
          <span>◬ Pinecone</span>
        </div>
      </div>

      {/* Features Grid */}
      <section id="features" className="lp-section">
        <div className="lp-section-header">
          <div className="lp-section-label">FEATURES</div>
          <h2 className="lp-section-title">Everything You Need in One AI Platform</h2>
          <p className="lp-section-subtitle">Powerful tools. Advanced models. Unlimited possibilities.</p>
        </div>
        
        <div className="lp-features-grid">
          <div className="lp-feature-card">
            <div className="lp-feature-icon bg-blue">💬</div>
            <h3>AI Chat Assistant</h3>
            <p>Chat with the most advanced AI models for instant, accurate and smart responses.</p>
          </div>
          <div className="lp-feature-card">
            <div className="lp-feature-icon bg-purple">🖼️</div>
            <h3>Image Generation</h3>
            <p>Create stunning images with AI. From art to marketing, bring your ideas to life.</p>
          </div>
          <div className="lp-feature-card">
            <div className="lp-feature-icon bg-pink">💻</div>
            <h3>Code Generation</h3>
            <p>Generate, explain and debug code in any programming language instantly.</p>
          </div>
          <div className="lp-feature-card">
            <div className="lp-feature-icon bg-blue">📄</div>
            <h3>Document Analysis</h3>
            <p>Upload any document and get AI insights, summaries and key information.</p>
          </div>
          <div className="lp-feature-card">
            <div className="lp-feature-icon bg-purple">🌐</div>
            <h3>Web Search</h3>
            <p>Get real-time information from the web with AI powered search.</p>
          </div>
          <div className="lp-feature-card">
            <div className="lp-feature-icon bg-pink">🛠️</div>
            <h3>AI Tools Hub</h3>
            <p>Access a growing collection of AI tools all in one powerful platform.</p>
          </div>
        </div>
        <div className="lp-center-btn">
          <button className="lp-btn-outline" onClick={() => navigate('/sign-in')}>Explore All Features ➔</button>
        </div>
      </section>

      {/* Stats Row */}
      <div className="lp-stats-row">
        <div className="lp-stat-item">
          <div className="lp-stat-icon">👤</div>
          <div className="lp-stat-info">
            <h4>10K+</h4>
            <p>Active Users</p>
          </div>
        </div>
        <div className="lp-stat-item">
          <div className="lp-stat-icon">📈</div>
          <div className="lp-stat-info">
            <h4>25M+</h4>
            <p>Messages Processed</p>
          </div>
        </div>
        <div className="lp-stat-item">
          <div className="lp-stat-icon">🖼️</div>
          <div className="lp-stat-info">
            <h4>500K+</h4>
            <p>Images Generated</p>
          </div>
        </div>
        <div className="lp-stat-item">
          <div className="lp-stat-icon">🛡️</div>
          <div className="lp-stat-info">
            <h4>99.9%</h4>
            <p>Uptime</p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <section className="lp-section">
        <div className="lp-section-header">
          <div className="lp-section-label">HOW IT WORKS</div>
          <h2 className="lp-section-title">Get Started in 3 Simple Steps</h2>
        </div>
        
        <div className="lp-steps">
          <div className="lp-step">
            <div className="lp-step-icon">
              <div className="lp-step-num">1</div>
              👤
            </div>
            <h3>Create an Account</h3>
            <p style={{color: '#94a3b8', fontSize: '14px'}}>Sign up for free and access powerful AI tools instantly.</p>
          </div>
          
          <div className="lp-step-arrow">➔</div>
          
          <div className="lp-step">
            <div className="lp-step-icon">
              <div className="lp-step-num">2</div>
              🎛️
            </div>
            <h3>Choose Your Tool</h3>
            <p style={{color: '#94a3b8', fontSize: '14px'}}>Select from AI chat, image generator, code tools and more.</p>
          </div>
          
          <div className="lp-step-arrow">➔</div>
          
          <div className="lp-step">
            <div className="lp-step-icon">
              <div className="lp-step-num">3</div>
              ✨
            </div>
            <h3>Get Results</h3>
            <p style={{color: '#94a3b8', fontSize: '14px'}}>Get instant, accurate and smart AI-powered results.</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="lp-section">
        <div className="lp-section-header">
          <div className="lp-section-label">WHAT OUR USERS SAY</div>
          <h2 className="lp-section-title">Trusted by Thousands of Users</h2>
        </div>
        
        <div className="lp-testimonials-grid">
          <div className="lp-testimonial-card">
            <div className="lp-quote-icon">"</div>
            <p>Hexpar AI changed the way I work. It's fast, accurate and incredibly powerful.</p>
            <div className="lp-testimonial-author">
              <img src="https://i.pravatar.cc/100?img=11" alt="Amit Sharma" />
              <div className="lp-author-info">
                <h4>Amit Sharma</h4>
                <span>Developer</span>
              </div>
              <div className="lp-author-stars">★★★★★</div>
            </div>
          </div>
          
          <div className="lp-testimonial-card">
            <div className="lp-quote-icon">"</div>
            <p>The best AI platform I've used so far. The tools are top-notch and very easy to use.</p>
            <div className="lp-testimonial-author">
              <img src="https://i.pravatar.cc/100?img=5" alt="Priya Verma" />
              <div className="lp-author-info">
                <h4>Priya Verma</h4>
                <span>Designer</span>
              </div>
              <div className="lp-author-stars">★★★★★</div>
            </div>
          </div>
          
          <div className="lp-testimonial-card">
            <div className="lp-quote-icon">"</div>
            <p>From code generation to document analysis, everything works seamlessly!</p>
            <div className="lp-testimonial-author">
              <img src="https://i.pravatar.cc/100?img=8" alt="Rahul Mehta" />
              <div className="lp-author-info">
                <h4>Rahul Mehta</h4>
                <span>Entrepreneur</span>
              </div>
              <div className="lp-author-stars">★★★★★</div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog & Newsletter */}
      <section id="blog" className="lp-section">
        <div className="lp-section-header" style={{textAlign: 'left'}}>
          <div className="lp-section-label">FROM OUR BLOG</div>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
            <h2 className="lp-section-title">Latest Articles & Updates</h2>
            <a href="#" style={{color: '#3b82f6', textDecoration: 'none', fontSize: '14px', fontWeight: '500'}}>View all articles ➔</a>
          </div>
        </div>
        
        <div className="lp-blog-grid">
          <div className="lp-blog-card">
            <div className="lp-blog-img">
              <img src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=500&q=80" alt="Blog 1" />
              <span className="lp-blog-tag">AI Guide</span>
            </div>
            <div className="lp-blog-content">
              <h3>How AI is Transforming the Future of Work</h3>
              <p>Explore how AI tools are boosting productivity and changing the way we work.</p>
              <div className="lp-blog-meta">May 20, 2024 • 5 min read</div>
            </div>
          </div>
          
          <div className="lp-blog-card">
            <div className="lp-blog-img">
              <img src="https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=500&q=80" alt="Blog 2" />
              <span className="lp-blog-tag">Tutorial</span>
            </div>
            <div className="lp-blog-content">
              <h3>Getting Started with Hexpar AI Tools</h3>
              <p>A complete guide to using Hexpar AI tools effectively.</p>
              <div className="lp-blog-meta">May 18, 2024 • 7 min read</div>
            </div>
          </div>
          
          <div className="lp-blog-card">
            <div className="lp-blog-img">
              <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&q=80" alt="Blog 3" />
              <span className="lp-blog-tag">Update</span>
            </div>
            <div className="lp-blog-content">
              <h3>New Features: What's New in Hexpar AI</h3>
              <p>Check out the latest features and improvements we've added.</p>
              <div className="lp-blog-meta">May 15, 2024 • 4 min read</div>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section" style={{paddingTop: '0'}}>
        <div className="lp-newsletter">
          <div className="lp-nl-left">
            <div className="lp-nl-icon">✉️</div>
            <div>
              <h3>Stay Updated with Hexpar AI</h3>
              <p>Get the latest updates, tips and AI insights straight to your inbox.</p>
            </div>
          </div>
          <div className="lp-nl-form">
            <input type="email" placeholder="Enter your email" />
            <button>Subscribe</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-footer-grid">
          <div className="lp-footer-brand">
            <div className="lp-logo">
              <img src="/new-logo-hexper.png" alt="Hexpar AI Logo" />
              Hexpar <span style={{color: '#8b5cf6'}}>AI</span>
            </div>
            <p>Smarter AI. Better Solutions.</p>
            <div className="lp-socials">
              <span>Discord</span>
              <span>Twitter</span>
              <span>LinkedIn</span>
              <span>GitHub</span>
            </div>
          </div>
          
          <div className="lp-footer-col">
            <h4>Product</h4>
            <ul>
              <li><a href="#">Features</a></li>
              <li><a href="#">Pricing</a></li>
              <li><a href="#">AI Tools</a></li>
              <li><a href="#">Documentation</a></li>
            </ul>
          </div>
          
          <div className="lp-footer-col">
            <h4>Company</h4>
            <ul>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>
          
          <div className="lp-footer-col">
            <h4>Resources</h4>
            <ul>
              <li><a href="#">Help Center</a></li>
              <li><a href="#">API Docs</a></li>
              <li><a href="#">Guides</a></li>
              <li><a href="#">Status</a></li>
            </ul>
          </div>
          
          <div className="lp-footer-col">
            <h4>Legal</h4>
            <ul>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Refund Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="lp-footer-bottom">
          © 2024 Hexpar AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
