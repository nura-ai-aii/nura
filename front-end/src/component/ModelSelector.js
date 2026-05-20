import React, { useState, useRef, useEffect } from 'react';
import './ModelSelector.css';
import aiLogo from '../images/AiN.png';

export default function ModelSelector({ selectedModel, setSelectedModel }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const models = [
    { id: 'AUTO', label: 'AUTO ROUTING' },
    { id: 'gpt-5.4-pro', label: 'GPT-5.4 PRO' },
    { id: 'gemini-2.5-flash', label: 'GEMINI 2.5 FLASH' },
    { id: 'llama-3.3-70b', label: 'LLAMA 3.3 70B' }
  ];

  const getActiveLabel = () => {
    const found = models.find(m => m.id === selectedModel);
    return found ? found.label : 'AUTO ROUTING';
  };

  return (
    <div className="model-selector-container" ref={menuRef}>
      <button 
        className={`model-fab ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title={`Active Model: ${getActiveLabel()}`}
      >
        <img src={aiLogo} alt="Model Selection" className="model-fab-logo" />
      </button>

      {isOpen && (
        <div className="model-menu">
          <div className="model-menu-header">◆ ACTIVE CORE</div>
          {models.map(model => (
            <button
              key={model.id}
              className={`model-option ${selectedModel === model.id ? 'selected' : ''}`}
              onClick={() => {
                setSelectedModel(model.id);
                setIsOpen(false);
              }}
            >
              <span className="model-dot" />
              {model.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
