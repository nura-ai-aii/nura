import React, { useState, useEffect, useCallback } from 'react';
import './AlertSystem.css';
import DraggableComponent from './DraggableComponent';


let alertIdCounter = 0;

// ── Alert Sound Engine (Web Audio API — no files needed) ──────────
// eslint-disable-next-line no-unused-vars
const playAlertSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    const playTone = (freq, startTime, duration, vol = 0.15, waveType = 'sine') => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = waveType;
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(vol, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;

    if (type === 'error' || type === 'critical') {
      // Gentle, low-frequency minor-third warning chime
      playTone(523.25, now, 0.25, 0.12, 'triangle'); // C5
      playTone(392.00, now + 0.1, 0.35, 0.1, 'triangle'); // G4
    } else if (type === 'success') {
      // Soft, high-tech dual major chord chime (positive, uplifting digital notice)
      playTone(783.99, now, 0.12, 0.08, 'sine'); // G5
      playTone(1046.50, now + 0.08, 0.18, 0.06, 'sine'); // C6
    } else if (type === 'warning') {
      // Pleasant alert chime
      playTone(587.33, now, 0.15, 0.1, 'sine'); // D5
      playTone(698.46, now + 0.08, 0.2, 0.08, 'sine'); // F5
    } else {
      // Soft liquid tech ping
      playTone(880, now, 0.08, 0.08, 'sine'); // A5
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

const getErrorCode = (type) => {
  let hash = 5381;
  for (let i = 0; i < type.length; i++) {
    hash = (hash * 33) ^ type.charCodeAt(i);
  }
  // Ensure it's exactly 10 digits
  return (Math.abs(hash) % 10000000000).toString().padStart(10, '0');
};

const getAlertIcon = (type) => {
  if (type.includes('DOWN') || type.includes('ERROR')) return '⚠';
  if (type.includes('RESTORED') || type.includes('OK')) return '✓';
  return '◆';
};

export default function AlertSystem({ apiHealth }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((alert) => {
    setToasts(prev => [alert, ...prev].slice(0, 6));
    if (alert.critical) {
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
      {/* Critical Full-Screen Overlay Removed as per user request */}

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
                <div className="toast-type">
                  {getAlertStyle(toast.type) === 'error' ? 'SYSTEM ERROR' : toast.type.replace(/_/g, ' ')}
                </div>
                <div className="toast-msg">
                  {getAlertStyle(toast.type) === 'error' 
                    ? `Something went wrong. Unique code: ${getErrorCode(toast.type)}. Please share this with us.`
                    : toast.message}
                </div>
              </div>
              <div className="toast-bar" />
            </div>
          ))}
        </div>
      </DraggableComponent>
    </>
  );
}
