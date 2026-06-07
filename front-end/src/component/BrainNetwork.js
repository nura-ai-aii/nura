import React, { useEffect, useRef, useState, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import './BrainNetwork.css';

export default function BrainNetwork({ onClose, apiHealth }) {
  const fgRef = useRef();
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const graphData = useMemo(() => {
    const isBackendUp = apiHealth?.backend === 'connected';
    
    const getColor = (status) => {
      if (status === 'connected') return '#10b981'; // Green
      if (status === 'error') return '#ef4444'; // Red
      return '#3b82f6'; // Blue connecting/offline
    };

    const backendColor = isBackendUp ? '#10b981' : '#3b82f6';
    const groqColor = getColor(apiHealth?.groq);
    const geminiColor = getColor(apiHealth?.gemini);
    const orColor = getColor(apiHealth?.openrouter);
    const ttsColor = getColor(apiHealth?.tts);

    // Build the massive list of nodes
    const nodes = [
      // Central Hubs
      { id: 'User', name: 'Master User Client', val: 50, color: '#c084fc', group: 1 },
      { id: 'Hexper', name: 'Hexper Backend Server', val: 50, color: '#f59e0b', group: 2 },
      { id: 'Auth', name: 'Firebase Auth', val: 20, color: '#10b981', group: 1 },
      
      // External APIs
      { id: 'Groq', name: 'Groq AI Core', val: 35, color: groqColor, group: 3 },
      { id: 'Gemini', name: 'Gemini Vision Core', val: 35, color: geminiColor, group: 3 },
      { id: 'OpenRouter', name: 'OpenRouter Backup', val: 25, color: orColor, group: 3 },
      { id: 'TTS', name: 'TTS Engine', val: 25, color: ttsColor, group: 3 },
      { id: 'VectorDB', name: 'Vector Database', val: 30, color: backendColor, group: 2 },
      
      // Frontend Component Files
      { id: 'App.js', name: 'App', val: 15, color: '#10b981', group: 4 },
      { id: 'Nabbar.js', name: 'Nabbar', val: 12, color: '#10b981', group: 4 },
      { id: 'PremiumUI.js', name: 'PremiumUI', val: 15, color: '#10b981', group: 4 },
      { id: 'MobileAppUI.js', name: 'MobileUI', val: 12, color: '#10b981', group: 4 },
      { id: 'HUDWidgets.js', name: 'HUD', val: 10, color: '#10b981', group: 4 },
      { id: 'Login.js', name: 'Login', val: 10, color: '#10b981', group: 4 },
      { id: 'PaymentModal.js', name: 'PayModal', val: 10, color: '#10b981', group: 4 },
      { id: 'Terminal.js', name: 'Terminal', val: 12, color: '#10b981', group: 4 },
      { id: 'ShareChat.js', name: 'ShareChat', val: 8, color: '#10b981', group: 4 },
      { id: 'AlertSystem.js', name: 'AlertSys', val: 8, color: '#10b981', group: 4 },
      { id: 'blob.js', name: 'PlasmaOrb', val: 10, color: '#10b981', group: 4 },
      { id: 'ModelSelector.js', name: 'ModelSel', val: 6, color: '#10b981', group: 4 },
      { id: 'MoodSelector.js', name: 'MoodSel', val: 6, color: '#10b981', group: 4 },
      { id: 'LanguageSelector.js', name: 'LangSel', val: 6, color: '#10b981', group: 4 },
      { id: 'Status.js', name: 'Status', val: 6, color: '#10b981', group: 4 },
      { id: 'BrainNetwork.js', name: 'BrainNet', val: 15, color: '#10b981', group: 4 },
      { id: 'Draggable.js', name: 'Draggable', val: 6, color: '#10b981', group: 4 },

      // Backend Files & API Routes
      { id: 'server.js', name: 'ServerMain', val: 20, color: backendColor, group: 5 },
      { id: 'stt_service.js', name: 'STTService', val: 12, color: backendColor, group: 5 },
      { id: 'api/chat', name: '/api/chat', val: 10, color: backendColor, group: 6 },
      { id: 'api/vision', name: '/api/vision', val: 10, color: backendColor, group: 6 },
      { id: 'api/tts', name: '/api/tts', val: 10, color: backendColor, group: 6 },
      { id: 'api/speech', name: '/api/speech', val: 10, color: backendColor, group: 6 },
      { id: 'api/health', name: '/api/health', val: 8, color: backendColor, group: 6 },
      { id: 'api/payment', name: '/api/payment', val: 8, color: backendColor, group: 6 }
    ];

    const links = [
      // Core Links
      { source: 'User', target: 'Hexper', color: backendColor, value: 5 },
      { source: 'User', target: 'Auth', color: '#10b981', value: 2 },
      { source: 'Hexper', target: 'Groq', color: groqColor, value: 4 },
      { source: 'Hexper', target: 'Gemini', color: geminiColor, value: 4 },
      { source: 'Hexper', target: 'OpenRouter', color: orColor, value: 2 },
      { source: 'Hexper', target: 'TTS', color: ttsColor, value: 3 },
      { source: 'Hexper', target: 'VectorDB', color: backendColor, value: 3 },
      
      // Frontend Structure
      { source: 'User', target: 'App.js', color: '#10b981', value: 2 },
      { source: 'App.js', target: 'Nabbar.js', color: '#10b981', value: 1 },
      { source: 'App.js', target: 'PremiumUI.js', color: '#10b981', value: 2 },
      { source: 'App.js', target: 'MobileAppUI.js', color: '#10b981', value: 1 },
      { source: 'App.js', target: 'Login.js', color: '#10b981', value: 1 },
      { source: 'PremiumUI.js', target: 'PaymentModal.js', color: '#10b981', value: 1 },
      { source: 'PremiumUI.js', target: 'BrainNetwork.js', color: '#10b981', value: 2 },
      { source: 'PremiumUI.js', target: 'blob.js', color: '#10b981', value: 1 },
      { source: 'PremiumUI.js', target: 'HUDWidgets.js', color: '#10b981', value: 1 },
      { source: 'PremiumUI.js', target: 'Terminal.js', color: '#10b981', value: 1 },
      { source: 'PremiumUI.js', target: 'ShareChat.js', color: '#10b981', value: 1 },
      { source: 'PremiumUI.js', target: 'AlertSystem.js', color: '#10b981', value: 1 },
      { source: 'Nabbar.js', target: 'ModelSelector.js', color: '#10b981', value: 0.5 },
      { source: 'Nabbar.js', target: 'MoodSelector.js', color: '#10b981', value: 0.5 },
      { source: 'Nabbar.js', target: 'LanguageSelector.js', color: '#10b981', value: 0.5 },
      { source: 'Nabbar.js', target: 'Status.js', color: '#10b981', value: 0.5 },

      // Backend Structure
      { source: 'Hexper', target: 'server.js', color: backendColor, value: 3 },
      { source: 'server.js', target: 'stt_service.js', color: backendColor, value: 2 },
      { source: 'server.js', target: 'api/chat', color: backendColor, value: 1.5 },
      { source: 'server.js', target: 'api/vision', color: backendColor, value: 1.5 },
      { source: 'server.js', target: 'api/tts', color: backendColor, value: 1.5 },
      { source: 'server.js', target: 'api/speech', color: backendColor, value: 1.5 },
      { source: 'server.js', target: 'api/health', color: backendColor, value: 1 },
      { source: 'server.js', target: 'api/payment', color: backendColor, value: 1 },

      // API Connections to External Cores
      { source: 'api/chat', target: 'Groq', color: groqColor, value: 2 },
      { source: 'api/chat', target: 'OpenRouter', color: orColor, value: 1 },
      { source: 'api/vision', target: 'Gemini', color: geminiColor, value: 2 },
      { source: 'api/tts', target: 'TTS', color: ttsColor, value: 1.5 },
      { source: 'stt_service.js', target: 'Groq', color: groqColor, value: 1 },

      // Frontend Connections to APIs
      { source: 'PremiumUI.js', target: 'api/chat', color: backendColor, value: 1 },
      { source: 'PremiumUI.js', target: 'api/vision', color: backendColor, value: 1 },
      { source: 'App.js', target: 'api/health', color: backendColor, value: 0.5 },
      { source: 'PaymentModal.js', target: 'api/payment', color: backendColor, value: 1 },
      { source: 'blob.js', target: 'api/speech', color: backendColor, value: 1 },
      { source: 'Terminal.js', target: 'api/chat', color: backendColor, value: 1 }
    ];

    return { nodes, links };
  }, [apiHealth]);

  return (
    <div className="brain-network-overlay">
      <div className="brain-network-header">
        <div className="brain-title">
          <div className="pulse"></div>
          NEURAL BRAIN DIAGNOSTICS (FULL SYSTEM MAP)
        </div>
        <button className="brain-close-btn" onClick={onClose}>RETURN TO CHAT</button>
      </div>
      
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        nodeLabel="name"
        nodeColor={node => node.color}
        nodeRelSize={2}
        linkColor={link => link.color}
        linkWidth={link => link.value}
        linkDirectionalParticles={5}
        linkDirectionalParticleSpeed={d => d.value * 0.005}
        linkDirectionalParticleWidth={2.5}
        backgroundColor="#05050a"
        d3VelocityDecay={0.1}
        d3AlphaDecay={0.02}
        onEngineStop={() => fgRef.current.zoomToFit(1000, 50)}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.name;
          const fontSize = 10/globalScale;
          ctx.font = `${fontSize}px Courier New`;
          
          // Draw circle
          ctx.beginPath();
          ctx.arc(node.x, node.y, Math.sqrt(node.val) * 1.5, 0, 2 * Math.PI, false);
          ctx.fillStyle = node.color;
          ctx.fill();
          
          // Glow effect
          ctx.shadowBlur = 10;
          ctx.shadowColor = node.color;
          ctx.fill();
          ctx.shadowBlur = 0; // reset
          
          // Draw text
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(label, node.x, node.y + Math.sqrt(node.val) * 1.5 + fontSize + 2);
        }}
      />

      <div className="brain-legend">
        <div className="legend-item">
          <div className="legend-color green"></div>
          <span>Connection Stable / Online</span>
        </div>
        <div className="legend-item">
          <div className="legend-color blue"></div>
          <span>Connecting / Offline / Routing</span>
        </div>
        <div className="legend-item">
          <div className="legend-color red"></div>
          <span>Connection Failed / Error</span>
        </div>
      </div>
    </div>
  );
}
