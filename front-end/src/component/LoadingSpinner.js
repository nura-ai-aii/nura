import React from 'react';
import './LoadingSpinner.css';

export default function LoadingSpinner({ fullScreen = false, message = "" }) {
  return (
    <div className={`ios-spinner-container ${fullScreen ? 'full-screen' : ''}`}>
      <div className="ios-spinner">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="ios-spinner-blade" style={{ transform: `rotate(${i * 30}deg)` }}></div>
        ))}
      </div>
      {message && <div className="ios-spinner-message">{message}</div>}
    </div>
  );
}
