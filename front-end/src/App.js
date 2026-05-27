import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import Nabbar from './component/Nabbar';
import { observeAuthState } from './firebaseAuth';
import Login from './component/Login';
import PlasmaOrb from './component/blob';
import IslamicBlob from './component/islamic-blob';
import HwPlasmaOrb from './component/hw-blob';
import Terminal from './component/Terminal';
import Status from './component/Status';
import LanguageSelector from './component/LanguageSelector';
import ModelSelector from './component/ModelSelector';
import MoodSelector from './component/MoodSelector';
import HUDWidgets from './component/HUDWidgets';
import AlertSystem, { emitAlert } from './component/AlertSystem';
import DraggableComponent from './component/DraggableComponent';
import StatusTerminal from './component/StatusTerminal';
import { BACKEND_URL } from './config';
import BackgroundModeToggle from './component/BackgroundModeToggle';


// Interaction States
const STATE = {
  IDLE: 'IDLE',
  LISTENING: 'LISTENING',
  THINKING: 'THINKING',
  SPEAKING: 'SPEAKING'
};

function StartupSequence({ onComplete }) {
  const [logs, setLogs] = React.useState([]);
  const [progress, setProgress] = React.useState(0);

  const startupLogs = [
    "COGNITIVE CORES ONLINE... OK",
    "ARMING WAKE-WORD SENSORS... ACTIVE",
    "CONNECTING NEURAL TELEMETRY LINK... SYNCED",
    "INJECTING COMPANION EMOTION DRIVERS V2.4... COMPLETE",
    "JARVIS SCI-FI HOLOGRAPHIC HUD... ACTIVE",
    "WELCOME BACK, MASTER NUR MOHAMMAD MANDAL."
  ];

  React.useEffect(() => {
    // Add logs one by one with a sci-fi typing delay
    startupLogs.forEach((log, index) => {
      setTimeout(() => {
        setLogs(prev => [...prev, log]);
      }, index * 320);
    });

    // Progress bar animation
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 40);

    // Complete startup
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => {
      clearInterval(interval);
      clearTimeout(completeTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="startup-overlay">
      <div className="startup-container">
        <div className="startup-header">
          <span className="startup-dot-glow"></span>
          HEXPAR COGNITIVE SYSTEM INITIALIZATION
        </div>
        <div className="startup-terminal-box">
          {logs.map((log, i) => (
            <div key={i} className={`startup-log-line ${i === startupLogs.length - 1 ? 'log-highlight' : ''}`}>
              <span className="terminal-prompt">&gt;</span> {log}
            </div>
          ))}
        </div>
        <div className="startup-loader-wrap">
          <div className="startup-progress-bar" style={{ width: `${progress}%` }}></div>
          <div className="startup-loader-glow" style={{ left: `${progress}%` }}></div>
        </div>
        <div className="startup-footer">
          <span>SECURE UPLINK ACTIVE</span>
          <span>EST. COGNITIVE CALIBRATION: {Math.max(0, 100 - progress)}%</span>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [blobColor, setBlobColor] = useState(localStorage.getItem('nura_blobColor') || '#00ffe1');
  const [blobSize, setBlobSize] = useState(Number(localStorage.getItem('nura_blobSize')) || 300);
  const [blobSensitivity] = useState(Number(localStorage.getItem('nura_blobSensitivity')) || 2.0);

  const [transcript, setTranscript] = useState("");

  // Firebase auth state
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = observeAuthState((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);
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
  const [selectedModel, setSelectedModel] = useState(localStorage.getItem('nura_selectedModel') || 'AUTO');
  const [backgroundWakeWordMode, setBackgroundWakeWordMode] = useState(
    localStorage.getItem('nura_backgroundWakeWordMode') === 'true'
  );
  const [activeMood, setActiveMood] = useState(localStorage.getItem('nura_activeMood') || 'scifi');
  const [isStarting, setIsStarting] = useState(() => {
    return sessionStorage.getItem('nura_booted') !== 'true';
  });

  const lastProcessedTranscriptRef = useRef("");

  const handleStartupComplete = () => {
    setIsStarting(false);
    sessionStorage.setItem('nura_booted', 'true');
    // Auto start mic listening to feel like wake word is primed
    setTimeout(() => {
      const micBtn = document.getElementById('mic-toggle-btn');
      if (micBtn) micBtn.click();
    }, 300);
  };

  // Health check
  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/health`, { signal: AbortSignal.timeout(5000) });
      const data = await res.json();
      setApiHealth(data);
      setApiStatus((data.groq === 'connected' && data.gemini === 'connected' && data.openrouter === 'connected') ? 'CONNECTED' : 'ERROR');
    } catch (e) {
      setApiHealth({ backend: 'error', groq: 'error', gemini: 'error', openrouter: 'error', github: 'error', tts: 'error' });
      setApiStatus('OFFLINE');
      emitAlert('BACKEND_DOWN', 'OOF, NEURAL CORE DISCONNECTED: WE ARE OFFLINE 😭', true);
    }
  }, []);

  useEffect(() => {
    setShowTerminal(true);
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, [checkHealth]);


  // Sync body background class with active mood
  useEffect(() => {
    if (activeMood === 'hw') {
      document.body.classList.add('mood-hw-body');
    } else {
      document.body.classList.remove('mood-hw-body');
    }
    localStorage.setItem('nura_activeMood', activeMood);
  }, [activeMood]);

  // Persist settings
  useEffect(() => {
    localStorage.setItem('nura_blobColor', blobColor);
    localStorage.setItem('nura_blobSize', blobSize);
    localStorage.setItem('nura_blobSensitivity', blobSensitivity);
    localStorage.setItem('nura_speechLang', speechLang);
    localStorage.setItem('nura_selectedModel', selectedModel);
    localStorage.setItem('nura_backgroundWakeWordMode', backgroundWakeWordMode);
  }, [blobColor, blobSize, blobSensitivity, speechLang, selectedModel, backgroundWakeWordMode]);

  const toggleBackgroundMode = () => {
    const nextVal = !backgroundWakeWordMode;
    setBackgroundWakeWordMode(nextVal);
    
    if (nextVal) {
      emitAlert('SYS_WAKEWORD', "MOOD CHANGING ACTIVE: MINIMAL HUD ENGAGED! 🎭", false);
      speakResponse("Mood changing mode engaged. Master, I will be listening in the background.", speechLang);
      setInteractionState(STATE.LISTENING);
    } else {
      emitAlert('SYS_CONSOLE', 'FULL HUD RESTORED. SYMMETRY IS BACK, MASTER! ✨', false);
      speakResponse("Console restored, Master.", speechLang);
    }
  };

  // Automatic Tea Break Logic
  useEffect(() => {
    const teaInterval = setInterval(() => {
      emitAlert('HEALTH', "TEA BREAK TIME MASTER! GET SOME CHAI, NOW! ☕", false);
      speakResponse("Master, you have been working for an hour. I suggest a tea break to keep your brilliant mind sharp.", speechLang);
    }, 3600000); // Every 60 minutes
    return () => clearInterval(teaInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speechLang]);

  // Chat logic
  const callNeuralCore = async (userInput) => {
    if (!userInput || interactionState === STATE.THINKING) return;

    setInteractionState(STATE.THINKING);
    setAiResponse("Analyzing...");
    setShowTerminal(true);

    const newMessages = [...chatHistory, { role: "user", content: userInput }];

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, language: speechLang, model: selectedModel })
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
              emitAlert('MEDIA', "VISUALIZING... THIS IS GOING TO BE SO COOL! 🎨", false);
            }
          }
          if (r?.action === "update_ui") {
            if (r.color) setBlobColor(r.color);
            if (r.size) setBlobSize(r.size);
            emitAlert('UI_SYNC', `INTERFACE ADAPTED: SYNCED TO ${r.mode || 'PERFECT'}! ✨`, false);
          }
          if (r?.action === "set_reminder") {
            const delay = r.minutes * 60000;
            setTimeout(() => {
              emitAlert('REMINDER', `MASTER! ${r.message.toUpperCase()} — DON'T FORGET! 😭`, true);
              speakResponse(`Master, reminder: ${r.message}`, speechLang);
            }, delay);
            emitAlert('SYS', `REMINDER SECURED: I WON'T LET YOU FORGET THIS! 😭`, false);
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

  const callVisionCore = async (imageFile) => {
    if (!imageFile || interactionState === STATE.THINKING) return;

    setInteractionState(STATE.THINKING);
    setAiResponse("Scanning visual input with Cognitive Lens... 🔍");
    setShowTerminal(true);

    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('prompt', "You are Hexpar AI. Analyze this image carefully. If it's a math or science problem, provide a clear, step-by-step classic educational explanation. If it contains handwriting, digitize it perfectly. If it is a diagram or formula, explain it and ask Master Nur Mohammad Mandal how you can assist further with this visual content like a premium Google Lens companion.");

    try {
      emitAlert('SYS_VISION', "IMAGE COMMITTED TO COGNITIVE CORE! 📸", false);
      const response = await fetch(`${BACKEND_URL}/api/analyze-image`, {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setAiResponse(data.text);
      setChatHistory(prev => [
        ...prev, 
        { role: "user", content: "[Uploaded Image for Analysis]" }, 
        { role: "assistant", content: data.text }
      ]);

      const newCount = interactionCount + 1;
      setInteractionCount(newCount);
      localStorage.setItem('nura_interactions', newCount);

      if (data.text) {
        await speakResponse(data.text, speechLang);
      } else {
        setInteractionState(STATE.IDLE);
      }

    } catch (error) {
      console.error("Neural Core Vision Error:", error);
      setAiResponse("UPLINK FAILURE: VISION ANALYZER CORE UNREACHABLE.");
      setInteractionState(STATE.IDLE);
      emitAlert('SYS_ERROR', "COGNITIVE UPLINK FAILED: LENS DISCONNECTED 😭", true);
    }
  };

  const speakResponse = async (text, lang) => {
    if (!text) return;

    setInteractionState(STATE.SPEAKING);
    try {
      const response = await fetch(`${BACKEND_URL}/api/tts`, {
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
    const wakeWords = ["hexpar", "nura", "jarvis", "hey jarvis", "hi nura", "hey hexpar", "hi hexpar", "नूरा", "हैक्सपार"];
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript, interactionState]);

  // Sync isListening with interactionState
  const isListening = interactionState === STATE.LISTENING;
  const isProcessing = interactionState === STATE.THINKING;
  const isSpeaking = interactionState === STATE.SPEAKING;

  return (
    <div className={`App ${backgroundWakeWordMode ? 'background-assistant-mode' : ''}`}>
      {isStarting && <StartupSequence onComplete={handleStartupComplete} />}
      <AlertSystem apiHealth={apiHealth} />
      
      {!backgroundWakeWordMode && (
        <Nabbar
          showStatus={showStatus} setShowStatus={setShowStatus}
          showTerminal={showTerminal} setShowTerminal={setShowTerminal}
          apiHealth={apiHealth}
          showHUD={showHUD} setShowHUD={setShowHUD}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
        />
      )}

      {/* Login Modal */}
      {(!currentUser) && <Login />}

      {!backgroundWakeWordMode && (
        <HUDWidgets
          apiStatus={apiStatus}
          apiHealth={apiHealth}
          visible={showHUD}
          onClose={() => setShowHUD(false)}
        />
      )}

      {!backgroundWakeWordMode && showStatus && (
        <DraggableComponent id="status-hud" initialPos={{ bottom: 200, right: 200 }}>
          <Status
            isListening={isListening}
            apiStatus={apiStatus}
            interactionCount={interactionCount}
            onClose={() => setShowStatus(false)}
          />
        </DraggableComponent>
      )}

      {activeMood === 'islamic' && <IslamicBlob />}
      <DraggableComponent id="plasma-orb" initialPos={{ bottom: 30, right: 30 }}>
        {activeMood === 'hw' ? (
          <HwPlasmaOrb
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
        ) : (
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
        )}
      </DraggableComponent>

      {!backgroundWakeWordMode && (
        <DraggableComponent id="terminal" initialPos={{ bottom: 380, right: 30 }}>
          <Terminal
            transcript={transcript}
            aiResponse={aiResponse}
            isListening={isListening}
            isProcessing={isProcessing}
            showTerminal={showTerminal}
            activeMood={activeMood}
            onSendMessage={(msg) => {
              setTranscript(msg);
              callNeuralCore(msg);
            }}
            onAnalyzeImage={callVisionCore}
          />
        </DraggableComponent>
      )}

      {!backgroundWakeWordMode && (
        <DraggableComponent id="lang-selector" initialPos={{ bottom: 30, right: 400 }}>
          <LanguageSelector speechLang={speechLang} setSpeechLang={setSpeechLang} />
        </DraggableComponent>
      )}

      {!backgroundWakeWordMode && (
        <DraggableComponent id="model-selector" initialPos={{ bottom: 30, right: 460 }}>
          <ModelSelector selectedModel={selectedModel} setSelectedModel={setSelectedModel} />
        </DraggableComponent>
      )}

      {!backgroundWakeWordMode && (
        <DraggableComponent id="mood-selector" initialPos={{ bottom: 30, right: 520 }}>
          <MoodSelector activeMood={activeMood} setActiveMood={setActiveMood} />
        </DraggableComponent>
      )}

      <DraggableComponent id="bg-toggle-selector" initialPos={{ bottom: 30, right: backgroundWakeWordMode ? 100 : 580 }}>
        <BackgroundModeToggle active={backgroundWakeWordMode} onClick={toggleBackgroundMode} />
      </DraggableComponent>

      {!backgroundWakeWordMode && (
        <DraggableComponent id="status-terminal" initialPos={{ bottom: 30, left: 30 }}>
          <StatusTerminal interactionState={interactionState} />
        </DraggableComponent>
      )}

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