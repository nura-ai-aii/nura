import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './HUDWidgets.css';
import DraggableComponent from './DraggableComponent';
import { BACKEND_URL } from '../config';


// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ─── ANALOG CLOCK ──────────────────────────────────────────────
function JarvisClock() {
  const [time, setTime] = useState(new Date());
  const canvasRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 200; const H = 200;
    const cx = W / 2; const cy = H / 2;
    const R = W / 2 - 10;
    canvas.width = W; canvas.height = H;

    ctx.clearRect(0, 0, W, H);

    // Outer rings
    [R, R - 7, R - 17].forEach((r, i) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = i === 1 ? 'rgba(0,255,225,0.5)' : `rgba(0,255,225,${0.1 + i * 0.05})`;
      ctx.lineWidth = i === 1 ? 1.5 : 1;
      ctx.stroke();
    });

    // Decorative arc segments
    for (let i = 0; i < 12; i++) {
      const start = (i / 12) * Math.PI * 2;
      const end = ((i + 0.65) / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, R - 28, start, end);
      ctx.strokeStyle = `rgba(0,132,255,${i % 3 === 0 ? 0.55 : 0.15})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Tick marks
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
      const isMajor = i % 5 === 0;
      const innerR = isMajor ? R - 25 : R - 20;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
      ctx.lineTo(cx + Math.cos(angle) * (R - 17), cy + Math.sin(angle) * (R - 17));
      ctx.strokeStyle = isMajor ? 'rgba(0,255,225,0.9)' : 'rgba(0,255,225,0.3)';
      ctx.lineWidth = isMajor ? 2 : 1;
      ctx.stroke();
    }

    const drawHand = (angle, length, width, color) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle - Math.PI / 2);
      ctx.shadowColor = color; ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(0, length * 0.2);
      ctx.lineTo(0, -length);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();
    };

    const h = time.getHours() % 12;
    const m = time.getMinutes();
    const s = time.getSeconds();
    drawHand(((h + m / 60) / 12) * Math.PI * 2, R * 0.5, 4, '#00ffe1');
    drawHand(((m + s / 60) / 60) * Math.PI * 2, R * 0.65, 2.5, '#0084ff');
    drawHand((s / 60) * Math.PI * 2, R * 0.72, 1.5, '#ff4a4a');

    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#00ffe1';
    ctx.shadowColor = '#00ffe1'; ctx.shadowBlur = 18;
    ctx.fill();
  }, [time]);

  const pad = n => String(n).padStart(2, '0');
  const hours = time.getHours();

  return (
    <div className="hud-widget clock-widget">
      <div className="hud-widget-label">◆ SYSTEM CLOCK</div>
      <canvas ref={canvasRef} className="clock-canvas" />
      <div className="digital-time">
        {pad(hours % 12 || 12)}:{pad(time.getMinutes())}:{pad(time.getSeconds())}
        <span className="ampm-badge">{hours >= 12 ? 'PM' : 'AM'}</span>
      </div>
    </div>
  );
}

// ─── DATE DISPLAY ──────────────────────────────────────────────
function JarvisDate() {
  const now = new Date();
  const days   = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return (
    <div className="hud-widget date-widget">
      <div className="hud-widget-label">◆ STARDATE</div>
      <div className="date-day">{days[now.getDay()]}</div>
      <div className="date-main">
        <span className="date-num">{String(now.getDate()).padStart(2,'0')}</span>
        <span className="date-sep">.</span>
        <span className="date-month">{months[now.getMonth()]}</span>
        <span className="date-sep">.</span>
        <span className="date-year">{now.getFullYear()}</span>
      </div>
      <div className="date-subtitle">LOCAL · IST UTC+5:30</div>
    </div>
  );
}

// ─── RADAR SWEEP ───────────────────────────────────────────────
function JarvisRadar() {
  const canvasRef = useRef(null);
  const angleRef  = useRef(0);
  const dotsRef   = useRef([]);
  const frameRef  = useRef(null);

  useEffect(() => {
    dotsRef.current = Array.from({ length: 10 }, () => ({
      angle: Math.random() * Math.PI * 2,
      r: 0.25 + Math.random() * 0.65,
      life: 0,
    }));

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const SIZE = 220;
    canvas.width = SIZE; canvas.height = SIZE;
    const cx = SIZE / 2; const cy = SIZE / 2; const R = SIZE / 2 - 8;

    const draw = () => {
      ctx.clearRect(0, 0, SIZE, SIZE);

      ctx.fillStyle = 'rgba(0,15,30,0.7)';
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

      [0.25, 0.5, 0.75, 1].forEach(f => {
        ctx.beginPath(); ctx.arc(cx, cy, R * f, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0,255,225,${f === 1 ? 0.5 : 0.12})`;
        ctx.lineWidth = 1; ctx.stroke();
      });

      // Crosshairs
      ctx.strokeStyle = 'rgba(0,255,225,0.18)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();

      // Diagonal lines
      [45, 135].forEach(deg => {
        const rad = deg * Math.PI / 180;
        ctx.beginPath();
        ctx.moveTo(cx - Math.cos(rad) * R, cy - Math.sin(rad) * R);
        ctx.lineTo(cx + Math.cos(rad) * R, cy + Math.sin(rad) * R);
        ctx.strokeStyle = 'rgba(0,255,225,0.07)'; ctx.stroke();
      });

      // Sweep sector
      const sweepAngle = Math.PI * 1.1;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      grad.addColorStop(0, 'rgba(0,255,225,0.25)');
      grad.addColorStop(1, 'rgba(0,255,225,0)');
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(angleRef.current);
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.arc(0, 0, R, -sweepAngle, 0); ctx.closePath();
      ctx.fillStyle = grad; ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(R, 0);
      ctx.strokeStyle = 'rgba(0,255,225,0.85)'; ctx.lineWidth = 1.5;
      ctx.shadowColor = '#00ffe1'; ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.restore();

      // Contacts
      dotsRef.current.forEach(dot => {
        const a = dot.angle - angleRef.current;
        const norm = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        if (norm < 0.12) dot.life = 1;
        if (dot.life > 0) dot.life -= 0.006;
        const dx = cx + Math.cos(dot.angle) * R * dot.r;
        const dy = cy + Math.sin(dot.angle) * R * dot.r;
        ctx.beginPath(); ctx.arc(dx, dy, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,255,100,${dot.life})`;
        ctx.shadowColor = '#00ff64'; ctx.shadowBlur = 12;
        ctx.fill();
      });

      angleRef.current += 0.022;
      frameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, []);

  return (
    <div className="hud-widget radar-widget">
      <div className="hud-widget-label">◆ THREAT RADAR</div>
      <canvas ref={canvasRef} className="radar-canvas" />
      <div className="radar-status">
        <span className="radar-dot-green" /> ALL CLEAR — NO THREATS
      </div>
    </div>
  );
}

// ─── MINI MAP ──────────────────────────────────────────────────
function JarvisMap() {
  const mapRef         = useRef(null);
  const mapInstanceRef = useRef(null);
  const [location, setLocation] = useState(null);
  const [locError, setLocError] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      ()  => { setLocError('GPS unavailable'); setLocation({ lat: 22.5726, lng: 88.3639 }); },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => {
    if (!location || !mapRef.current || mapInstanceRef.current) return;
    const map = L.map(mapRef.current, {
      center: [location.lat, location.lng], zoom: 14,
      zoomControl: false, attributionControl: false,
      dragging: false, scrollWheelZoom: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    const glowIcon = L.divIcon({
      html: `<div class="map-marker-glow"><div class="map-marker-inner"></div></div>`,
      className: '', iconSize: [20, 20], iconAnchor: [10, 10],
    });
    L.marker([location.lat, location.lng], { icon: glowIcon }).addTo(map);
    mapInstanceRef.current = map;
  }, [location]);

  return (
    <div className="hud-widget map-widget">
      <div className="hud-widget-label">◆ GEO LOCATION</div>
      {locError && <div className="map-error">⚠ {locError} · Using fallback</div>}
      <div ref={mapRef} className="map-container" />
      <div className="map-coords">
        {location ? `${location.lat.toFixed(5)}° N   ${location.lng.toFixed(5)}° E` : 'ACQUIRING GPS SIGNAL...'}
      </div>
    </div>
  );
}

// ─── SYSTEM METRICS ────────────────────────────────────────────
function SystemStats({ apiStatus }) {
  const [stats, setStats] = useState({ cpu: 38, mem: 64, net: 82, ai: 95 });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        cpu: Math.min(99, Math.max(10, prev.cpu + (Math.random() - 0.5) * 9)),
        mem: Math.min(99, Math.max(30, prev.mem + (Math.random() - 0.5) * 5)),
        net: Math.min(99, Math.max(15, prev.net + (Math.random() - 0.5) * 14)),
        ai:  apiStatus === 'CONNECTED'
          ? Math.min(99, Math.max(75, prev.ai + (Math.random() - 0.5) * 6))
          : 0,
      }));
    }, 1600);
    return () => clearInterval(interval);
  }, [apiStatus]);

  const StatRing = ({ label, value, color }) => {
    const r = 34;
    const circ = 2 * Math.PI * r;
    const dash = (value / 100) * circ;
    return (
      <div className="stat-ring-wrap">
        <svg width="86" height="86" viewBox="0 0 86 86">
          <circle cx="43" cy="43" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          <circle cx="43" cy="43" r={r} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            strokeDashoffset={circ / 4}
            style={{ filter: `drop-shadow(0 0 5px ${color})`, transition: 'stroke-dasharray 0.9s ease' }} />
          <text x="43" y="48" textAnchor="middle" fill={color} fontSize="14"
            fontFamily="Orbitron, monospace" fontWeight="700">
            {Math.round(value)}%
          </text>
        </svg>
        <div className="stat-ring-label" style={{ color }}>{label}</div>
      </div>
    );
  };

  return (
    <div className="hud-widget stats-widget">
      <div className="hud-widget-label">◆ SYSTEM METRICS</div>
      <div className="stats-rings">
        <StatRing label="CPU"    value={stats.cpu} color="#00ffe1" />
        <StatRing label="MEMORY" value={stats.mem} color="#0084ff" />
        <StatRing label="NETWORK" value={stats.net} color="#a855f7" />
        <StatRing label="AI CORE" value={stats.ai}
          color={apiStatus === 'CONNECTED' ? '#00ff80' : '#ff4444'} />
      </div>
    </div>
  );
}

// ─── NEW: QUICK CONTROLS & DEVICE INFO ────────────────────────
function DeviceWidgets({ apiStatus }) {
  const [battery, setBattery] = useState({ level: 100, charging: false });
  const [volume, setVolume] = useState(50);
  const [wifi, setWifi] = useState({ online: navigator.onLine, type: 'wifi' });

  useEffect(() => {
    if (navigator.getBattery) {
      navigator.getBattery().then(bat => {
        setBattery({ level: Math.round(bat.level * 100), charging: bat.charging });
        bat.addEventListener('levelchange', () => setBattery(b => ({ ...b, level: Math.round(bat.level * 100) })));
        bat.addEventListener('chargingchange', () => setBattery(b => ({ ...b, charging: bat.charging })));
      });
    }
    
    const updateOnline = () => setWifi(w => ({ ...w, online: navigator.onLine }));
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
    };
  }, []);

  const handleVolumeChange = async (newVol) => {
    setVolume(newVol);
    // Optional: Call backend to sync volume if needed, 
    // but usually UI buttons call /api/command directly
  };

  const triggerCommand = async (cmd) => {
    try {
      await fetch(`${BACKEND_URL}/api/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd })
      });
    } catch (e) { console.error(e); }
  };

  return (
    <div className="hud-widget device-widget">
      <div className="hud-widget-label">◆ DEVICE & NETWORK</div>
      
      <div className="device-row">
        <div className="device-item">
          <div className="device-icon">🔋</div>
          <div className="device-info">
            <div className="device-val">{battery.level}%</div>
            <div className="device-lab">{battery.charging ? 'CHARGING' : 'BATTERY'}</div>
          </div>
          <div className="battery-bar-wrap">
            <div className="battery-bar-fill" style={{ width: `${battery.level}%`, background: battery.level < 20 ? '#ff4444' : '#00ffe1' }} />
          </div>
        </div>

        <div className="device-item">
          <div className="device-icon">🌐</div>
          <div className="device-info">
            <div className="device-val" style={{ color: wifi.online ? '#00ff80' : '#ff4444' }}>{wifi.online ? 'CONNECTED' : 'OFFLINE'}</div>
            <div className="device-lab">NETWORK STATUS</div>
          </div>
        </div>
      </div>

      <div className="volume-control-wrap">
        <div className="vol-header">
          <span>VOLUME CONTROL</span>
          <span>{volume}%</span>
        </div>
        <div className="vol-btns">
          <button className="vol-btn" onClick={() => { handleVolumeChange(Math.max(0, volume - 10)); triggerCommand('volume_down'); }}>-</button>
          <div className="vol-track">
            <div className="vol-fill" style={{ width: `${volume}%` }} />
          </div>
          <button className="vol-btn" onClick={() => { handleVolumeChange(Math.min(100, volume + 10)); triggerCommand('volume_up'); }}>+</button>
        </div>
      </div>
    </div>
  );
}

