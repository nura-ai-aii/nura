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

export default function HwPlasmaOrb({ color = "#ff5500", size = 300, sensitivity = 2.0, setTranscript, setIsListening, speechLang = 'en-US', isSpeaking = false, interactionState, interactionCount = 0 }) {
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
    if (blob.size < 500) return;

    const formData = new FormData();
    formData.append('audio', blob, 'speech.webm');
    formData.append('language', sttLangRef.current);

    try {
      console.log('[STT HW] Sending audio chunk to backend...');
      const response = await fetch(`${BACKEND_URL}/api/stt`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.text && data.text.trim()) {
        console.log('[STT HW] Transcript:', data.text);
        if (setTranscript) setTranscript(prev => {
          const combined = prev ? `${prev} ${data.text}`.trim() : data.text.trim();
          return combined;
        });
      }
    } catch (error) {
      console.error('[STT HW] Backend error:', error.message);
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
    console.log('[STT HW] MediaRecorder started');
  };

  const stopRecordingChunk = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  // ── VAD (Voice Activity Detection) ──────────────────────────
  const vadRef = useRef({ speaking: false, silenceMs: 0, totalMs: 0, lastSpeechTime: 0 });

  const tickVAD = (audioLevel) => {
    const vad = vadRef.current;
    const now = Date.now();
    
    const SPEECH_THRESHOLD = 0.035;
    const SILENCE_TIMEOUT_MS = 400;
    const MAX_RECORDING_MS = 5000;

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
      
      if (vad.silenceMs > SILENCE_TIMEOUT_MS || vad.totalMs > MAX_RECORDING_MS) {
        vad.speaking = false;
        vad.silenceMs = 0;
        vad.totalMs = 0;
        stopRecordingChunk();
      }
    }
  };

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
      renderer.toneMappingExposure = 1.0;
      el.appendChild(renderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.enablePan = false;
      controls.minDistance = 1.5;
      controls.maxDistance = 20;

      const mainGroup = new THREE.Group();
      scene.add(mainGroup);

      // Shell - Warm fiery orange/amber shell
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
        uniforms: { uColor: { value: new THREE.Color(0x4a1800) } }, // Warm deep mahogany/amber back
        transparent: true, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false
      });
      const shellFrontMat = new THREE.ShaderMaterial({
        vertexShader: shellVert, fragmentShader: shellFrag,
        uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: 0.45 } },
        transparent: true, blending: THREE.AdditiveBlending, side: THREE.FrontSide, depthWrite: false
      });
      mainGroup.add(new THREE.Mesh(shellGeo, shellBackMat));
      mainGroup.add(new THREE.Mesh(shellGeo, shellFrontMat));

      // Plasma - Fiery flame displacement
      const plasmaGeo = new THREE.SphereGeometry(0.998, 128, 128);
      const plasmaMat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uScale: { value: 0.25 },
          uBrightness: { value: 1.4 },
          uThreshold: { value: 0.08 },
          uAudio: { value: 0.0 },
          uColorDeep: { value: new THREE.Color(0x220500) }, // Deep hot embers
          uColorMid: { value: new THREE.Color(0xff4500) },  // Fiery reddish orange
          uColorBright: { value: new THREE.Color(color) }   // Bright golden yellow/orange
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
            // Fiery turbulence
            float displacement = snoise(pos * 2.5 + uTime * 0.4) * (0.05 + uAudio * 0.22);
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
            float speed = 1.1 + uAudio * 2.2;
            vec3 q = vec3(
              fbm(p + vec3(0.0, uTime * 0.06 * speed, 0.0)),
              fbm(p + vec3(4.8, 1.5, 3.0) + uTime * 0.07 * speed),
              fbm(p + vec3(1.8, 9.0, 0.8) - uTime * 0.03 * speed)
            );
            float density = fbm(p + 2.2 * q);
            float t = (density + 0.45) * 0.85;
            float threshold = uThreshold - uAudio * 0.07;
            float alpha = smoothstep(threshold, 0.68, t);
            vec3 cWhite = vec3(1.0, 0.95, 0.8); // Warm core
            vec3 midBoost = mix(uColorMid, vec3(1.0, 0.4, 0.0), uAudio * 0.55);
            vec3 color = mix(uColorDeep, midBoost, smoothstep(threshold, 0.48, t));
            color = mix(color, uColorBright, smoothstep(0.48, 0.78, t));
            color = mix(color, cWhite, smoothstep(0.78, 1.0, t));
            color += uAudio * vec3(0.4, 0.1, 0.0) * alpha; // Fire boost
            float facing = dot(normalize(vNormal), normalize(vViewPosition));
            float depthFactor = (facing + 1.0) * 0.5;
            float finalAlpha = alpha * (0.03 + 0.97 * depthFactor);
            gl_FragColor = vec4(color * uBrightness, finalAlpha);
          }
        `,
        transparent: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false
      });

      const plasmaMesh = new THREE.Mesh(plasmaGeo, plasmaMat);
      mainGroup.add(plasmaMesh);

      // Particles - Fiery sparks
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
        uniforms: { uTime: { value: 0 }, uAudio: { value: 0 }, uColor: { value: new THREE.Color(0xffa726) } }, // Amber particles
        vertexShader: `
          uniform float uTime;
          uniform float uAudio;
          attribute float aSize;
          varying float vAlpha;
          void main() {
            vec3 pos = position;
            // Float upward like real fire sparks
            pos.y += sin(uTime * 0.25 + pos.x) * (0.02 + uAudio * 0.05) + (uTime * 0.04 * aSize);
            if (pos.y > 1.0) pos.y = -1.0; // wrap sparks
            pos.x += cos(uTime * 0.18 + pos.z) * (0.02 + uAudio * 0.04);
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            float baseSize = (9.0 * aSize + 4.5) * (1.0 + uAudio * 0.9);
            gl_PointSize = baseSize * (1.0 / -mvPosition.z);
            vAlpha = 0.7 + 0.3 * sin(uTime * 1.5 + aSize * 10.0);
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

      // Evolution Elements - Fiery Torus Rings
      let dataRing = null;
      if (interactionCount > 10) {
        const ringGeo = new THREE.TorusGeometry(1.22, 0.025, 16, 100);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.45, wireframe: true });
        dataRing = new THREE.Mesh(ringGeo, ringMat);
        mainGroup.add(dataRing);
      }

      let neuralCore = null;
      if (interactionCount > 50) {
        const coreGeo = new THREE.IcosahedronGeometry(0.38, 1);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xffdd55, wireframe: true, transparent: true, opacity: 0.35 });
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

        tickVAD(rawLevel);

        const state = interactionStateRef.current;
        const isThinking = state === 'THINKING';
        const isSpeakingState = state === 'SPEAKING';

        let speedMultiplier = 1.3;
        let scalePulse = 1.0;
        let brightnessVal = 1.4;
        let scaleVal = 0.25;

        if (isThinking) {
          speedMultiplier = 3.0;
          scalePulse = 1.0 + Math.sin(t * 8.5) * 0.08;
          brightnessVal = 1.9 + Math.sin(t * 6.5) * 0.45;
          scaleVal = 0.42 + Math.cos(t * 3.2) * 0.09;

          // Heat morphing: bright fiery orange to hot red
          const orangeColor = new THREE.Color(color);
          const redColor = new THREE.Color(0xef4444);
          const factor = (Math.sin(t * 4.5) + 1.0) / 2.0;
          const activeColor = orangeColor.clone().lerp(redColor, factor);
          plasmaMat.uniforms.uColorBright.value = activeColor;
          shellFrontMat.uniforms.uColor.value = activeColor;
        } else if (isSpeakingState) {
          speedMultiplier = 1.6;
          scalePulse = 1.04 + Math.sin(t * 3.2) * 0.035;
          brightnessVal = 1.55;
          
          const activeColor = new THREE.Color(color);
          plasmaMat.uniforms.uColorBright.value = activeColor;
          shellFrontMat.uniforms.uColor.value = activeColor;
        } else {
          speedMultiplier = 0.95;
          scalePulse = 1.0 + Math.sin(t * 1.6) * 0.028;
          brightnessVal = 1.3;

          const activeColor = new THREE.Color(color);
          plasmaMat.uniforms.uColorBright.value = activeColor;
          shellFrontMat.uniforms.uColor.value = activeColor;
        }

        const scale = scalePulse + audioVal * 0.38;
        mainGroup.scale.setScalar(scale);

        plasmaMat.uniforms.uTime.value = t * speedMultiplier;
        plasmaMat.uniforms.uAudio.value = isThinking ? 0.32 + Math.sin(t * 4.0) * 0.12 : audioVal;
        plasmaMat.uniforms.uBrightness.value = brightnessVal;
        plasmaMat.uniforms.uScale.value = scaleVal;

        pMat.uniforms.uTime.value = t;
        pMat.uniforms.uAudio.value = isThinking ? 0.38 : audioVal;

        plasmaMesh.rotation.y = t * 0.1;
        mainGroup.rotation.x += 0.0025;
        mainGroup.rotation.y += 0.006;

        if (dataRing) {
          dataRing.rotation.z = t * 0.65;
          dataRing.rotation.x = t * 0.25;
        }
        if (neuralCore) {
          neuralCore.rotation.y = -t * 0.95;
          neuralCore.scale.setScalar(1 + Math.sin(t * 3.5) * 0.12);
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
      stopMic();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (sceneRef.current.plasmaMat && sceneRef.current.shellFrontMat) {
      const newColor = new THREE.Color(color);
      sceneRef.current.plasmaMat.uniforms.uColorBright.value = newColor;
      sceneRef.current.shellFrontMat.uniforms.uColor.value = newColor;
    }
  }, [color]);

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
            border: micActive ? "2px solid #ff5500" : "2px solid #e65100",
            background: micActive ? "rgba(255,85,0,0.15)" : "rgba(230,81,0,0.1)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.3s ease",
            boxShadow: micActive ? "0 0 20px rgba(255,85,0,0.55)" : "0 0 12px rgba(230,81,0,0.3)"
          }}
          aria-label={micActive ? "Stop microphone" : "Start microphone"}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={micActive ? "#ff5500" : "#ff8f00"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                <line x1="3" y1="3" x2="21" y2="21" stroke="#ff3333"/>
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
                width: 3, background: "#ff5500", borderRadius: 2,
                animation: `bounce${i} 0.6s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.1}s`,
                height: `${8 + i * 2}px`,
                opacity: 0.85
              }}/>
            ))}
          </div>
        )}
        {micError && (
          <p style={{ color: "#ff8888", fontSize: 12, margin: 0 }}>{micError}</p>
        )}
        <p style={{ color: micActive ? "#ff5500" : "#ff8f00", fontSize: 12, margin: 0, opacity: 0.8, letterSpacing: "0.05em" }}>
          {micActive ? "listening (warm)" : "tap to speak"}
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
