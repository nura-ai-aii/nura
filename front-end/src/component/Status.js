import React, { useState, useEffect } from 'react';
import './Status.css';

export default function Status({ isListening, apiStatus }) {
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
        <StatusItem label="NURA AI" value="ACTIVE" color="#00ffe1" />
        <StatusItem label="MICROPHONE" value={isListening ? 'ON' : 'OFF'} color={isListening ? '#00ffe1' : '#ff4444'} />
        <StatusItem label="PERMISSION" value={micPermission} color={micPermission === 'GRANTED' ? '#00ffe1' : '#ff4444'} />
        <StatusItem label="API_LINK" value={apiStatus} color={apiStatus === 'CONNECTED' ? '#00ffe1' : '#ff4444'} />
      </div>
    </div>
  );
}