// ─── NEW: SERVICE HEALTH ──────────────────────────────────────
function ServiceHealth({ apiStatus, apiHealth }) {
  const services = [
    { name: 'HEXPAR BACKEND', status: apiHealth?.backend === 'ok' ? 'ONLINE' : 'OFFLINE', color: apiHealth?.backend === 'ok' ? '#00ff80' : '#ff4444' },
    { name: 'GEMINI 2.5 FLASH', status: apiHealth?.gemini === 'connected' ? 'CONNECTED' : 'ERROR', color: apiHealth?.gemini === 'connected' ? '#00ffe1' : '#ffbb00' },
    { name: 'GROQ AI CORE', status: apiHealth?.groq === 'connected' ? 'CONNECTED' : 'ERROR', color: apiHealth?.groq === 'connected' ? '#00ffe1' : '#ffbb00' },
    { name: 'GPT-5.4 PRO (OPENROUTER)', status: apiHealth?.openrouter === 'connected' ? 'CONNECTED' : 'ERROR', color: apiHealth?.openrouter === 'connected' ? '#00ffe1' : '#ffbb00' },
    { name: 'EDGE TTS ENGINE', status: apiHealth?.tts === 'ok' ? 'READY' : 'WAITING', color: apiHealth?.tts === 'ok' ? '#a855f7' : '#555' },
    { name: 'FRONT-END UI', status: 'ACTIVE', color: '#0084ff' }
  ];

  return (
    <div className="hud-widget health-widget">
      <div className="hud-widget-label">◆ SERVICE HEALTH MONITOR</div>
      <div className="health-list">
        {services.map(s => (
          <div key={s.name} className="health-item">
            <div className="health-name">{s.name}</div>
            <div className="health-status-wrap">
              <span className="health-dot" style={{ background: s.color, boxShadow: `0 0 8px ${s.color}` }} />
              <span className="health-status-text" style={{ color: s.color }}>{s.status}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="health-footer">
        UPTIME: {Math.floor(performance.now() / 1000)}s · SYSTEM STABLE
      </div>
    </div>
  );
}
function TacticalAnalysis() {
  const suggestions = [
    { tag: "OPTIMIZATION", msg: "Allocate 14% more memory to AI Core" },
    { tag: "ROUTINE", msg: "Initiate evening focus mode in 12m" },
    { tag: "SECURITY", msg: "Rotate local uplink keys" }
  ];

  return (
    <div className="tactical-widget">
      <div className="tactical-header">
        <span>TACTICAL ANALYSIS</span>
        <span>PREDICTIVE V1.4</span>
      </div>
      {suggestions.map((s, i) => (
        <div key={i} className="tactical-prediction">
          <span className="prediction-tag">{s.tag}</span>
          {s.msg}
        </div>
      ))}
    </div>
  );
}

function NeuralLink() {
  return (
    <div className="tactical-widget" style={{ minWidth: 200 }}>
      <div className="tactical-header">NEURAL LINK MAP</div>
      <div className="neural-link">
        {[...Array(8)].map((_, i) => (
          <div 
            key={i} 
            className="neural-node" 
            style={{ 
              top: `${20 + Math.random() * 60}%`, 
              left: `${20 + Math.random() * 60}%`,
              animationDelay: `${i * 0.3}s`
            }} 
          />
        ))}
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ───────────────────────────────────────────────
export default function HUDWidgets({ apiStatus, apiHealth, visible, onClose }) {
  if (!visible) return null;

  const now = new Date();

  return (
    <div className="hud-panel-overlay">
      {/* Header */}
      <div className="hud-panel-header">
        <div>
          <div className="hud-panel-title">SYSTEMS DASHBOARD</div>
          <div className="hud-panel-subtitle">HEXPAR AI · OPERATIONAL OVERVIEW</div>
        </div>
        <button className="hud-close-btn" onClick={onClose}>✕ CLOSE PANEL</button>
      </div>

      {/* Widget Grid */}
      <div className="hud-grid">
        <DraggableComponent id="widget-stats" initialPos={{ bottom: 150, right: 1550 }} useGridByDefault={true}>
          <SystemStats apiStatus={apiStatus} />
        </DraggableComponent>

        <DraggableComponent id="widget-radar" className="radar-widget-wrap" initialPos={{ bottom: 150, right: 1250 }} useGridByDefault={true}>
          <JarvisRadar />
        </DraggableComponent>

        <DraggableComponent id="widget-device" initialPos={{ bottom: 150, right: 950 }} useGridByDefault={true}>
          <DeviceWidgets apiStatus={apiStatus} />
        </DraggableComponent>

        <DraggableComponent id="widget-map" className="map-widget-wrap" initialPos={{ bottom: 150, right: 650 }} useGridByDefault={true}>
          <JarvisMap />
        </DraggableComponent>

        <DraggableComponent id="widget-health" initialPos={{ bottom: 150, right: 350 }} useGridByDefault={true}>
          <ServiceHealth apiStatus={apiStatus} apiHealth={apiHealth} />
        </DraggableComponent>

        <DraggableComponent id="widget-clock" initialPos={{ bottom: 550, right: 1550 }} useGridByDefault={true}>
          <JarvisClock />
        </DraggableComponent>

        <DraggableComponent id="widget-date" initialPos={{ bottom: 550, right: 1250 }} useGridByDefault={true}>
          <JarvisDate />
        </DraggableComponent>

        <DraggableComponent id="widget-tactical" initialPos={{ bottom: 550, right: 950 }} useGridByDefault={true}>
          <TacticalAnalysis />
        </DraggableComponent>

        <DraggableComponent id="widget-neural" initialPos={{ bottom: 550, right: 650 }} useGridByDefault={true}>
          <NeuralLink />
        </DraggableComponent>
      </div>

      {/* Footer Status Bar */}
      <div className="hud-status-bar">
        <div className="hud-status-item">
          <span className="hud-status-dot" /> HEXPAR AI SYSTEMS ACTIVE
        </div>
        <div className="hud-status-item">
          AI STATUS: {apiStatus}
        </div>
        <div className="hud-status-item">
          {now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}
        </div>
        <div className="hud-status-item">
          SESSION UPTIME: {Math.floor(performance.now() / 1000)}s
        </div>
      </div>
    </div>
  );
}
