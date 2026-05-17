import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import Nabbar from './component/Nabbar';
import PlasmaOrb from './component/blob';
import Terminal from './component/Terminal';
import Status from './component/Status';
import LanguageSelector from './component/LanguageSelector';
import HUDWidgets from './component/HUDWidgets';
import AlertSystem, { emitAlert } from './component/AlertSystem';
import DraggableComponent from './component/DraggableComponent';
import StatusTerminal from './component/StatusTerminal';

// Interaction States
const STATE = {
  IDLE: 'IDLE',
  LISTENING: 'LISTENING',
  THINKING: 'THINKING',
  SPEAKING: 'SPEAKING'
};

function App() {
  const [blobColor, setBlobColor] = useState(localStorage.getItem('nura_blobColor') || '#00ffe1');
  const [blobSize, setBlobSize] = useState(Number(localStorage.getItem('nura_blobSize')) || 300);
  const [blobSensitivity, setBlobSensitivity] = useState(Number(localStorage.getItem('nura_blobSensitivity')) || 2.0);

  const [transcript, setTranscript] = useState("");
  const [interactionState, setInteractionState] = useState(STATE.IDLE);
  const [speechLang, setSpeechLang] = useState(localStorage.getItem('nura_speechLang') || 'en-US');

  const [aiResponse, setAiResponse] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [interactionCount, setInteractionCount] = useState(Number(localStorage.getItem('nura_interactions')) || 0);
  const [apiStatus, setApiStatus] = useState('OFFLINE');
  const [showStatus, setShowStatus] = useState(false);
  const [showTerminal, setShowTerminal] = useState(true);
  const [showHUD, setShowHUD] = useState(true);
  const [apiHealth, setApiHealth] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);

  const audioQueueRef = useRef([]);
  const isSpeakingQueueRef = useRef(false);
  const lastProcessedTranscriptRef = useRef("");

  // Health check
  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch('http://127.0.0.1:5001/api/health', { signal: AbortSignal.timeout(5000) });
      const data = await res.json();
      setApiHealth(data);
      setApiStatus(data.groq === 'connected' ? 'CONNECTED' : 'ERROR');
    } catch (e) {
      setApiHealth({ backend: 'error', groq: 'error', github: 'error', tts: 'error' });
      setApiStatus('OFFLINE');
      emitAlert('BACKEND_DOWN', 'BACKEND_DISCONNECTED: NEURAL_CORE_OFFLINE', true);
    }
  }, []);

  useEffect(() => {
    setShowTerminal(true);
  }, []);


  // Persist settings
  useEffect(() => {
    localStorage.setItem('nura_blobColor', blobColor);
    localStorage.setItem('nura_blobSize', blobSize);
    localStorage.setItem('nura_blobSensitivity', blobSensitivity);
    localStorage.setItem('nura_speechLang', speechLang);
  }, [blobColor, blobSize, blobSensitivity, speechLang]);

  // Automatic Tea Break Logic
  useEffect(() => {
    const teaInterval = setInterval(() => {
      emitAlert('HEALTH', "MASTER, IT'S TIME FOR A TEA BREAK.", false);
      speakResponse("Master, you have been working for an hour. I suggest a tea break to keep your brilliant mind sharp.", speechLang);
    }, 3600000); // Every 60 minutes
    return () => clearInterval(teaInterval);
  }, [speechLang]);

  // Chat logic
  const callNeuralCore = async (userInput) => {
    if (!userInput || interactionState === STATE.THINKING) return;

    setInteractionState(STATE.THINKING);
    setAiResponse("Analyzing...");
    setShowTerminal(true);

    const newMessages = [...chatHistory, { role: "user", content: userInput }];

    try {
      const response = await fetch("http://127.0.0.1:5001/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, language: speechLang })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setAiResponse(data.text);
      setChatHistory(prev => [...prev, { role: "user", content: userInput }, { role: "assistant", content: data.text }]);

      const newCount = interactionCount + 1;
      setInteractionCount(newCount);
      localStorage.setItem('nura_interactions', newCount);

      // Handle Tools
      if (data.tool_results) {
        data.tool_results.forEach(res => {
          const r = res.result;
          if (r?.action === "generate_media") {
            if (r.type === "image") {
              const encoded = encodeURIComponent(`${r.prompt}, JARVIS holographic style, neon, 4k`);
              setGeneratedImage({
                type: 'image',
                url: `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&seed=${Date.now()}`
              });
            } else if (r.type === "video") {
              const encoded = encodeURIComponent(r.prompt);
              // Using a placeholder video service or a specific one if available
              // For now, using a stylized prompt that might work with video-enabled models or a visual placeholder
              setGeneratedImage({
                type: 'video',
                url: `https://image.pollinations.ai/prompt/${encoded},animated,motion?width=1024&height=1024&nologo=true&seed=${Date.now()}&model=flux-pro`
              });
              emitAlert('MEDIA', 'NEURAL_VIDEO_SYNTHESIS_INITIATED', false);
            }
          }
          if (r?.action === "update_ui") {
            if (r.color) setBlobColor(r.color);
            if (r.size) setBlobSize(r.size);
            emitAlert('UI_SYNC', `ENVIRONMENT UPDATED: ${r.mode || 'SYNCED'}`, false);
          }
          if (r?.action === "set_reminder") {
            const delay = r.minutes * 60000;
            setTimeout(() => {
              emitAlert('REMINDER', r.message.toUpperCase(), true);
              speakResponse(`Master, reminder: ${r.message}`, speechLang);
            }, delay);
            emitAlert('SYS', `REMINDER SET: ${r.minutes} MIN`, false);
          }
        });
      }

      // Speak response
      if (data.text) {
        await speakResponse(data.text, speechLang);
      } else {
        setInteractionState(STATE.IDLE);
      }

    } catch (error) {
      console.error("Neural Core Error:", error);
      setAiResponse("UPLINK FAILURE: NEURAL CORE UNREACHABLE.");
      setInteractionState(STATE.IDLE);
    }
  };

  const speakResponse = async (text, lang) => {
    if (!text) return;

    setInteractionState(STATE.SPEAKING);
    try {
      const response = await fetch("http://127.0.0.1:5001/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang })
      });
      const data = await response.json();

      if (data.audio) {
        const audio = new Audio("data:audio/mp3;base64," + data.audio);
        audio.onended = () => {
          setInteractionState(STATE.IDLE);
          // Auto-resume listening after 500ms
          setTimeout(() => {
            const micBtn = document.getElementById('mic-toggle-btn');
            if (micBtn && interactionState === STATE.IDLE) micBtn.click();
          }, 500);
        };
        audio.onerror = () => setInteractionState(STATE.IDLE);
        audio.play();
      } else {
        setInteractionState(STATE.IDLE);
      }
    } catch (error) {
      console.error("TTS Error:", error);
      setInteractionState(STATE.IDLE);
    }
  };

  // Interaction Loop
  useEffect(() => {
    if (!transcript || interactionState !== STATE.LISTENING || transcript === lastProcessedTranscriptRef.current) return;

    const lowerT = transcript.toLowerCase();
    const wakeWords = ["nura", "jarvis", "hey jarvis", "hi nura", "नूरा"];
    const hasWakeWord = wakeWords.some(w => lowerT.includes(w));

    if (hasWakeWord) {
      lastProcessedTranscriptRef.current = transcript;
      callNeuralCore(transcript);
      return;
    }

    const timer = setTimeout(() => {
      if (interactionState === STATE.LISTENING) {
        lastProcessedTranscriptRef.current = transcript;
        callNeuralCore(transcript);
      }
    }, 400); // Wait 400ms for natural pause if no wake word

    return () => clearTimeout(timer);
  }, [transcript, interactionState]);

  // Sync isListening with interactionState
  const isListening = interactionState === STATE.LISTENING;
  const isProcessing = interactionState === STATE.THINKING;
  const isSpeaking = interactionState === STATE.SPEAKING;

  return (
    <div className="App">
      <AlertSystem apiHealth={apiHealth} />
      <Nabbar
        showStatus={showStatus} setShowStatus={setShowStatus}
        showTerminal={showTerminal} setShowTerminal={setShowTerminal}
        apiHealth={apiHealth}
        showHUD={showHUD} setShowHUD={setShowHUD}
      />

      <HUDWidgets
        apiStatus={apiStatus}
        apiHealth={apiHealth}
        visible={showHUD}
        onClose={() => setShowHUD(false)}
      />

      {showStatus && (
        <DraggableComponent id="status-hud" initialPos={{ bottom: 200, right: 200 }}>
          <Status
            isListening={isListening}
            apiStatus={apiStatus}
            onClose={() => setShowStatus(false)}
          />
        </DraggableComponent>
      )}

      <DraggableComponent id="plasma-orb" initialPos={{ bottom: 30, right: 30 }}>
        <PlasmaOrb
          color={blobColor}
          size={blobSize}
          sensitivity={blobSensitivity}
          setTranscript={setTranscript}
          setIsListening={(val) => setInteractionState(val ? STATE.LISTENING : STATE.IDLE)}
          speechLang={speechLang}
          isSpeaking={isSpeaking}
          interactionState={interactionState}
          interactionCount={interactionCount}
        />
      </DraggableComponent>

      <DraggableComponent id="terminal" initialPos={{ bottom: 380, right: 30 }}>
        <Terminal
          transcript={transcript}
          aiResponse={aiResponse}
          isListening={isListening}
          isProcessing={isProcessing}
          showTerminal={showTerminal}
          onSendMessage={(msg) => {
            setTranscript(msg);
            callNeuralCore(msg);
          }}
        />
      </DraggableComponent>

      <DraggableComponent id="lang-selector" initialPos={{ bottom: 30, right: 400 }}>
        <LanguageSelector speechLang={speechLang} setSpeechLang={setSpeechLang} />
      </DraggableComponent>

      <DraggableComponent id="status-terminal" initialPos={{ bottom: 30, left: 30 }}>
        <StatusTerminal interactionState={interactionState} />
      </DraggableComponent>

      {generatedImage && (
        <div className="image-modal" onClick={() => setGeneratedImage(null)}>
          <div className="image-header">
            <span className="image-status">{generatedImage.type === 'video' ? 'NEURAL_VIDEO_STREAM_ACTIVE' : 'NEURAL_VISUALIZATION_COMPLETE'}</span>
            <button className="image-close-btn" onClick={() => setGeneratedImage(null)}>✕</button>
          </div>
          <div className="image-container" onClick={(e) => e.stopPropagation()}>
            {generatedImage.type === 'video' ? (
              <img src={generatedImage.url} alt="Neural Video" className="media-video" />
            ) : (
              <img src={generatedImage.url} alt="Neural Output" />
            )}
          </div>
          <p className="image-footer">CLICK ANYWHERE TO DISMISS</p>
        </div>
      )}
    </div>
  );
}

export default App;