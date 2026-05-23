import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { BACKEND_URL } from "../config";


const noiseFunctions = `
  vec3 mod289v3(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289v4(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289v4(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289v3(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  float fbm(vec3 p) {
    float total = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 3; i++) {
      total += snoise(p * frequency) * amplitude;
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    return total;
  }
`;

export default function PlasmaOrb({ color = "#00ffe1", size = 300, sensitivity = 2.0, setTranscript, setIsListening, speechLang = 'en-US', isSpeaking = false, interactionState, interactionCount = 0 }) {
  const mountRef = useRef(null);
  const sceneRef = useRef({});
  const audioRef = useRef({ level: 0, smoothed: 0, analyser: null, dataArray: null, stream: null });
  const [micActive, setMicActive] = useState(false);
  const [micError, setMicError] = useState(null);
  const animFrameRef = useRef(null);

  const micActiveRef = useRef(false);
  useEffect(() => {
    micActiveRef.current = micActive;
  }, [micActive]);

  const isSpeakingRef = useRef(isSpeaking);
  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  const interactionStateRef = useRef(interactionState);
  useEffect(() => {
    interactionStateRef.current = interactionState;
  }, [interactionState]);

  // ── BACKEND WHISPER STT ──────────────────────────────────────
  const mediaRecorderRef = useRef(null);
  const speechChunksRef = useRef([]);
  const silenceTimerRef = useRef(null);
  const sttLangRef = useRef(speechLang);

  useEffect(() => {
    sttLangRef.current = speechLang;
  }, [speechLang]);

  const sendAudioToBackend = async (chunks) => {
    if (!chunks || chunks.length === 0) return;
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
    const blob = new Blob(chunks, { type: mimeType });
    if (blob.size < 500) return; // Much lower threshold for instant short commands

    const formData = new FormData();
    formData.append('audio', blob, 'speech.webm');
    formData.append('language', sttLangRef.current);

    try {
      console.log('[STT] Sending audio chunk to backend...');
      const response = await fetch(`${BACKEND_URL}/api/stt`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.text && data.text.trim()) {
        console.log('[STT] Transcript:', data.text);
        if (setTranscript) setTranscript(prev => {
          // Append or replace based on context
          const combined = prev ? `${prev} ${data.text}`.trim() : data.text.trim();
          return combined;
        });
      }
    } catch (error) {
      console.error('[STT] Backend error:', error.message);
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
      // Restart recorder if mic is still active
      if (micActiveRef.current && stream.active) {
        startMediaRecorder(stream);
      }
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    console.log('[STT] MediaRecorder started');
  };

  const stopRecordingChunk = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop(); // triggers onstop → sends audio → restarts
    }
  };

  // ── VAD (Voice Activity Detection) ──────────────────────────
  const vadRef = useRef({ speaking: false, silenceMs: 0, totalMs: 0, lastSpeechTime: 0 });

  const tickVAD = (audioLevel) => {
    const vad = vadRef.current;
    const now = Date.now();
    
    // Expert-tuned thresholds for "Instant" responsiveness
    const SPEECH_THRESHOLD = 0.035; // More sensitive to low volume
    const SILENCE_TIMEOUT_MS = 400; // Snap response
    const MAX_RECORDING_MS = 5000; // Frequent small updates

    if (audioLevel > SPEECH_THRESHOLD) {
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
      
      // If user stops talking OR we hit max time, stop recording chunk
      if (vad.silenceMs > SILENCE_TIMEOUT_MS || vad.totalMs > MAX_RECORDING_MS) {
        vad.speaking = false;
        vad.silenceMs = 0;
        vad.totalMs = 0;
        stopRecordingChunk();
      }
    } else {
      // Force a stop if we've been "idly listening" for more than 5s without speech
      if (now - vad.lastSpeechTime > 5000 && mediaRecorderRef.current?.state === 'recording') {
        // stopRecordingChunk(); // Optional: could be used to clear background noise
      }
    }
  };



  // Sensitivity State
  const sensitivityRef = useRef(sensitivity);
  useEffect(() => {
    sensitivityRef.current = sensitivity;
  }, [sensitivity]);

  useEffect(() => {
    const init = () => {
      const el = mountRef.current;
      if (!el) return;

      const w = el.clientWidth;
      const h = el.clientHeight;

      const scene = new THREE.Scene();
      
      const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 100);
      camera.position.z = 2.4;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.9;
      el.appendChild(renderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.enablePan = false;
      controls.minDistance = 1.5;
      controls.maxDistance = 20;

      const mainGroup = new THREE.Group();
      scene.add(mainGroup);

      // Shell
      const shellGeo = new THREE.SphereGeometry(1.0, 64, 64);
      const shellVert = `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `;
      const shellFrag = `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        uniform vec3 uColor;
        uniform float uOpacity;
        void main() {
          float fresnel = pow(1.0 - dot(normalize(vNormal), normalize(vViewPosition)), 2.5);
          gl_FragColor = vec4(uColor, fresnel * uOpacity);
        }
      `;

      const shellBackMat = new THREE.ShaderMaterial({
        vertexShader: shellVert, fragmentShader: shellFrag,
        uniforms: { uColor: { value: new THREE.Color(0x000055) }, uOpacity: { value: 0.3 } },
        transparent: true, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false
      });
      const shellFrontMat = new THREE.ShaderMaterial({
        vertexShader: shellVert, fragmentShader: shellFrag,
        uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: 0.41 } },
        transparent: true, blending: THREE.AdditiveBlending, side: THREE.FrontSide, depthWrite: false
      });
      mainGroup.add(new THREE.Mesh(shellGeo, shellBackMat));
      mainGroup.add(new THREE.Mesh(shellGeo, shellFrontMat));

      // Plasma
      const plasmaGeo = new THREE.SphereGeometry(0.998, 128, 128);
      const plasmaMat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uScale: { value: 0.2 },
          uBrightness: { value: 1.31 },
          uThreshold: { value: 0.09 },
          uAudio: { value: 0.0 },
          uColorDeep: { value: new THREE.Color(0x001433) },
          uColorMid: { value: new THREE.Color(0x0084ff) },
          uColorBright: { value: new THREE.Color(color) }
        },
        vertexShader: `
          uniform float uTime;
          uniform float uAudio;
          varying vec3 vPosition;
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          ${noiseFunctions}
          void main() {
            vPosition = position;
            vNormal = normalize(normalMatrix * normal);
            vec3 pos = position;
            float displacement = snoise(pos * 2.0 + uTime * 0.3) * uAudio * 0.18;
            pos += normal * displacement;
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            vViewPosition = -mvPosition.xyz;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform float uScale;
          uniform float uBrightness;
          uniform float uThreshold;
          uniform float uAudio;
          uniform vec3 uColorDeep;
          uniform vec3 uColorMid;
          uniform vec3 uColorBright;
          varying vec3 vPosition;
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          ${noiseFunctions}
          void main() {
            vec3 p = vPosition * uScale;
            float speed = 1.0 + uAudio * 2.0;
            vec3 q = vec3(
              fbm(p + vec3(0.0, uTime * 0.05 * speed, 0.0)),
              fbm(p + vec3(5.2, 1.3, 2.8) + uTime * 0.05 * speed),
              fbm(p + vec3(2.2, 8.4, 0.5) - uTime * 0.02 * speed)
            );
            float density = fbm(p + 2.0 * q);
            float t = (density + 0.4) * 0.8;
            float threshold = uThreshold - uAudio * 0.06;
            float alpha = smoothstep(threshold, 0.7, t);
            vec3 cWhite = vec3(1.0, 1.0, 1.0);
            vec3 midBoost = mix(uColorMid, vec3(0.2, 0.7, 1.0), uAudio * 0.5);
            vec3 color = mix(uColorDeep, midBoost, smoothstep(threshold, 0.5, t));
            color = mix(color, uColorBright, smoothstep(0.5, 0.8, t));
            color = mix(color, cWhite, smoothstep(0.8, 1.0, t));
            color += uAudio * vec3(0.0, 0.3, 0.5) * alpha;
            float facing = dot(normalize(vNormal), normalize(vViewPosition));
            float depthFactor = (facing + 1.0) * 0.5;
            float finalAlpha = alpha * (0.02 + 0.98 * depthFactor);
            gl_FragColor = vec4(color * uBrightness, finalAlpha);
          }
        `,
        transparent: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false
      });

      const plasmaMesh = new THREE.Mesh(plasmaGeo, plasmaMat);
      mainGroup.add(plasmaMesh);

      // Particles
      const pCount = 600;
      const pPos = new Float32Array(pCount * 3);
      const pSizes = new Float32Array(pCount);
      for (let i = 0; i < pCount; i++) {
        const r = 0.95 * Math.cbrt(Math.random());
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        pPos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
        pPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
        pPos[i*3+2] = r * Math.cos(phi);
        pSizes[i] = Math.random();
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
      pGeo.setAttribute('aSize', new THREE.BufferAttribute(pSizes, 1));
      const pMat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uAudio: { value: 0 }, uColor: { value: new THREE.Color(0xffffff) } },
        vertexShader: `
          uniform float uTime;
          uniform float uAudio;
          attribute float aSize;
          varying float vAlpha;
          void main() {
            vec3 pos = position;
            pos.y += sin(uTime * 0.2 + pos.x) * (0.02 + uAudio * 0.04);
            pos.x += cos(uTime * 0.15 + pos.z) * (0.02 + uAudio * 0.04);
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            float baseSize = (8.0 * aSize + 4.0) * (1.0 + uAudio * 0.8);
            gl_PointSize = baseSize * (1.0 / -mvPosition.z);
            vAlpha = 0.8 + 0.2 * sin(uTime + aSize * 10.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          varying float vAlpha;
          void main() {
            vec2 uv = gl_PointCoord - vec2(0.5);
            if (length(uv) > 0.5) discard;
            float glow = pow(1.0 - length(uv) * 2.0, 1.8);
            gl_FragColor = vec4(uColor, glow * vAlpha);
          }
        `,
        transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
      });
      const particles = new THREE.Points(pGeo, pMat);
      mainGroup.add(particles);

      // Evolution Stage 2: Data Ring (if count > 10)
      let dataRing = null;
      if (interactionCount > 10) {
        const ringGeo = new THREE.TorusGeometry(1.2, 0.02, 16, 100);
        const ringMat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.4, wireframe: true });
        dataRing = new THREE.Mesh(ringGeo, ringMat);
        mainGroup.add(dataRing);
      }

      // Evolution Stage 3: Neural Core (if count > 50)
      let neuralCore = null;
      if (interactionCount > 50) {
        const coreGeo = new THREE.IcosahedronGeometry(0.4, 1);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.3 });
        neuralCore = new THREE.Mesh(coreGeo, coreMat);
        mainGroup.add(neuralCore);
      }

      sceneRef.current = { scene, camera, renderer, controls, mainGroup, plasmaMesh, plasmaMat, shellFrontMat, pMat, THREE, dataRing, neuralCore };

      const clock = new THREE.Clock();

      const animate = () => {
        animFrameRef.current = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        const audio = audioRef.current;
        let rawLevel = 0;
        if (audio.analyser && audio.dataArray) {
          audio.analyser.getByteFrequencyData(audio.dataArray);
          const sum = audio.dataArray.reduce((a, b) => a + b, 0);
          rawLevel = sum / (audio.dataArray.length * 255);
        }
        audio.smoothed += (rawLevel - audio.smoothed) * 0.05;
        const audioVal = audio.smoothed * sensitivityRef.current;

        // Tick VAD for backend STT
        tickVAD(rawLevel);

        const state = interactionStateRef.current;
        const isThinking = state === 'THINKING';
        const isSpeakingState = state === 'SPEAKING';

        // Dynamic parameters based on cognitive state
        let speedMultiplier = 1.2;
        let scalePulse = 1.0;
        let brightnessVal = 1.31;
        let scaleVal = 0.2;

        if (isThinking) {
          // Hyper-active thinking speed and turbulent breathing waves
          speedMultiplier = 2.8;
          scalePulse = 1.0 + Math.sin(t * 8.0) * 0.07;
          brightnessVal = 1.8 + Math.sin(t * 6.0) * 0.4;
          scaleVal = 0.38 + Math.cos(t * 3.0) * 0.08;

          // Color morphing between cyan and tech purple
          const cyanColor = new THREE.Color(color);
          const purpleColor = new THREE.Color(0xa855f7);
          const factor = (Math.sin(t * 4.0) + 1.0) / 2.0;
          const activeColor = cyanColor.clone().lerp(purpleColor, factor);
          plasmaMat.uniforms.uColorBright.value = activeColor;
          shellFrontMat.uniforms.uColor.value = activeColor;
        } else if (isSpeakingState) {
          // Gentle voice sync breathing
          speedMultiplier = 1.5;
          scalePulse = 1.04 + Math.sin(t * 3.0) * 0.03;
          brightnessVal = 1.4;
          
          const activeColor = new THREE.Color(color);
          plasmaMat.uniforms.uColorBright.value = activeColor;
          shellFrontMat.uniforms.uColor.value = activeColor;
        } else {
          // Slow calm ambient breathing
          speedMultiplier = 0.8;
          scalePulse = 1.0 + Math.sin(t * 1.5) * 0.025;
          brightnessVal = 1.2;

          const activeColor = new THREE.Color(color);
          plasmaMat.uniforms.uColorBright.value = activeColor;
          shellFrontMat.uniforms.uColor.value = activeColor;
        }

        const scale = scalePulse + audioVal * 0.35;
        mainGroup.scale.setScalar(scale);

        plasmaMat.uniforms.uTime.value = t * speedMultiplier;
        plasmaMat.uniforms.uAudio.value = isThinking ? 0.3 + Math.sin(t * 4.0) * 0.1 : audioVal;
        plasmaMat.uniforms.uBrightness.value = brightnessVal;
        plasmaMat.uniforms.uScale.value = scaleVal;

        pMat.uniforms.uTime.value = t;
        pMat.uniforms.uAudio.value = isThinking ? 0.35 : audioVal;

        plasmaMesh.rotation.y = t * 0.08;
        mainGroup.rotation.x += 0.002;
        mainGroup.rotation.y += 0.005;

        // Animate Evolution Elements
        if (dataRing) {
          dataRing.rotation.z = t * 0.5;
          dataRing.rotation.x = t * 0.2;
        }
        if (neuralCore) {
          neuralCore.rotation.y = -t * 0.8;
          neuralCore.scale.setScalar(1 + Math.sin(t * 3) * 0.1);
        }

        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      const onResize = () => {
        if (!mountRef.current) return;
        const w = mountRef.current.clientWidth;
        const h = mountRef.current.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener("resize", onResize);
      sceneRef.current.onResize = onResize;
    };

    init();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      const s = sceneRef.current;
      if (s.renderer) {
        s.renderer.dispose();
        const canvas = s.renderer.domElement;
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      }
      if (s.onResize) window.removeEventListener("resize", s.onResize);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      stopMic();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update Color dynamically
  useEffect(() => {
    if (sceneRef.current.plasmaMat && sceneRef.current.shellFrontMat) {
      const newColor = new THREE.Color(color);
      sceneRef.current.plasmaMat.uniforms.uColorBright.value = newColor;
      sceneRef.current.shellFrontMat.uniforms.uColor.value = newColor;
    }
  }, [color]);

  // Update Size dynamically
  useEffect(() => {
    if (sceneRef.current.onResize) {
      sceneRef.current.onResize();
    }
  }, [size]);

  const stopMic = () => {
    const audio = audioRef.current;
    if (audio.stream) {
      audio.stream.getTracks().forEach(t => t.stop());
      audio.stream = null;
    }
    audio.analyser = null;
    audio.dataArray = null;
    audio.smoothed = 0;
  };

  const toggleMic = async () => {
    if (micActive) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch(e) {}
      }
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      stopMic();
      setMicActive(false);
      if (setIsListening) setIsListening(false);
      if (setTranscript) setTranscript('');
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
      audioRef.current.analyser = analyser;
      audioRef.current.dataArray = new Uint8Array(analyser.frequencyBinCount);
      audioRef.current.stream = stream;
      setMicActive(true);
      setMicError(null);
      if (setIsListening) setIsListening(true);
      startMediaRecorder(stream);
    } catch (e) {
      setMicError("Microphone access denied.");
    }
  };

  return (
    <div 
      style={{ 
        position: "relative", 
        width: size + "px", 
        height: size + "px", 
        zIndex: 1000,
        borderRadius: "50%"
      }}
    >
      <div ref={mountRef} style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden" }} />

      {/* Mic button */}
      <div style={{
        position: "absolute", bottom: -15, left: "50%", transform: "translateX(-50%) scale(0.6)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
        pointerEvents: "auto"
      }}>
        <button
          id="mic-toggle-btn"
          onClick={toggleMic}
          style={{
            width: 56, height: 56, borderRadius: "50%",
            border: micActive ? "2px solid #00ffe1" : "2px solid #0066ff",
            background: micActive ? "rgba(0,255,225,0.12)" : "rgba(0,100,255,0.1)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.3s ease",
            boxShadow: micActive ? "0 0 20px rgba(0,255,225,0.4)" : "0 0 12px rgba(0,100,255,0.3)"
          }}
          aria-label={micActive ? "Stop microphone" : "Start microphone"}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={micActive ? "#00ffe1" : "#0084ff"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {micActive ? (
              <>
                <rect x="9" y="2" width="6" height="12" rx="3"/>
                <path d="M5 10a7 7 0 0 0 14 0"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
                <line x1="9" y1="21" x2="15" y2="21"/>
              </>
            ) : (
              <>
                <rect x="9" y="2" width="6" height="12" rx="3" strokeDasharray="2 0"/>
                <path d="M5 10a7 7 0 0 0 14 0"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
                <line x1="9" y1="21" x2="15" y2="21"/>
                <line x1="3" y1="3" x2="21" y2="21" stroke="#ff4444"/>
              </>
            )}
          </svg>
        </button>
        {micActive && (
          <div style={{
            display: "flex", gap: 4, alignItems: "flex-end", height: 16
          }}>
            {[0,1,2,3,4].map(i => (
              <div key={i} style={{
                width: 3, background: "#00ffe1", borderRadius: 2,
                animation: `bounce${i} 0.6s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.1}s`,
                height: `${8 + i * 2}px`,
                opacity: 0.8
              }}/>
            ))}
          </div>
        )}
        {micError && (
          <p style={{ color: "#ff6666", fontSize: 12, margin: 0 }}>{micError}</p>
        )}
        <p style={{ color: micActive ? "#00ffe1" : "#0084ff", fontSize: 12, margin: 0, opacity: 0.7, letterSpacing: "0.05em" }}>
          {micActive ? "listening" : "tap to speak"}
        </p>
      </div>

      <style>{`
        @keyframes bounce0 { from { height: 4px } to { height: 14px } }
        @keyframes bounce1 { from { height: 6px } to { height: 16px } }
        @keyframes bounce2 { from { height: 8px } to { height: 18px } }
        @keyframes bounce3 { from { height: 6px } to { height: 14px } }
        @keyframes bounce4 { from { height: 4px } to { height: 12px } }
      `}</style>
    </div>
  );
}