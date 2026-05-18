import React, { useState, useEffect, useRef } from 'react';
import './StatusTerminal.css';

const STATE_LABELS = {
  IDLE: 'STANDBY',
  LISTENING: 'LISTENING',
  THINKING: 'SENSING',
  SPEAKING: 'RESPONDING'
};

export default function StatusTerminal({ interactionState }) {
  const [logs, setLogs] = useState([]);
  const terminalEndRef = useRef(null);

  useEffect(() => {
    const timestamp = new Date().toLocaleTimeString([], { hour12: false });
    const newLog = {
      time: timestamp,
      status: STATE_LABELS[interactionState] || interactionState,
      id: Date.now()
    };

    setLogs(prev => {
      const updated = [...prev, newLog];
      return updated.slice(-10); // Keep last 10 logs
    });
  }, [interactionState]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="status-terminal">
      <div className="status-terminal-header">
        <div className="terminal-controls">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className="terminal-title">REALTIME_STATUS.LOG</div>
      </div>
      <div className="status-terminal-body">
        {logs.map(log => (
          <div key={log.id} className="status-log-line">
            <span className="log-time">[{log.time}]</span>
            <span className="log-prefix">SYS_CORE:</span>
            <span className={`log-status ${log.status.toLowerCase()}`}>{log.status}</span>
          </div>
        ))}
        <div className="status-log-line active">
          <span className="log-time">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
          <span className="log-prefix">STATUS:</span>
          <span className="log-cursor">_</span>
        </div>
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
}
