import React, { useEffect, useRef, useState } from 'react';
import robotImage from '../images/robot-help.png';
import { BACKEND_URL } from '../config';

export default function HwPlasmaOrb({ 
  size = 300, 
  setTranscript, 
  setIsListening, 
  speechLang = 'en-US', 
  isSpeaking = false, 
  interactionState, 
  interactionCount = 0 
}) {
  const [micActive, setMicActive] = useState(false);
  const [micError, setMicError] = useState(null);
  
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const audioStreamRef = useRef(null);
  const animFrameRef = useRef(null);
  
  const [audioLevel, setAudioLevel] = useState(0);
  const micActiveRef = useRef(false);
  
  useEffect(() => {
    micActiveRef.current = micActive;
  }, [micActive]);

  const interactionStateRef = useRef(interactionState);
  useEffect(() => {
    interactionStateRef.current = interactionState;
  }, [interactionState]);

  // ── BACKEND WHISPER STT ──────────────────────────────────────
  const mediaRecorderRef = useRef(null);
  const speechChunksRef = useRef([]);
  const sttLangRef = useRef(speechLang);

  useEffect(() => {
    sttLangRef.current = speechLang;
  }, [speechLang]);

  const sendAudioToBackend = async (chunks) => {
    if (!chunks || chunks.length === 0) return;
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
    const blob = new Blob(chunks, { type: mimeType });
    if (blob.size < 500) return;

    const formData = new FormData();
    formData.append('audio', blob, 'speech.webm');
    formData.append('language', sttLangRef.current);

    try {
      console.log('[STT ROBOT] Sending audio...');
      const response = await fetch(`${BACKEND_URL}/api/stt`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.text && data.text.trim()) {
        console.log('[STT ROBOT] Text:', data.text);
        if (setTranscript) {
          setTranscript(prev => prev ? `${prev} ${data.text}`.trim() : data.text.trim());
        }
      }
    } catch (error) {
      console.error('[STT ROBOT] Backend error:', error.message);
    }
  };

  const startMediaRecorder = (stream) => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') return;

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
    const recorder = new MediaRecorder(stream, { mimeType });
    speechChunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        speechChunksRef.current.push(e.data);
      }
    };

    recorder.onstop = async () => {
      const chunks = [...speechChunksRef.current];
      speechChunksRef.current = [];
      await sendAudioToBackend(chunks);
      if (micActiveRef.current && stream.active) {
        startMediaRecorder(stream);
      }
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
  };

  const stopRecordingChunk = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  // ── VAD (Voice Activity Detection) ──────────────────────────
  const vadRef = useRef({ speaking: false, silenceMs: 0, totalMs: 0, lastSpeechTime: 0 });

  const tickVAD = (level) => {
    const vad = vadRef.current;
    const now = Date.now();
    
    const SPEECH_THRESHOLD = 0.035;
    const SILENCE_TIMEOUT_MS = 400;
    const MAX_RECORDING_MS = 5000;

    if (level > SPEECH_THRESHOLD) {
      if (!vad.speaking) {
        vad.speaking = true;
        vad.totalMs = 0;
      }
      vad.silenceMs = 0;
      vad.lastSpeechTime = now;
    }

    if (vad.speaking) {
      vad.silenceMs += 16; 
      vad.totalMs += 16;
      
      if (vad.silenceMs > SILENCE_TIMEOUT_MS || vad.totalMs > MAX_RECORDING_MS) {
        vad.speaking = false;
        vad.silenceMs = 0;
        vad.totalMs = 0;
        stopRecordingChunk();
      }
    }
  };

  // Audio Analyser Loop
  useEffect(() => {
    const updateAudioLevel = () => {
      if (analyserRef.current) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const avg = sum / (bufferLength * 255);
        setAudioLevel(avg);
        tickVAD(avg);
      }
      animFrameRef.current = requestAnimationFrame(updateAudioLevel);
    };

    if (micActive) {
      animFrameRef.current = requestAnimationFrame(updateAudioLevel);
    } else {
      setAudioLevel(0);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [micActive]);

  const stopMic = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(t => t.stop());
      audioStreamRef.current = null;
    }
    analyserRef.current = null;
    setMicActive(false);
    if (setIsListening) setIsListening(false);
  };

  const toggleMic = async () => {
    if (micActive) {
      stopMic();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') await ctx.resume();

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      audioStreamRef.current = stream;
      
      setMicActive(true);
      setMicError(null);
      if (setIsListening) setIsListening(true);
      startMediaRecorder(stream);
    } catch (e) {
      setMicError("Microphone access denied.");
    }
  };

  useEffect(() => {
    return () => {
      stopMic();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isThinking = interactionState === 'THINKING';
  const isSpeakingState = interactionState === 'SPEAKING';

  return (
    <div 
      className={`robot-helper-container ${isThinking ? 'thinking' : ''} ${isSpeakingState ? 'speaking' : ''} ${micActive ? 'listening' : ''}`}
      style={{
        width: size + "px",
        height: (size + 50) + "px",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        zIndex: 1000,
        pointerEvents: "none"
      }}
    >
      <div className="robot-viewport">
        {/* Holographic Glowing Pedestal Background Ring */}
        <div className="pedestal-hologram"></div>
        
        {/* Cloud data-stream rings representing tech node connections */}
        <div className="tech-nodes-ring"></div>

        {/* Dynamic Thruster Light Stream (Lava/Fiery Code lines at base) */}
        <div className="jet-booster-stream"></div>

        {/* The Animated Floating Robot Body */}
        <div className="robot-wrapper">
          <img 
            src={robotImage} 
            alt="AI Homework Companion" 
            className="robot-body-img"
            style={{
              transform: isSpeakingState 
                ? `scale(${1.02 + audioLevel * 0.1})` 
                : isThinking 
                ? 'scale(1.05) rotate(2deg)' 
                : 'scale(1)'
            }}
          />
          {/* Glowing mechanical eyes reacting to speaking/thinking */}
          <div className="glowing-eyes-overlay">
            <span className="eye eye-left"></span>
            <span className="eye eye-right"></span>
          </div>
        </div>
      </div>

      {/* Mic toggle and speaking levels */}
      <div className="robot-control-dock" style={{ pointerEvents: 'auto' }}>
        <button
          id="mic-toggle-btn"
          onClick={toggleMic}
          className={`robot-mic-btn ${micActive ? 'active' : ''}`}
          aria-label={micActive ? "Stop microphone" : "Start microphone"}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {micActive ? (
              <>
                <rect x="9" y="2" width="6" height="12" rx="3"/>
                <path d="M5 10a7 7 0 0 0 14 0"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
                <line x1="9" y1="21" x2="15" y2="21"/>
              </>
            ) : (
              <>
                <rect x="9" y="2" width="6" height="12" rx="3"/>
                <path d="M5 10a7 7 0 0 0 14 0"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
                <line x1="9" y1="21" x2="15" y2="21"/>
                <line x1="3" y1="3" x2="21" y2="21" stroke="#ff3333" strokeWidth="2"/>
              </>
            )}
          </svg>
        </button>
        
        {micActive && (
          <div className="robot-audio-waves">
            {[0, 1, 2, 3, 4].map(i => (
              <div 
                key={i} 
                className="wave-bar" 
                style={{
                  height: `${6 + audioLevel * (20 + i * 4)}px`,
                  animationDelay: `${i * 0.08}s`
                }}
              />
            ))}
          </div>
        )}
        
        {micError && <p className="robot-mic-error">{micError}</p>}
        <p className="robot-status-text">
          {isThinking ? "thinking..." : isSpeakingState ? "speaking..." : micActive ? "listening" : "tap to speak"}
        </p>
      </div>

      <style>{`
        .robot-helper-container {
          perspective: 1000px;
        }

        .robot-viewport {
          position: relative;
          width: 100%;
          height: 80%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .robot-wrapper {
          position: relative;
          width: 150px;
          height: 170px;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: floatBob 3s ease-in-out infinite alternate;
          z-index: 5;
        }

        .robot-body-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          filter: drop-shadow(0 0 15px rgba(255, 85, 0, 0.2));
          transition: transform 0.15s ease;
        }

        .robot-helper-container.speaking .robot-body-img {
          animation: armWobble 0.25s infinite alternate;
          filter: drop-shadow(0 0 25px rgba(255, 85, 0, 0.45));
        }

        .robot-helper-container.thinking .robot-body-img {
          animation: thinkingPulse 0.4s infinite alternate;
          filter: drop-shadow(0 0 30px rgba(255, 85, 0, 0.6));
        }

        /* Continuous Bobbing */
        @keyframes floatBob {
          from { transform: translateY(0px) rotate(0deg); }
          to { transform: translateY(-12px) rotate(1deg); }
        }

        /* Speak wiggles for arms/hands response */
        @keyframes armWobble {
          0% { transform: translateY(0) rotate(-1deg) scale(1.01); }
          100% { transform: translateY(-3px) rotate(1deg) scale(1.03); }
        }

        @keyframes thinkingPulse {
          0% { transform: scale(1.02) translateY(0); opacity: 0.85; }
          100% { transform: scale(1.06) translateY(-4px); opacity: 1; }
        }

        /* Glowing mechanical eyes */
        .glowing-eyes-overlay {
          position: absolute;
          top: 31%;
          left: 50%;
          transform: translateX(-50%);
          width: 54px;
          height: 15px;
          display: flex;
          justify-content: space-between;
          pointer-events: none;
          z-index: 6;
          opacity: 0.85;
        }

        .eye {
          width: 12px;
          height: 12px;
          background: #ff5500;
          border-radius: 50%;
          box-shadow: 0 0 10px #ff5500, 0 0 20px #ff5500;
          animation: blinkEye 4s infinite;
        }

        .robot-helper-container.thinking .eye {
          background: #ffaa00 !important;
          box-shadow: 0 0 12px #ffaa00, 0 0 22px #ffaa00 !important;
        }

        @keyframes blinkEye {
          0%, 95%, 100% { transform: scaleY(1); }
          97.5% { transform: scaleY(0.1); }
        }

        /* Holographic pedestal at base */
        .pedestal-hologram {
          position: absolute;
          bottom: 25px;
          width: 130px;
          height: 25px;
          border-radius: 50%;
          border: 2px dashed rgba(255, 85, 0, 0.4);
          background: radial-gradient(ellipse at center, rgba(255, 85, 0, 0.15) 0%, rgba(255, 85, 0, 0) 70%);
          box-shadow: 0 0 20px rgba(255, 85, 0, 0.35);
          animation: spinPedestal 12s linear infinite;
          transform: rotateX(70deg);
          z-index: 1;
        }

        @keyframes spinPedestal {
          from { transform: rotateX(70deg) rotate(0deg); }
          to { transform: rotateX(70deg) rotate(360deg); }
        }

        /* Jet Booster Light Stream */
        .jet-booster-stream {
          position: absolute;
          bottom: 45px;
          width: 14px;
          height: 70px;
          background: linear-gradient(180deg, #ff5500 0%, rgba(255, 170, 0, 0.5) 40%, rgba(255, 85, 0, 0) 100%);
          border-radius: 4px;
          box-shadow: 0 0 15px rgba(255, 85, 0, 0.6);
          animation: streamFlicker 0.15s infinite alternate;
          z-index: 2;
          transform-origin: top;
        }

        .robot-helper-container.speaking .jet-booster-stream {
          height: 90px;
          background: linear-gradient(180deg, #ff5500 0%, #ffaa00 50%, rgba(255, 85, 0, 0) 100%);
          box-shadow: 0 0 25px rgba(255, 85, 0, 0.85);
        }

        @keyframes streamFlicker {
          0% { transform: scaleX(0.9) scaleY(0.95); opacity: 0.8; }
          100% { transform: scaleX(1.1) scaleY(1.05); opacity: 1; }
        }

        /* Floating Cloud data nodes */
        .tech-nodes-ring {
          position: absolute;
          width: 220px;
          height: 180px;
          border-radius: 50%;
          border: 1px dashed rgba(255, 85, 0, 0.15);
          animation: rotateTech 25s linear infinite;
          z-index: 0;
          opacity: 0.6;
        }

        @keyframes rotateTech {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Controls dock */
        .robot-control-dock {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          margin-top: -10px;
        }

        .robot-mic-btn {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          border: 2px solid #ff5500;
          background: rgba(255, 85, 0, 0.1);
          color: #ff5500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 15px rgba(255, 85, 0, 0.3);
        }

        .robot-mic-btn:hover {
          background: rgba(255, 85, 0, 0.2);
          box-shadow: 0 0 22px rgba(255, 85, 0, 0.6);
          transform: scale(1.05);
        }

        .robot-mic-btn.active {
          background: rgba(255, 85, 0, 0.25);
          box-shadow: 0 0 25px #ff5500, inset 0 0 10px rgba(255, 85, 0, 0.3);
          border-color: #ffaa00;
          color: #ffaa00;
        }

        .robot-audio-waves {
          display: flex;
          gap: 3px;
          align-items: flex-end;
          height: 20px;
          margin-top: 4px;
        }

        .wave-bar {
          width: 3px;
          background: #ff5500;
          border-radius: 2px;
          animation: wBounce 0.4s ease-in-out infinite alternate;
        }

        @keyframes wBounce {
          from { transform: scaleY(0.4); }
          to { transform: scaleY(1); }
        }

        .robot-mic-error {
          color: #ff4444;
          font-size: 11px;
          margin: 0;
          text-align: center;
        }

        .robot-status-text {
          color: #ff5500;
          font-family: 'Rajdhani', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin: 0;
          opacity: 0.8;
          text-shadow: 0 0 8px rgba(255, 85, 0, 0.3);
        }
      `}</style>
    </div>
  );
}
