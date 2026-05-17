import React, { useRef, useEffect, useState } from 'react';
import './Terminal.css';

export default function Terminal({ transcript, aiResponse, isListening, isProcessing, showTerminal, onSendMessage }) {
  const terminalEndRef = useRef(null);
  const [inputValue, setInputValue] = useState("");

  const scrollToBottom = () => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [transcript, aiResponse]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  if (!showTerminal) return null;

  return (
    <div 
      className="terminal-container"
      style={{
        pointerEvents: "auto"
      }}
    >
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
            NURA_OUTPUT.SYS
          </div>
          <div className="terminal-content ai-text">
            {aiResponse}
            {isProcessing && <span className="terminal-cursor"></span>}
          </div>
        </div>
      )}

      <div className="terminal-input-section">
        <span className="input-prompt">&gt;</span>
        <input 
          type="text" 
          className="terminal-input" 
          placeholder="TYPE_COMMAND_HERE..." 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      <div ref={terminalEndRef} />
    </div>
  );
}
