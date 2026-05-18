import React, { useState, useEffect, useCallback } from 'react';
import './AlertSystem.css';
import DraggableComponent from './DraggableComponent';
import { BACKEND_URL } from '../config';


let alertIdCounter = 0;

// ── Alert Sound Engine (Web Audio API — no files needed) ──────────
// eslint-disable-next-line no-unused-vars
const playAlertSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    const playBeep = (freq, startTime, duration, vol = 0.4) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(vol, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;

    if (type === 'error' || type === 'critical') {
      // 3 descending warning beeps — JARVIS-style alert
      playBeep(880, now, 0.18, 0.5);
      playBeep(660, now + 0.22, 0.18, 0.45);
      playBeep(440, now + 0.44, 0.3, 0.5);
      // Repeat after 2 seconds for critical
      if (type === 'critical') {
        setTimeout(() => playAlertSound('error'), 2000);
      }
    } else if (type === 'success') {
      // 2 ascending confirmation tones
      playBeep(660, now, 0.12, 0.25);
      playBeep(880, now + 0.16, 0.2, 0.3);
    } else {
      // Single soft notice beep
      playBeep(600, now, 0.15, 0.2);
    }
  } catch (e) {
    // Audio not supported — silent fallback
  }
};

// Global alert emitter
let _emitAlert = null;
export const emitAlert = (type, message, critical = false) => {
  if (_emitAlert) _emitAlert({ type, message, critical, id: ++alertIdCounter, time: Date.now() });
};

// Alert style helpers (module-level so usable everywhere)
const getAlertStyle = (type) => {
  if (type.includes('DOWN') || type.includes('ERROR') || type.includes('FAILED')) return 'error';
  if (type.includes('RESTORED') || type.includes('OK')) return 'success';
  return 'warning';
};

const getAlertIcon = (type) => {
  if (type.includes('DOWN') || type.includes('ERROR')) return '⚠';
  if (type.includes('RESTORED') || type.includes('OK')) return '✓';
  return '◆';
};

export default function AlertSystem({ apiHealth }) {
  const [toasts, setToasts] = useState([]);
  const [criticalError, setCriticalError] = useState(null);

  const addToast = useCallback((alert) => {
    setToasts(prev => [alert, ...prev].slice(0, 6));
    if (alert.critical) {
      setCriticalError(alert);
      playAlertSound('critical');
    } else {
      const soundType = getAlertStyle(alert.type);
      playAlertSound(soundType);
    }
  }, []);

  useEffect(() => {
    _emitAlert = addToast;
    return () => { _emitAlert = null; };
  }, [addToast]);

  // Auto-dismiss toasts
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(t => Date.now() - t.time < 5000));
    }, 1000);
    return () => clearTimeout(timer);
  }, [toasts]);

  // Watch API health changes and emit alerts
  const prevHealthRef = React.useRef(null);
  useEffect(() => {
    if (!apiHealth) return;
    const prev = prevHealthRef.current;

    if (prev !== null) {
      if (prev.backend === 'ok' && apiHealth.backend !== 'ok') {
        addToast({ type: 'BACKEND_DOWN', message: 'Backend server is unreachable!', critical: true, id: ++alertIdCounter, time: Date.now() });
      } else if (prev.backend !== 'ok' && apiHealth.backend === 'ok') {
        addToast({ type: 'BACKEND_RESTORED', message: 'Backend connection restored.', critical: false, id: ++alertIdCounter, time: Date.now() });
        setCriticalError(null);
      }
      if (prev.groq === 'connected' && apiHealth.groq !== 'connected') {
        addToast({ type: 'GROQ_ERROR', message: 'Groq AI API connection failed!', critical: false, id: ++alertIdCounter, time: Date.now() });
      } else if (prev.groq !== 'connected' && apiHealth.groq === 'connected') {
        addToast({ type: 'GROQ_RESTORED', message: 'Groq AI API reconnected.', critical: false, id: ++alertIdCounter, time: Date.now() });
      }
    }

    prevHealthRef.current = apiHealth;
  }, [apiHealth, addToast]);


  return (
    <>
      {/* Critical Full-Screen Overlay */}
      {criticalError && (
        <div className="critical-overlay" onClick={() => setCriticalError(null)}>
          <div className="critical-box">
            <div className="critical-icon">!</div>
            <div className="critical-title">SYSTEM ALERT</div>
            <div className="critical-type">{criticalError.type.replace(/_/g, ' ')}</div>
            <div className="critical-msg">{criticalError.message}</div>
            <div className="critical-hint">Check backend server at {BACKEND_URL}</div>
            <button className="critical-dismiss" onClick={() => setCriticalError(null)}>
              ACKNOWLEDGE
            </button>
          </div>
          <div className="critical-scan-h" />
          <div className="critical-scan-v" />
        </div>
      )}

      {/* Toast Notifications */}
      <DraggableComponent id="alert-toasts" initialPos={{ bottom: 30, right: 1200 }}>
        <div className="toast-container" style={{ position: 'relative', bottom: 'auto', left: 'auto' }}>
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`toast toast-${getAlertStyle(toast.type)}`}
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            >
              <span className="toast-icon">{getAlertIcon(toast.type)}</span>
              <div className="toast-body">
                <div className="toast-type">{toast.type.replace(/_/g, ' ')}</div>
                <div className="toast-msg">{toast.message}</div>
              </div>
              <div className="toast-bar" />
            </div>
          ))}
        </div>
      </DraggableComponent>
    </>
  );
}
