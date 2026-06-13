import React from 'react';
import * as LucideIcons from 'lucide-react';
import './NeonIcon.css';

const NeonIcon = ({ icon, size = 24, className = '', colorClass = 'neon-primary' }) => {
  const IconComponent = LucideIcons[icon];

  const renderDefs = () => {
    // Only render defs once per app, but for simplicity we can include them in the DOM. 
    // Usually it's better at the root, but this guarantees it exists.
    if (!document.getElementById('neon-gradient-primary')) {
      return (
        <svg width="0" height="0" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
          <defs>
            <linearGradient id="neon-gradient-primary" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f2fe" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
      );
    }
    return null;
  };

  if (!IconComponent) {
    console.warn(`Icon "${icon}" not found in lucide-react`);
    return (
      <>
        {renderDefs()}
        <LucideIcons.HelpCircle size={size} className={`neon-icon-base ${colorClass} ${className}`} />
      </>
    );
  }

  return (
    <>
      {renderDefs()}
      <div className={`neon-icon-wrapper ${className}`} style={{ width: size, height: size }}>
        <IconComponent size={size} className={`neon-icon-base ${colorClass}`} />
      </div>
    </>
  );
};

export default NeonIcon;
