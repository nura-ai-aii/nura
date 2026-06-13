import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Nabbar from './component/Nabbar';
import { observeAuthState } from './firebaseAuth';
import { saveChatSession } from './historyService';
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
import ShareChat from './component/ShareChat';
import PremiumUI from './component/PremiumUI';
import MobileAppUI from './component/MobileAppUI';
import LoadingSpinner from './component/LoadingSpinner';
import LandingPage from './component/LandingPage';
import PrivacyPolicy from './component/PrivacyPolicy';
import TermsOfService from './component/TermsOfService';
import OnboardingSurvey from './component/OnboardingSurvey';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
// Interaction States
const STATE = {
  IDLE: 'IDLE',
  LISTENING: 'LISTENING',
  THINKING: 'THINKING',
  SPEAKING: 'SPEAKING'
};

function StartupSequence({ onComplete }) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return <LoadingSpinner fullScreen={true} />;
}

function App() {
  const [blobColor, setBlobColor] = useState(localStorage.getItem('nura_blobColor') || '#00ffe1');
  const [blobSize, setBlobSize] = useState(Number(localStorage.getItem('nura_blobSize')) || 300);
  const [blobSensitivity] = useState(Number(localStorage.getItem('nura_blobSensitivity')) || 2.0);
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileViewport, setIsMobileViewport] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobileViewport(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Firebase auth state
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isCheckingSurvey, setIsCheckingSurvey] = useState(true);
  const [uiMode, setUiMode] = useState(localStorage.getItem('nura_uiMode') || 'default');

  // UI Panel states
  const [showStatus, setShowStatus] = useState(false);
  const [showTerminal, setShowTerminal] = useState(true);
  const [showHUD, setShowHUD] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    const unsubscribe = observeAuthState(async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsCheckingSurvey(true);
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().surveyCompleted) {
            setUserProfile(docSnap.data());
          } else {
            setUserProfile(null);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
        setIsCheckingSurvey(false);
      } else {
        setUserProfile(null);
        setIsCheckingSurvey(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const isShareRoute = location.pathname.startsWith('/share/');
    const authRoutes = ['/log-in', '/sign-in', '/sing-in', '/register', '/forgot-password'];
    const publicRoutes = ['/', '/privacy', '/terms'];
    
    if (!currentUser && !authRoutes.includes(location.pathname) && !publicRoutes.includes(location.pathname) && !isShareRoute) {
      navigate('/log-in');
      return;
    }
    if (currentUser && authRoutes.includes(location.pathname)) {
      navigate('/');
      return;
    }

    // Synchronize pages based on current routing path
    if (currentUser && !isShareRoute) {
      const path = location.pathname;
      if (path === '/' || path === '/chat') {
        setShowTerminal(true);
        setShowStatus(false);
        setShowHUD(false);
        setShowHistory(false);
        setShowAbout(false);
      } else if (path === '/status') {
        setShowStatus(true);
        setShowTerminal(false);
        setShowHUD(false);
        setShowHistory(false);
        setShowAbout(false);
      } else if (path === '/system') {
        setShowHUD(true);
        setShowTerminal(false);
        setShowStatus(false);
        setShowHistory(false);
        setShowAbout(false);
      } else if (path === '/history') {
        setShowHistory(true);
        setShowTerminal(true);
        setShowStatus(false);
        setShowHUD(false);
        setShowAbout(false);
      } else if (path === '/about') {
        setShowAbout(true);
        setShowTerminal(true);
        setShowStatus(false);
        setShowHUD(false);
        setShowHistory(false);
      }
    }
  }, [currentUser, location.pathname, navigate, setShowTerminal, setShowStatus, setShowHUD, setShowHistory, setShowAbout]);

  const [transcript, setTranscript] = useState("");
  const [interactionState, setInteractionState] = useState(STATE.IDLE);
  const [speechLang, setSpeechLang] = useState(localStorage.getItem('nura_speechLang') || 'en-US');

  const [aiResponse, setAiResponse] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [interactionCount, setInteractionCount] = useState(Number(localStorage.getItem('nura_interactions')) || 0);
  const [apiStatus, setApiStatus] = useState('OFFLINE');
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
      // Offline alert removed as per user preference (showing loading spinner instead)
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
     } else {
      const nick = userProfile?.nickname || "Master";
      setUiMode('default');
      setBackgroundWakeWordMode(false);
      emitAlert('SYS_CONSOLE', `FULL HUD RESTORED. SYMMETRY IS BACK, ${nick.toUpperCase()}! ✨`, false);
      speakResponse(`Console restored, ${nick}.`, speechLang);
    }
  };

  // Automatic Tea Break Logic
  useEffect(() => {
    const teaInterval = setInterval(() => {
      const nick = userProfile?.nickname || "Master";
      emitAlert('HEALTH', `TEA BREAK TIME ${nick.toUpperCase()}! GET SOME CHAI, NOW! ☕`, false);
      speakResponse(`${nick}, you have been working for an hour. I suggest a tea break to keep your brilliant mind sharp.`, speechLang);
    }, 3600000); // Every 60 minutes
    return () => clearInterval(teaInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speechLang]);

  const handleNewChat = () => {
    setChatHistory([]);
    setCurrentSessionId(null);
    setAiResponse("");
  };

  // Chat logic
  const callNeuralCore = async (userInput, imageFile) => {
    if (!userInput || interactionState === STATE.THINKING) return;

    setInteractionState(STATE.THINKING);
    setAiResponse("Analyzing...");
    setShowTerminal(true);

    // If an image file is attached and the intent is video generation, trigger the premium LTX-2 image-to-video core directly!
    if (imageFile && (userInput.toLowerCase().includes("video") || userInput.toLowerCase().includes("animate"))) {
      setAiResponse("Triggering premium LTX-2 Image-to-Video rendering... 🎥");
      emitAlert('MEDIA', "COMMITTING STARTING FRAME TO LTX-2 19B CORES... 🎬", false);

      try {
        const formData = new FormData();
        formData.append('type', 'image-to-video');
        formData.append('prompt', userInput.replace(/^generate video from image:\s*/i, ''));
        formData.append('image', imageFile);

        const res = await fetch(`${BACKEND_URL}/api/generate-media`, {
          method: 'POST',
          body: formData
        });
        const mediaData = await res.json();
        
        if (mediaData.url) {
          setAiResponse("LTX-2 19B video generation completed successfully!\n\nHere is your animated video with synchronized matching audio loop generated from your starting frame.");
          setChatHistory(prev => [
            ...prev,
            { role: "user", content: `[Generated LTX-2 video from image with prompt: "${userInput}"]` },
            { role: "assistant", content: "Successfully generated video from your starting frame using LTX-2 19B Distilled!", videoUrl: mediaData.url }
          ]);
          emitAlert('SYS_RESTORED', 'LTX-2 PREMIUM VIDEO GENERATION COMPLETED! 🎬', false);
          const nick = userProfile?.nickname || "Master";
          speakResponse(`Starting frame animated successfully, ${nick}.`, speechLang);
        } else {
          throw new Error("Invalid video URL returned");
        }
      } catch (err) {
        console.error("LTX-2 video generation failed:", err);
        setAiResponse("UPLINK FAILURE: LTX-2 VIDEO GENERATOR UNREACHABLE.");
        setInteractionState(STATE.IDLE);
        emitAlert('SYS_ERROR', 'LTX-2 ANIMATION FAILED. COGNITIVE ENGINE OFFLINE.', true);
      }
      return;
    }

    const newMessages = [...chatHistory, { role: "user", content: userInput }];

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, language: speechLang, model: selectedModel, userProfile: userProfile || {} })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setAiResponse(data.text);
      setChatHistory(prev => [...prev, { role: "user", content: userInput }, { role: "assistant", content: data.text }]);

      // Firestore chat session saving logic
      if (currentUser) {
        let activeSessionId = currentSessionId;
        if (!activeSessionId) {
          activeSessionId = Date.now().toString();
          setCurrentSessionId(activeSessionId);
        }
        const sessionTitle = chatHistory.length === 0 ? userInput.slice(0, 30) + "..." : undefined;
        const sessionMessages = [...newMessages, { role: "assistant", content: data.text }];
        saveChatSession(currentUser.uid, activeSessionId, sessionMessages, sessionTitle);
      }

      const newCount = interactionCount + 1;
      setInteractionCount(newCount);
      localStorage.setItem('nura_interactions', newCount);

      // Handle Tools
      if (data.tool_results) {
        data.tool_results.forEach(res => {
          const r = res.result;
          if (r?.action === "generate_media") {
            if (r.type === "image") {
              const safePrompt = (r.prompt || "futuristic AI core").substring(0, 800);
              const encoded = encodeURIComponent(`${safePrompt}, JARVIS holographic style, neon, 4k`);
              const imgUrl = `https://pollinations.ai/p/${encoded}?width=1024&height=1024&seed=${Date.now()}`;
              setChatHistory(prev => [...prev, { role: "assistant", content: "Image rendering complete. Visual output secured.", imageUrl: imgUrl }]);
              emitAlert('MEDIA', "NEURAL IMAGE SECURED VIA POLLINATIONS! 🎨", false);
            } else if (r.type === "video") {
              (async () => {
                emitAlert('MEDIA', "RENDER REQUEST SUBMITTED TO JSON2VIDEO CORES... 🎥", false);
                try {
                  const res = await fetch(`${BACKEND_URL}/api/generate-media`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'video', prompt: r.prompt })
                  });
                  const mediaData = await res.json();
                  if (mediaData.url) {
                    setChatHistory(prev => [...prev, { role: "assistant", content: "Premium video rendering complete.", videoUrl: mediaData.url }]);
                    emitAlert('SYS_RESTORED', 'PREMIUM SCENE RENDER COMPLETED! 🎬', false);
                  } else {
                    throw new Error("Invalid video URL returned");
                  }
                } catch (err) {
                  console.error("Grok Video render failed, reverting to backup animated canvas:", err);
                  const safeVideoPrompt = (r.prompt || "futuristic AI animation").substring(0, 800);
                  const encoded = encodeURIComponent(safeVideoPrompt);
                  const vidUrl = `https://pollinations.ai/p/${encoded}?width=1024&height=1024&seed=${Date.now()}&model=flux-pro`;
                  setChatHistory(prev => [...prev, { role: "assistant", content: "Fallback animated video rendering complete.", videoUrl: vidUrl }]);
                  emitAlert('SYS_ERROR', 'GROK VIDEO API EXHAUSTED: RETREATING TO FALLBACK CANVAS.', true);
                }
              })();
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
              const nick = userProfile?.nickname || "Master";
              emitAlert('REMINDER', `${nick.toUpperCase()}! ${r.message.toUpperCase()} — DON'T FORGET! 😭`, true);
              speakResponse(`${nick}, reminder: ${r.message}`, speechLang);
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
    formData.append('userProfile', JSON.stringify(userProfile || {}));

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

  const isShareRoute = location.pathname.startsWith('/share/');
  const isMobileUIRoute = location.pathname === '/mobile';
  
  // Public routes for unauthenticated users
  if (!currentUser && (location.pathname === '/' || location.pathname === '/privacy' || location.pathname === '/terms')) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
      </Routes>
    );
  }

  // Check Survey
  if (currentUser && !isCheckingSurvey && !isShareRoute) {
    if (!userProfile?.surveyCompleted) {
      return <OnboardingSurvey currentUser={currentUser} onComplete={(profile) => setUserProfile(profile)} />;
    }
  }

  // Also only intercept if we are on main routes so we don't break login page
  const isMainAppRoute = !location.pathname.startsWith('/log-in') && !location.pathname.startsWith('/sign-in') && !location.pathname.startsWith('/register');

  if (isMobileUIRoute || (isMobileViewport && isMainAppRoute)) {
    return <MobileAppUI 
      currentUser={currentUser}
      transcript={transcript}
      aiResponse={aiResponse}
      chatHistory={chatHistory}
      interactionState={interactionState}
      activePath={location.pathname}
      onNavigate={(path) => navigate(path)}
      onAnalyzeImage={callVisionCore}
      onSendMessage={(msg, file) => {
        setTranscript(msg);
        callNeuralCore(msg, file);
      }}
      currentSessionId={currentSessionId}
      onLoadSession={(sessionId, messages) => {
        setCurrentSessionId(sessionId);
        setChatHistory(messages);
        if (messages && messages.length > 0) {
          setAiResponse(messages[messages.length - 1].content);
        }
      }}
      onNewChat={handleNewChat}
    />;
  }

  if (isShareRoute) {
    return (
      <div className="App share-mode">
        <AlertSystem apiHealth={apiHealth} />
        <Routes>
          <Route path="/share/:chatId" element={<ShareChat />} />
        </Routes>
      </div>
    );
  }

  if (apiStatus === 'OFFLINE') {
    return <LoadingSpinner fullScreen={true} message="Connecting to Server..." />;
  }

  if (uiMode === 'premium') {
    return (
      <div className="App premium-mode">
        <AlertSystem apiHealth={apiHealth} />
        <PremiumUI 
          currentUser={currentUser}
          chatHistory={chatHistory}
          transcript={transcript}
          aiResponse={aiResponse}
          interactionState={interactionState}
          speechLang={speechLang}
          setSpeechLang={setSpeechLang}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          activeMood={activeMood}
          setActiveMood={setActiveMood}
          blobColor={blobColor}
          setBlobColor={setBlobColor}
          blobSize={blobSize}
          setBlobSize={setBlobSize}
          apiHealth={apiHealth}
          apiStatus={apiStatus}
          generatedImage={generatedImage}
          setGeneratedImage={setGeneratedImage}
          onSendMessage={(msg, file) => {
            setTranscript(msg);
            callNeuralCore(msg, file);
          }}
          onAnalyzeImage={callVisionCore}
          handleNewChat={handleNewChat}
          currentSessionId={currentSessionId}
          setCurrentSessionId={setCurrentSessionId}
          onLoadSession={(sessionId, messages) => {
            setCurrentSessionId(sessionId);
            setChatHistory(messages);
            if (messages && messages.length > 0) {
              setAiResponse(messages[messages.length - 1].content);
            }
          }}
          uiMode={uiMode}
          setUiMode={(mode) => {
            setUiMode(mode);
            localStorage.setItem('nura_uiMode', mode);
          }}
          setShowAbout={setShowAbout}
        />
        {/* Render Nabbar's overlays */}
        <Nabbar
          showStatus={showStatus} setShowStatus={setShowStatus}
          showTerminal={showTerminal} setShowTerminal={setShowTerminal}
          apiHealth={apiHealth}
          showHUD={showHUD} setShowHUD={setShowHUD}
          showHistory={showHistory} setShowHistory={setShowHistory}
          showAbout={showAbout} setShowAbout={setShowAbout}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          onNewChat={handleNewChat}
          uiMode={uiMode}
          setUiMode={(mode) => {
            setUiMode(mode);
            localStorage.setItem('nura_uiMode', mode);
          }}
        />
        {/* Login Modal / Routing overlays */}
        <Routes>
          <Route path="/log-in" element={<Login mode="login" />} />
          <Route path="/sign-in" element={<Login mode="signup" />} />
          <Route path="/sing-in" element={<Login mode="signup" />} />
          <Route path="/register" element={<Login mode="signup" />} />
          <Route path="/forgot-password" element={<Login mode="reset" />} />
        </Routes>

        {/* Hidden PlasmaOrb to provide speech recognition logic for PremiumUI */}
        <div style={{ display: 'none' }}>
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
        </div>
      </div>
    );
  }

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
          showHistory={showHistory} setShowHistory={setShowHistory}
          showAbout={showAbout} setShowAbout={setShowAbout}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          onNewChat={handleNewChat}
          onLoadSession={(sessionId, messages) => {
            setCurrentSessionId(sessionId);
            setChatHistory(messages);
            if (messages && messages.length > 0) {
              setAiResponse(messages[messages.length - 1].content);
            }
            setShowTerminal(true);
            setShowStatus(false);
          }}
          uiMode={uiMode}
          setUiMode={(mode) => {
            setUiMode(mode);
            localStorage.setItem('nura_uiMode', mode);
          }}
        />
      )}

      {/* Login Modal / Routing */}
      <Routes>
        <Route path="/log-in" element={<Login mode="login" />} />
        <Route path="/sign-in" element={<Login mode="signup" />} />
        <Route path="/sing-in" element={<Login mode="signup" />} />
        <Route path="/register" element={<Login mode="signup" />} />
        <Route path="/forgot-password" element={<Login mode="reset" />} />
      </Routes>

      {!backgroundWakeWordMode && (
        <HUDWidgets
          apiStatus={apiStatus}
          apiHealth={apiHealth}
          visible={showHUD}
          onClose={() => navigate('/chat')}
        />
      )}

      {!backgroundWakeWordMode && showStatus && (
        <DraggableComponent id="status-hud" initialPos={{ bottom: 200, right: 200 }}>
          <Status
            isListening={isListening}
            apiStatus={apiStatus}
            interactionCount={interactionCount}
            onClose={() => navigate('/chat')}
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
        <Terminal
          transcript={transcript}
          aiResponse={aiResponse}
          isListening={isListening}
          isProcessing={isProcessing}
          showTerminal={showTerminal}
          activeMood={activeMood}
          onSendMessage={(msg, file) => {
            setTranscript(msg);
            callNeuralCore(msg, file);
          }}
          onAnalyzeImage={callVisionCore}
          chatHistory={chatHistory}
          currentUser={currentUser}
        />
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
    </div>
  );
}

export default App;