import React, { useState, useEffect } from 'react';
import './Status.css';

export default function Status({ isListening, apiStatus, interactionCount = 0 }) {
  const [micPermission, setMicPermission] = useState('PENDING');

  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' }).then((result) => {
        setMicPermission(result.state.toUpperCase());
        result.onchange = () => {
          setMicPermission(result.state.toUpperCase());
        };
      }).catch(() => {
        setMicPermission('UNKNOWN');
      });
    }
  }, []);

  // Relationship Familiarity Sync Calculations
  const level = Math.floor(interactionCount / 20) + 1;
  const syncPercentage = Math.min(100, Math.floor(((interactionCount % 20) / 20) * 100));
  
  const getSyncRank = () => {
    if (interactionCount <= 5) return 'ACQUAINTANCE';
    if (interactionCount <= 20) return 'FRIENDLY COMPANION';
    if (interactionCount <= 50) return 'TRUSTED PARTNER';
    if (interactionCount <= 100) return 'NEURAL COMPANION';
    return 'SOUL CONTEXT LINKED 😭';
  };

  const StatusItem = ({ label, value, color }) => (
    <div className="status-item">
      <span className="status-label">{label}:</span>
      <span className="status-value" style={{ color: color || '#00ffe1' }}>{value}</span>
    </div>
  );

  return (
    <div className="status-container">
      <div className="status-header">SYSTEM_STATUS</div>
      <div className="status-grid">
        <StatusItem label="SYSTEM" value="ONLINE" color="#00ffe1" />
        <StatusItem label="Hexpar AI" value="ACTIVE" color="#00ffe1" />
        <StatusItem label="MICROPHONE" value={isListening ? 'ON' : 'OFF'} color={isListening ? '#00ffe1' : '#ff4444'} />
        <StatusItem label="PERMISSION" value={micPermission} color={micPermission === 'GRANTED' ? '#00ffe1' : '#ff4444'} />
        <StatusItem label="API_LINK" value={apiStatus} color={apiStatus === 'CONNECTED' ? '#00ffe1' : '#ff4444'} />
      </div>

      <div className="familiarity-widget">
        <div className="familiarity-header">
          <span>NEURAL SYNC LINK</span>
          <span>LVL {level}</span>
        </div>
        <div className="familiarity-bar-wrap">
          <div className="familiarity-bar-fill" style={{ width: `${syncPercentage}%` }} />
          <div className="familiarity-bar-glow" style={{ left: `${syncPercentage}%` }} />
        </div>
        <div className="familiarity-footer">
          <span>{getSyncRank()}</span>
          <span>{syncPercentage}%</span>
        </div>
      </div>
    </div>
  );
}
