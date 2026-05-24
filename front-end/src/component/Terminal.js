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
  onAnalyzeImage 
}) {
  const terminalEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [inputValue, setInputValue] = useState("");
  const [activeTab, setActiveTab] = useState("chat");
  const [imagePreview, setImagePreview] = useState(null);

  const scrollToBottom = () => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [transcript, aiResponse, imagePreview]);

  // If mood is changed, switch tabs appropriately
  useEffect(() => {
    if (activeMood !== 'hw') {
      setActiveTab('chat');
    }
  }, [activeMood]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // 1. Generate local base64 preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      // 2. Dispatch to vision analyzer
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

  if (!showTerminal) return null;

  const classicFeatures = [
    "AI Homework Generator",
    "Smart Class Notes Creator",
    "Automatic Chapter Summarizer",
    "Handwriting to Digital Notes",
    "Voice-to-Notes System",
    "AI Lesson Planner for Teachers",
    "Smart Quiz Generator",
    "MCQ Test Creator",
    "Homework Checking Assistant",
    "AI Doubt Solver",
    "Live Blackboard Scanner",
    "PDF Notes Simplifier",
    "Smart Attendance Manager",
    "Timetable Generator",
    "Exam Preparation Mode",
    "Study Streak Tracker",
    "AI Study Buddy",
    "Classroom Announcement System",
    "Assignment Deadline Reminder",
    "AI Report Card Analyzer",
    "Personalized Study Suggestions",
    "AI Flashcard Generator",
    "Spoken Explanation Mode",
    "Interactive Learning Dashboard",
    "AI Diagram Generator",
    "Instant Formula Finder",
    "Math Step-by-Step Solver",
    "Science Experiment Explainer",
    "AI Grammar Corrector",
    "Essay Writing Assistant",
    "Coding Practice Assistant",
    "Smart Reading Mode",
    "Learning Progress Tracker",
    "Classroom Voice Assistant",
    "AI Parent Report Generator",
    "Auto Question Paper Generator",
    "Teacher Feedback Assistant",
    "AI Project Idea Generator",
    "Smart Revision Notes",
    "Concept Visualization Mode",
    "AI Mindmap Creator",
    "Homework Difficulty Analyzer",
    "Subject-Based AI Modes",
    "AI Research Assistant",
    "Classroom Productivity Timer",
    "Real-Time Translation for Classes",
    "AI Presentation Builder",
    "Study Focus Mode",
    "AI Learning Recommendations",
    "Digital Classroom Companion"
  ];

  const handleFeatureClick = (feature) => {
    setActiveTab('chat');
    onSendMessage(`Analyze and execute the Classic Education Feature: "${feature}". Provide a comprehensive, step-by-step classic explanation and ask how you can help Master Nur Mohammad Mandal with it.`);
  };

  return (
    <div 
      className={`terminal-container ${activeMood === 'hw' ? 'mood-hw' : ''}`}
      style={{ pointerEvents: "auto" }}
    >
      {/* Premium Tab Switcher in HW Mode */}
      {activeMood === 'hw' && (
        <div className="terminal-tabs">
          <button 
            className={`terminal-tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            ◆ CONSOLE CHAT
          </button>
          <button 
            className={`terminal-tab ${activeTab === 'features' ? 'active' : ''}`}
            onClick={() => setActiveTab('features')}
          >
            ◆ EDUCATION CORE (50)
          </button>
        </div>
      )}

      {activeTab === 'chat' ? (
        <>
          {/* Main Chat Mode */}
          <div className="terminal-messages-wrapper">
            {imagePreview && (
              <div className="terminal-section image-preview-section">
                <div className="terminal-header">
                  <span>ANALYZING_IMAGE.LENS</span>
                  <button className="clear-preview-btn" onClick={clearImagePreview} title="Clear Image">✕</button>
                </div>
                <div className="terminal-content">
                  <img src={imagePreview} alt="Lens Preview" className="terminal-image-preview" />
                  {isProcessing && <div className="lens-overlay-scanning">SCANNING_IMAGE...</div>}
                </div>
              </div>
            )}

            <div className="terminal-section">
              <div className="terminal-header">
                {isListening && <span className="terminal-dot"></span>}
                USER_INPUT.LOG
              </div>
              <div className="terminal-content user-text">
                {transcript ? transcript : (isListening ? "Listening..." : "---")}
                {isListening && <span className="terminal-cursor"></span>}
              </div>
            </div>

            {(aiResponse || isProcessing) && (
              <div className="terminal-section ai-section">
                <div className="terminal-header ai-header">
                  {isProcessing && <span className="terminal-dot ai-dot"></span>}
                  HEXPAR_OUTPUT.SYS
                </div>
                <div className="terminal-content ai-text">
                  {aiResponse}
                  {isProcessing && <span className="terminal-cursor"></span>}
                </div>
              </div>
            )}
          </div>

          <div className="terminal-input-section">
            {/* "+" Image Upload Trigger */}
            <label className="terminal-upload-btn" title="Upload image for Google Lens analysis">
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef}
                style={{ display: 'none' }} 
                onChange={handleFileChange}
              />
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </label>

            <span className="input-prompt">&gt;</span>
            <input 
              type="text" 
              className="terminal-input" 
              placeholder={activeMood === 'hw' ? "ASK_CLASSIC_EDUCATION_CORE..." : "TYPE_COMMAND_HERE..."} 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        </>
      ) : (
        /* 50 Classic Education Features tab */
        <div className="classic-features-wrapper">
          <div className="features-header">
            <h3>Hexpar AI — Classic Education Features</h3>
            <p>Helpful for Teachers & Students. Select any core feature to initiate step-by-step assistance.</p>
          </div>
          <div className="classic-features-list">
            {classicFeatures.map((feature, index) => (
              <button 
                key={index} 
                className="feature-item"
                onClick={() => handleFeatureClick(feature)}
              >
                <span className="feature-index">{(index + 1).toString().padStart(2, '0')}</span>
                <span className="feature-text">{feature}</span>
                <span className="feature-arrow">→</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div ref={terminalEndRef} />
    </div>
  );
}
