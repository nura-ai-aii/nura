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
    
    // Helper to get color based on status
    const getColor = (status) => {
      if (status === 'connected') return '#10b981'; // Green working
      if (status === 'error') return '#ef4444'; // Red error
      return '#3b82f6'; // Blue connecting / offline
    };

    const nodes = [
      { id: 'User', name: 'User Client', val: 30, color: '#c084fc' }, // Purple
      { id: 'Hexper', name: 'Hexper Neural Server', val: 40, color: '#f59e0b' }, // Yellow
      { id: 'Groq', name: 'Groq Fast Core', val: 20, color: getColor(apiHealth?.groq) },
      { id: 'Gemini', name: 'Gemini Vision Core', val: 20, color: getColor(apiHealth?.gemini) },
      { id: 'DB', name: 'Vector Database', val: 15, color: isBackendUp ? '#10b981' : '#3b82f6' },
      { id: 'OpenRouter', name: 'OpenRouter Relay', val: 15, color: getColor(apiHealth?.openrouter) },
      { id: 'Auth', name: 'Firebase Auth', val: 15, color: '#10b981' } // Assume green if logged in
    ];

    const links = [
      { source: 'User', target: 'Hexper', color: isBackendUp ? '#10b981' : '#3b82f6', value: 3 },
      { source: 'Hexper', target: 'Groq', color: getColor(apiHealth?.groq), value: 2 },
      { source: 'Hexper', target: 'Gemini', color: getColor(apiHealth?.gemini), value: 2 },
      { source: 'Hexper', target: 'DB', color: isBackendUp ? '#10b981' : '#3b82f6', value: 1.5 },
      { source: 'Hexper', target: 'OpenRouter', color: getColor(apiHealth?.openrouter), value: 1 },
      { source: 'User', target: 'Auth', color: '#10b981', value: 1 }
    ];

    return { nodes, links };
  }, [apiHealth]);

  return (
    <div className="brain-network-overlay">
      <div className="brain-network-header">
        <div className="brain-title">
          <div className="pulse"></div>
          NEURAL BRAIN DIAGNOSTICS
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
        nodeRelSize={1}
        linkColor={link => link.color}
        linkWidth={link => link.value}
        linkDirectionalParticles={4}
        linkDirectionalParticleSpeed={d => d.value * 0.005}
        linkDirectionalParticleWidth={3}
        backgroundColor="#05050a"
        onEngineStop={() => fgRef.current.zoomToFit(400, 100)}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.name;
          const fontSize = 12/globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          
          // Draw circle
          ctx.beginPath();
          ctx.arc(node.x, node.y, Math.sqrt(node.val) * 1.5, 0, 2 * Math.PI, false);
          ctx.fillStyle = node.color;
          ctx.fill();
          
          // Glow effect
          ctx.shadowBlur = 15;
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
          <span>Connection Stable</span>
        </div>
        <div className="legend-item">
          <div className="legend-color blue"></div>
          <span>Connecting / Routing Traffic</span>
        </div>
        <div className="legend-item">
          <div className="legend-color red"></div>
          <span>Connection Failed</span>
        </div>
      </div>
    </div>
  );
}
