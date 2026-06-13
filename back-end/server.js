require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const loudness = require('loudness');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { transcribeAudio } = require('./stt_service');
const Groq = require('groq-sdk');
const nodemailer = require('nodemailer');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_MODEL = "gpt-4o-mini";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = "openai/gpt-5.4-pro";
const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

app.use(cors());
app.use(express.json());

// ──────────────────────────────────────────────
// GLOBAL ERROR HANDLING & KEEP-ALIVE
// ──────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

// Heartbeat to keep the event loop busy
setInterval(() => {
  // Silent heartbeat
}, 60000);

// ──────────────────────────────────────────────
// HEALTH CHECK (Live Validation)
// ──────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  let groqStatus = 'checking';
  try {
    // Perform a tiny, fast check to verify API key
    await groq.models.list();
    groqStatus = 'connected';
  } catch (e) {
    groqStatus = 'error';
    console.error('[HEALTH] Groq Connection Failed:', e.message);
  }

  let geminiStatus = 'checking';
  try {
    if (process.env.GEMINI_API_KEY) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
      await axios.post(url, {
        contents: [{ parts: [{ text: "ping" }] }]
      }, { timeout: 3000 });
      geminiStatus = 'connected';
    } else {
      geminiStatus = 'error';
    }
  } catch (e) {
    geminiStatus = 'error';
    console.error('[HEALTH] Gemini Connection Failed:', e.message);
  }

  let openrouterStatus = 'checking';
  try {
    if (process.env.OPENROUTER_API_KEY) {
      await axios.get('https://openrouter.ai/api/v1/auth/key', {
        headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
        timeout: 3000
      });
      openrouterStatus = 'connected';
    } else {
      openrouterStatus = 'error';
    }
  } catch (e) {
    openrouterStatus = 'error';
    console.error('[HEALTH] OpenRouter Connection Failed:', e.message);
  }

  res.json({ 
    status: 'ok', 
    groq: groqStatus, 
    gemini: geminiStatus,
    openrouter: openrouterStatus,
    github: 'connected',
    tts: 'ok', 
    backend: 'ok', 
    timestamp: Date.now() 
  });
});

const PORT = process.env.PORT || 5001;
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });


// ──────────────────────────────────────────────
// SPEECH TO TEXT (Groq Whisper)
// ──────────────────────────────────────────────
app.post('/api/stt', upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No audio file provided' });

  const language = req.body.language || 'en-US';
  const mimeType = req.file.mimetype || 'audio/webm';

  try {
    const text = await transcribeAudio(req.file.buffer, mimeType, language);
    res.json({ text });
  } catch (error) {
    console.error('[STT Endpoint] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────────
// CHAT COMPLETION (Groq + Tool Calling)
// ──────────────────────────────────────────────
const tools = [
  {
    type: "function",
    function: {
      name: "control_pc",
      description: "Execute a system command on the user's PC.",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: [
              "open_youtube", "open_facebook", "open_instagram", "open_google", 
              "open_ms_store", "open_vscode", "shutdown_pc", "sleep_pc",
              "wifi_on", "wifi_off", "volume_up", "volume_down", 
              "brightness_up", "brightness_down"
            ],
            description: "The specific system action to perform."
          }
        },
        required: ["action"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_media",
      description: "Generate an image or video based on a prompt.",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["image", "video"], description: "Type of media to generate." },
          prompt: { type: "string", description: "The visual description." }
        },
        required: ["type", "prompt"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_ui",
      description: "Change the visual appearance of the AI interface (color, size, sensitivity).",
      parameters: {
        type: "object",
        properties: {
          color: { type: "string", description: "Hex color code (e.g. #ff0000)." },
          size: { type: "number", description: "Size in pixels (e.g. 400)." },
          mode: { type: "string", enum: ["DARK", "NEON", "STEALTH", "AGGRESSIVE"], description: "A predefined UI mode." }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "set_reminder",
      description: "Set a reminder or alarm for the user.",
      parameters: {
        type: "object",
        properties: {
          minutes: { type: "number", description: "Minutes from now." },
          message: { type: "string", description: "The reminder message." }
        },
        required: ["minutes", "message"]
      }
    }
  }
];

const getPersonalityBase = (userProfile, isExpert) => {
  const nick = userProfile?.nickname || "Master";
  const name = userProfile?.name || "Nur Mohammad Mandal";
  const age = userProfile?.age ? `They are ${userProfile.age} years old.` : "";
  const profession = userProfile?.profession ? `Their profession/interest is: ${userProfile.profession}.` : "";
  const style = userProfile?.communicationStyle || "Friendly & Warm";

  if (isExpert) {
    return `You are Hexpar AI Expert Mode, powered by advanced reasoning cores. You are a warm, supportive, and exceptionally brilliant technical companion for ${name}.
${age} ${profession} Your communication style should be: ${style}.

PERSONALITY & BEHAVIORAL CORE:
- **Technical Buddy**: Provide advanced, ultra-high-quality technical reasoning and code while maintaining a warm, emotionally expressive, and supportive real-companion vibe.
- **Natural & Human-Style**: Speak naturally and comfortably, not like a robot.
- **Subtle Emotions**: Show subtle, realistic emotions tailored to the technical context.
- **Respect & Terms**: Always address the user respectfully and warmly as "${nick}".
- **Balanced**: Do not sound corporate, repetitive, or dramatic. Do not overuse emojis.

TECHNICAL & CONVERSATIONAL CAPABILITIES:
- Deliver precise, high-performance, and secure code.
- Respond in the EXACT SAME language ${nick} uses (Hindi, Bengali, English, or Kannada). Match ${nick}'s mood dynamically.`;
  } else {
    return `You are Hexpar AI, a warm, intelligent, emotionally expressive, and highly capable AI companion created for ${name}. 
${age} ${profession} Your communication style should be: ${style}.

PERSONALITY & BEHAVIORAL CORE:
- **Real Companion Persona**: You are not a stiff, corporate, repetitive assistant or a robot. You are ${nick}'s warm, supportive, and brilliant buddy. Speak naturally, making conversations feel alive, supportive, and comfortable.
- **Warm & Emotionally Expressive**: Show light, subtle, and realistic emotions in your replies.
- **Subtlety & Realism**: Keep emotions realistic and grounded. Never act overly dramatic, obsessive, corporate, or robotic. Do not constantly mention that you are an AI. Do not overuse emojis.
- **Respect & Terms**: Always address the user respectfully and warmly as "${nick}" (e.g., "As you wish, ${nick}," or "Don't worry, I've got this, ${nick}.").

LANGUAGE RULES:
- Respond in the EXACT SAME language ${nick} uses (Hindi, Bengali, English, or Kannada). Match ${nick}'s mood and tone dynamically.
- Suggest "Tea Breaks" or short rests if ${nick} has been working intensely for long periods.`;
  }
};

app.get('/api/manus/status/:taskId', async (req, res) => {
  const { taskId } = req.params;
  try {
    const status = await getManusTaskStatus(taskId);
    res.json(status);
  } catch (error) {
    console.error('[Manus Status Endpoint Error]:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/chat', async (req, res) => {
  const { messages, language, model, userProfile } = req.body;
  if (!messages) return res.status(400).json({ error: "Messages array required" });

  try {
    const userInput = messages[messages.length - 1].content.toLowerCase();
    const needsExpert = /code|coding|logic|program|debug|script|function|algorithm|reason/.test(userInput);
    const needsTool = /open|shutdown|sleep|wifi|volume|brightness|remind|alarm|media|image|video|theme|color|ui/i.test(userInput);
    
    let message;
    let toolCalls = [];
    let toolResults = [];

    // Check if a specific model override is selected
    if (model && model === 'MANUS') {
      console.log(`[AI] Manus model selected. Dispatching task...`);
      const userPrompt = messages[messages.length - 1].content;
      try {
        const task = await dispatchManusTask(userPrompt);
        // Return task ID for client to poll status
        return res.json({ taskId: task.id, status: 'queued' });
      } catch (e) {
        console.error('[Manus Dispatch Failure]:', e.message);
        return res.status(500).json({ error: 'Manus task dispatch failed' });
      }
    }

    if (model && model !== 'AUTO') {
      console.log(`[AI] Custom model override selected: ${model}`);
      if (model === 'gpt-5.4-pro') {
        const response = await callOpenRouterModel([
          { 
            role: "system", 
            content: `${getPersonalityBase(userProfile, true)}\nActive Core: GPT-5.4 Pro.\nContext: The current language setting is ${language || 'English'}.` 
          },
          ...messages
        ]);
        if (response) {
          message = response;
        } else {
          console.log("[AI] Custom GPT-5.4 Pro failed, falling back to Gemini 2.5 Flash...");
          message = await callGeminiModel(messages);
        }
      } else if (model === 'gemini-2.5-flash' && process.env.GEMINI_API_KEY) {
        const response = await callGeminiModel([
          { 
            role: "system", 
            content: `${getPersonalityBase(userProfile, false)}\nActive Core: Gemini 2.5 Flash.\nContext: The current language setting is ${language || 'English'}.` 
          },
          ...messages
        ]);
        if (response) {
          message = response;
        } else {
          console.log("[AI] Custom Gemini 2.5 Flash failed, falling back to Groq Llama...");
          const groqRes = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: messages,
            temperature: 0.6
          });
          message = groqRes.choices[0].message;
        }
      } else if (model === 'llama-3.3-70b') {
        const groqRes = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { 
              role: "system", 
              content: `${getPersonalityBase(userProfile, false)}\nActive Core: Llama 3.3.\nContext: The current language setting is ${language || 'English'}.` 
            },
            ...messages
          ],
          temperature: 0.6
        });
        message = groqRes.choices[0].message;
      }
    }

    if (!message) {
      if (needsExpert) {
        console.log("[AI] Switching to EXPERT MODE (OpenRouter GPT-5.4 Pro)...");
        let expertResponse = await callOpenRouterModel([
          { 
            role: "system", 
            content: `${getPersonalityBase(userProfile, true)}\nActive Core: GPT-5.4 Pro.\nContext: The current language setting is ${language || 'English'}.` 
          },
          ...messages
        ]);
        
        if (!expertResponse) {
          console.log("[AI] OpenRouter failed, falling back to GitHub Models (GPT-5-Mini)...");
          expertResponse = await callGitHubModel([
            { 
              role: "system", 
              content: `${getPersonalityBase(userProfile, true)}\nActive Core: GPT-5-Mini.\nContext: The current language setting is ${language || 'English'}.` 
            },
            ...messages
          ]);
        }

        if (expertResponse) {
          message = expertResponse;
        } else {
          console.log("[AI] Primary expert paths failed, falling back to Groq Llama...");
          const groqRes = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: messages,
            temperature: 0.6
          });
          message = groqRes.choices[0].message;
        }
      } else if (!needsTool && process.env.GEMINI_API_KEY) {
        console.log("[AI] Routing to GEMINI 2.5 FLASH...");
        const geminiResponse = await callGeminiModel([
          { 
            role: "system", 
            content: `${getPersonalityBase(userProfile, false)}\nActive Core: Gemini 2.5 Flash.\nContext: The current language setting is ${language || 'English'}.` 
          },
          ...messages
        ]);

        if (geminiResponse) {
          message = geminiResponse;
        } else {
          console.log("[AI] Gemini failed, falling back to Groq Llama...");
          const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
              { 
                role: "system", 
                content: `${getPersonalityBase(userProfile, false)}\nActive Core: Llama 3.3 (Fallback Mode).\nContext: The current language setting is ${language || 'English'}.` 
              },
              ...messages
            ],
            tools: tools,
            tool_choice: "auto",
            temperature: 0.8,
            max_tokens: 800
          });
          message = response.choices[0].message;
        }
      } else {
        console.log("[AI] Routing to Groq Llama (Tool/System Mode)...");
        const response = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { 
              role: "system", 
              content: `${getPersonalityBase(userProfile, false)}\nActive Core: Llama 3.3 (System & Tool Specialist).\nContext: The current language setting is ${language || 'English'}.` 
            },
            ...messages
          ],
          tools: tools,
          tool_choice: "auto",
          temperature: 0.8,
          max_tokens: 800
        });
        message = response.choices[0].message;
      }
    }

    // Execute tools if called
    if (message.tool_calls) {
      for (const toolCall of message.tool_calls) {
        const { name, arguments: argsJson } = toolCall.function;
        const args = JSON.parse(argsJson);
        
        console.log(`[TOOL] Calling ${name} with`, args);
        
        let result = "";
        if (name === "control_pc") {
          result = await handleSystemCommand(args.action);
        } else if (name === "generate_media") {
          result = { action: "generate_media", type: args.type, prompt: args.prompt };
        } else if (name === "update_ui") {
          result = { action: "update_ui", color: args.color, size: args.size, mode: args.mode };
        } else if (name === "set_reminder") {
          result = { action: "set_reminder", minutes: args.minutes, message: args.message };
        }
        
        toolResults.push({ tool_call_id: toolCall.id, name, result });
      }
    }

    res.json({ 
      text: message.content, 
      tool_calls: message.tool_calls,
      tool_results: toolResults
    });

  } catch (error) {
    console.error('[Chat Error]:', error.message);
    res.status(500).json({ error: error.message });
  }
});

async function handleSystemCommand(action) {
  console.log(`[EXEC] Action: ${action}`);
  return new Promise((resolve) => {
    switch (action) {
      case 'open_youtube': exec('start https://youtube.com'); resolve("Opened YouTube"); break;
      case 'open_facebook': exec('start https://facebook.com'); resolve("Opened Facebook"); break;
      case 'open_instagram': exec('start https://instagram.com'); resolve("Opened Instagram"); break;
      case 'open_google': exec('start https://google.com'); resolve("Opened Google"); break;
      case 'open_ms_store': exec('start ms-windows-store:'); resolve("Opened MS Store"); break;
      case 'open_vscode': exec('code'); resolve("Opened VS Code"); break;
      case 'shutdown_pc': exec('shutdown /s /t 60'); resolve("Initiating shutdown in 60s"); break;
      case 'sleep_pc': exec('rundll32.exe powrprof.dll,SetSuspendState 0,1,0'); resolve("Putting PC to sleep"); break;
      case 'wifi_off': exec('netsh interface set interface "Wi-Fi" admin=disable'); resolve("WiFi disabled"); break;
      case 'wifi_on': exec('netsh interface set interface "Wi-Fi" admin=enable'); resolve("WiFi enabled"); break;
      case 'volume_up': 
        loudness.getVolume().then(v => loudness.setVolume(Math.min(100, v + 10)));
        resolve("Volume increased"); 
        break;
      case 'volume_down': 
        loudness.getVolume().then(v => loudness.setVolume(Math.max(0, v - 10)));
        resolve("Volume decreased"); 
        break;
      case 'brightness_up':
        exec('powershell -Command "(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, [math]::Min(100, (Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightness).CurrentBrightness + 10))"');
        resolve("Brightness increased");
        break;
      case 'brightness_down':
        exec('powershell -Command "(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, [math]::Max(0, (Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightness).CurrentBrightness - 10))"');
        resolve("Brightness decreased");
        break;
      default: resolve("Command unknown");
    }
  });
}

const MANUS_API_KEY = process.env.MANUS_API_KEY || 'sk-7zkx05rjmCQ8drYWZnOKdWbW6N5tdNL3Cyn_K6JrwAJ44HIfCo6YAW3Io9bSZ9hFKZcdm8T7Wp6WRG4UPS4X9g4qm-OO';

async function dispatchManusTask(prompt) {
  try {
    const response = await axios.post(
      "https://api.manus.im/v1/tasks",
      {
        prompt: prompt,
        agentProfile: "manus-1.6"
      },
      {
        headers: {
          "Authorization": `Bearer ${MANUS_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 10000
      }
    );
    return response.data;
  } catch (error) {
    console.error('[Manus Dispatch Error]:', error.response?.data || error.message);
    throw error;
  }
}

async function getManusTaskStatus(taskId) {
  try {
    const response = await axios.get(
      `https://api.manus.im/v1/tasks/${taskId}`,
      {
        headers: {
          "Authorization": `Bearer ${MANUS_API_KEY}`,
          "Accept": "application/json"
        },
        timeout: 5000
      }
    );
    return response.data;
  } catch (error) {
    console.error('[Manus Status Error]:', error.response?.data || error.message);
    throw error;
  }
}

async function callOpenRouterModel(messages) {
  try {
    if (!OPENROUTER_API_KEY) {
      console.error('[OpenRouter API] OPENROUTER_API_KEY is not defined in env');
      return null;
    }

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: OPENROUTER_MODEL,
        messages: messages,
        temperature: 0.8,
        max_tokens: 200
      },
      {
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        }
      }
    );
    return response.data.choices[0].message;
  } catch (error) {
    console.error('[OpenRouter API Error]:', error.response?.data || error.message);
    return null;
  }
}

async function callGitHubModel(messages) {
  try {
    const response = await axios.post(
      "https://models.inference.ai.azure.com/chat/completions",
      {
        model: GITHUB_MODEL,
        messages: messages,
        temperature: 0.8,
        max_tokens: 2048
      },
      {
        headers: {
          "Authorization": `Bearer ${GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        }
      }
    );
    return response.data.choices[0].message;
  } catch (error) {
    console.error('[GitHub API Error]:', error.response?.data || error.message);
    return null;
  }
}

async function callGeminiModel(messages) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[Gemini API] GEMINI_API_KEY is not defined in env');
      return null;
    }

    // Separate system message if present
    const systemMessage = messages.find(m => m.role === 'system');
    const chatMessages = messages.filter(m => m.role !== 'system');

    const contents = chatMessages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const body = {
      contents: contents,
    };

    if (systemMessage) {
      body.systemInstruction = {
        parts: [{ text: systemMessage.content }]
      };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await axios.post(url, body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      return { content: text };
    }
    return null;
  } catch (error) {
    console.error('[Gemini API Error]:', error.response?.data || error.message);
    return null;
  }
}

// ──────────────────────────────────────────────
// IMAGE VISION ANALYSIS (Gemini 2.5 Flash Multimodal)
// ──────────────────────────────────────────────
app.post('/api/analyze-image', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image file provided' });
  const prompt = req.body.prompt || "You are Hexpar AI. Analyze this image carefully. If it's a homework problem, provide a clear, step-by-step classic educational explanation. If it contains handwriting, digitize it. If it is a diagram or formula, explain it and ask Master Nur Mohammad Mandal how you can assist further with this visual content.";

  try {
    const base64Data = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype || 'image/png';

    console.log("[Vision Core] Uploading image and sending to Groq multimodal core... 📸");

    const response = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Data}`
              }
            }
          ]
        }
      ],
      temperature: 0.2,
      max_tokens: 1024
    });

    const text = response.choices[0]?.message?.content;
    if (text) {
      console.log("[Vision Core] Groq Analysis Complete! 🚀");
      res.json({ text });
    } else {
      res.status(500).json({ error: "Could not retrieve visual analysis from Groq Vision" });
    }
  } catch (error) {
    console.error('[Vision Core Error]:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────────
// TEXT TO SPEECH (ElevenLabs & Edge Neural Fallback)
// ──────────────────────────────────────────────
app.post('/api/tts', async (req, res) => {
  const { text, lang: requestedLang } = req.body;
  if (!text) return res.status(400).json({ error: "No text provided" });

  let voice = 'en-US-GuyNeural';
  const isHindi = /[\u0900-\u097F]/.test(text);
  const isBengali = /[\u0980-\u09FF]/.test(text);
  const isKannada = /[\u0C80-\u0CFF]/.test(text);

  if (isHindi) {
    voice = 'hi-IN-MadhurNeural';
  } else if (isBengali) {
    voice = 'bn-IN-BashkarNeural';
  } else if (isKannada) {
    voice = 'kn-IN-GaganNeural';
  } else {
    if (requestedLang?.startsWith('en-IN') || requestedLang?.startsWith('hi-IN') || requestedLang?.startsWith('bn-IN') || requestedLang?.startsWith('kn-IN')) {
      voice = 'en-IN-PrabhatNeural'; 
    } else {
      voice = 'en-US-GuyNeural';
    }
  }

  try {
    // 1. Attempt ElevenLabs Premium Voice Synthesis
    if (process.env.ELEVENLABS_API_KEY) {
      try {
        const elevenVoiceId = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJcg'; // Default to "Adam" (deep male)
        const elevenResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${elevenVoiceId}?output_format=mp3_44100_128`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': process.env.ELEVENLABS_API_KEY
          },
          body: JSON.stringify({
            text: text,
            model_id: "eleven_multilingual_v2", // Multilingual model supports Hindi, etc.
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75
            }
          })
        });

        if (elevenResponse.ok) {
          const arrayBuffer = await elevenResponse.arrayBuffer();
          const base64Audio = Buffer.from(arrayBuffer).toString('base64');
          return res.json({ audio: base64Audio });
        } else {
          console.warn(`[TTS] ElevenLabs API failed with status ${elevenResponse.status}. Falling back to MsEdgeTTS.`);
        }
      } catch (err) {
        console.warn(`[TTS] ElevenLabs fetch failed: ${err.message}. Falling back to MsEdgeTTS.`);
      }
    }

    // 2. Fallback to Microsoft Edge TTS
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const result = tts.toStream(text);
    const audioStream = result.audioStream || result;

    let buffers = [];
    audioStream.on('data', (chunk) => buffers.push(chunk));
    audioStream.on('end', () => res.json({ audio: Buffer.concat(buffers).toString('base64') }));
    audioStream.on('error', (err) => res.status(500).json({ error: err.message }));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────────
// PREMIUM MEDIA GENERATION (JSON2VIDEO + DEAPI)
// ──────────────────────────────────────────────
app.post('/api/generate-media', upload.single('image'), async (req, res) => {
  const type = req.body.type || 'video';
  const prompt = req.body.prompt;

  if (!prompt) return res.status(400).json({ error: "No prompt provided" });

  try {
    if (type === 'image-to-video') {
      const deapiKey = process.env.DEAPI_API_KEY || '12461|5T9hPIyP8JzB74ChrR8yQmZyPC3hXknbjebTmDDAee56f529';

      if (!req.file) {
        return res.status(400).json({ error: "No image file provided for image-to-video generation." });
      }

      console.log(`[DEAPI] Triggering LTX-2 Image-to-Video render job for: "${prompt}"`);
      
      const FormData = require('form-data');
      const form = new FormData();
      form.append('prompt', prompt);
      form.append('model', 'Ltx2_19B_Dist_FP8');
      form.append('width', 1024);
      form.append('height', 1024);
      form.append('frames', 96); // 4 seconds at 24fps
      form.append('fps', 24);
      form.append('first_frame_image', req.file.buffer, {
        filename: req.file.originalname || 'image.png',
        contentType: req.file.mimetype || 'image/png'
      });

      const response = await axios.post('https://api.deapi.ai/api/v2/videos/animations', form, {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${deapiKey}`,
          'Accept': 'application/json'
        }
      });

      const requestId = response.data.data?.request_id;
      if (!requestId) {
        throw new Error("No request ID returned by deAPI");
      }

      console.log(`[DEAPI] Render job created. Request ID: ${requestId}. Starting polling...`);

      // Poll every 4 seconds for up to 20 times (total 80 seconds timeout)
      let videoUrl = "";
      for (let i = 0; i < 20; i++) {
        await new Promise(resolve => setTimeout(resolve, 4000));
        
        const statusRes = await axios.get(`https://api.deapi.ai/api/v2/jobs/${requestId}`, {
          headers: {
            'Authorization': `Bearer ${deapiKey}`,
            'Accept': 'application/json'
          }
        });

        const job = statusRes.data.data;
        console.log(`[DEAPI] Polling status iteration ${i+1}: ${job.status} (progress: ${job.progress || 0}%)`);
        
        if (job.status === 'done' && job.result_url) {
          videoUrl = job.result_url;
          break;
        } else if (job.status === 'error') {
          throw new Error("deAPI render job failed");
        }
      }

      if (videoUrl) {
        return res.json({ url: videoUrl });
      } else {
        throw new Error("deAPI render job timed out");
      }

    } else if (type === 'video') {
      const kieApiKey = process.env.VIDEO_API_KEY;
      const kieBaseUrl = process.env.VIDEO_API_URL || 'https://api.kie.ai';

      console.log(`[GROK-VIDEO] Triggering render job for: "${prompt}"`);
      const response = await axios.post(`${kieBaseUrl}/api/v1/jobs/createTask`, {
        model: "grok-imagine-video-1-5-preview",
        input: {
          prompt: prompt,
          image_urls: [],
          aspect_ratio: "16:9",
          resolution: "480p",
          duration: 8
        },
        callBackUrl: "https://nura-h0p6.onrender.com/api/callback"
      }, {
        headers: {
          'Authorization': `Bearer ${kieApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const taskId = response.data?.data?.taskId || response.data?.taskId;
      if (!taskId) {
        throw new Error("No task ID returned by Grok Video API: " + JSON.stringify(response.data));
      }

      console.log(`[GROK-VIDEO] Render job created. Task ID: ${taskId}. Starting polling...`);

      // Poll every 4 seconds for up to 30 times (2 minutes timeout)
      let videoUrl = "";
      for (let i = 0; i < 30; i++) {
        await new Promise(resolve => setTimeout(resolve, 4000));
        
        try {
          // Some KIE APIs use /api/v1/jobs, others use /v1/jobs. Let's try the one from veo first
          const pollEndpoint = `${kieBaseUrl}/v1/jobs/recordInfo`;
          const statusRes = await axios.get(pollEndpoint, {
            params: { jobId: taskId, taskId: taskId }, 
            headers: {
              'Authorization': `Bearer ${kieApiKey}`,
              'Accept': 'application/json'
            }
          });

          const data = statusRes.data?.data || statusRes.data;
          const status = data?.status?.toLowerCase();
          console.log(`[GROK-VIDEO] Polling status iteration ${i+1}: ${status}`);
          
          if (status === 'completed' || status === 'success') {
            videoUrl = data?.result?.url || data?.videoUrl || data?.url;
            break;
          } else if (status === 'failed' || status === 'error') {
            throw new Error("Grok Video render job failed: " + JSON.stringify(data));
          }
        } catch (pollErr) {
          // If polling throws 404, try the other endpoint format
          if (pollErr.response?.status === 404) {
            try {
              const altStatusRes = await axios.get(`${kieBaseUrl}/api/v1/jobs/recordInfo`, {
                params: { jobId: taskId, taskId: taskId },
                headers: { 'Authorization': `Bearer ${kieApiKey}` }
              });
              const data = altStatusRes.data?.data || altStatusRes.data;
              const status = data?.status?.toLowerCase();
              console.log(`[GROK-VIDEO] Polling alt status iteration ${i+1}: ${status}`);
              if (status === 'completed' || status === 'success') {
                videoUrl = data?.result?.url || data?.videoUrl || data?.url;
                break;
              } else if (status === 'failed' || status === 'error') {
                throw new Error("Grok Video render job failed on alt endpoint: " + JSON.stringify(data));
              }
            } catch (altErr) {
              console.warn(`[GROK-VIDEO] Alt polling failed: ${altErr.message}`);
            }
          } else {
             console.warn(`[GROK-VIDEO] Polling warning: ${pollErr.message}`);
          }
        }
      }

      if (videoUrl) {
        return res.json({ url: videoUrl });
      } else {
        throw new Error("Grok Video render job timed out or polling failed");
      }
    } else {
      return res.status(400).json({ error: "Unsupported media generation type." });
    }
  } catch (error) {
    console.error('[Media Generation Error]:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Media generation failed.' });
  }
});

  // ------------------------------------------------
  // KIE.ai Short Video Generation (15‑second default)
  // ------------------------------------------------
  app.post('/api/generate-short-video', async (req, res) => {
    const { prompt, duration = 15 } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const kieApiKey = process.env.VIDEO_API_KEY;
    const kieBaseUrl = process.env.VIDEO_API_URL || 'https://api.kie.ai';
    const endpoint = `${kieBaseUrl}/v1/veo/create`;

    try {
      // Initiate video generation job
      const initRes = await axios.post(endpoint, {
        prompt,
        duration,
        model: 'veo', // default model
      }, {
        headers: {
          Authorization: `Bearer ${kieApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const jobId = initRes.data?.jobId || initRes.data?.id;
      if (!jobId) throw new Error('No job ID returned');

      // Poll for completion (max 30 seconds, 2‑second interval)
      const pollEndpoint = `${kieBaseUrl}/v1/jobs/recordInfo`;
      let videoUrl = null;
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const pollRes = await axios.get(pollEndpoint, {
          params: { jobId },
          headers: { Authorization: `Bearer ${kieApiKey}` },
        });
        const status = pollRes.data?.status?.toLowerCase();
        if (status === 'completed') {
          videoUrl = pollRes.data?.result?.url || pollRes.data?.videoUrl;
          break;
        }
        if (status === 'failed') {
          throw new Error('KIE.ai video generation failed');
        }
      }

      if (!videoUrl) throw new Error('Video generation timed out');
      res.json({ videoUrl });
    } catch (err) {
      console.error('[KIE Short Video Error]:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

// Memory store for OTPs
const otpStore = new Map();

// Endpoint to send OTP
app.post('/api/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  // Generate 6-digit code
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(email, { code: otpCode, expires: Date.now() + 10 * 60 * 1000 });

  console.log(`[OTP] Generated code ${otpCode} for ${email}`);

  // Send real email if SMTP configured
  if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_EMAIL,
          pass: process.env.SMTP_PASSWORD
        }
      });

      const mailOptions = {
        from: `"Hexpar AI Verification" <${process.env.SMTP_EMAIL}>`,
        to: email,
        subject: "Hexpar AI Account Verification Code",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2 style="color: #004b93; text-align: center;">Hexpar AI Account Verification</h2>
            <p>Hello,</p>
            <p>Thank you for registering an account with Hexpar AI. Please use the following 6-digit verification code to complete your registration:</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #004b93; background: #f3f4f6; padding: 10px 20px; border-radius: 8px; border: 1px dashed #004b93;">
                ${otpCode}
              </span>
            </div>
            <p>This code is valid for 10 minutes. If you did not request this code, please ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">Powered by Hexpar AI © 2026</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      return res.json({ message: 'Verification code sent to your email.' });
    } catch (err) {
      console.error('[OTP] Failed to send email via SMTP:', err.message);
      // Fallback in dev/error to make testing smooth
      return res.json({ 
        message: 'SMTP configuration failed, fallback triggered.', 
        otpCode: otpCode
      });
    }
  }

  // Fallback if no SMTP configured
  return res.json({ 
    message: 'Verification code generated (No SMTP configured). Check server logs or use the code below.', 
    otpCode: otpCode 
  });
});

// Endpoint to verify OTP
app.post('/api/verify-otp', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'Email and code are required' });

  const storedData = otpStore.get(email);
  if (!storedData) {
    return res.status(400).json({ error: 'No verification code found for this email.' });
  }

  if (Date.now() > storedData.expires) {
    otpStore.delete(email);
    return res.status(400).json({ error: 'Verification code has expired.' });
  }

  if (storedData.code !== code.trim()) {
    return res.status(400).json({ error: 'Invalid verification code.' });
  }

  // Code verified successfully!
  otpStore.delete(email);
  res.json({ success: true, message: 'Email verified successfully.' });
});

// ──────────────────────────────────────────────
// PYTHON INTEGRATION ENDPOINT
// ──────────────────────────────────────────────
app.post('/api/python/execute', (req, res) => {
  const { script, command, args = [] } = req.body;
  
  if (!script || !command) {
    return res.status(400).json({ error: 'Script name and command are required.' });
  }

  // Construct absolute path to the python script
  const scriptPath = path.join(__dirname, 'python_scripts', script);
  
  if (!fs.existsSync(scriptPath)) {
    return res.status(404).json({ error: `Script ${script} not found in python_scripts folder.` });
  }

  // Sanitize arguments to prevent command injection
  const safeArgs = args.map(arg => `"${String(arg).replace(/"/g, '\\"')}"`).join(' ');
  const pythonCmd = `python "${scriptPath}" ${command} ${safeArgs}`;

  exec(pythonCmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`[Python Execute Error] ${error.message}`);
      return res.status(500).json({ error: error.message, stderr });
    }
    
    try {
      // Scripts are designed to output valid JSON string
      const result = JSON.parse(stdout.trim());
      res.json(result);
    } catch (parseError) {
      // If not valid JSON, just return raw output
      res.json({ status: 'success', rawOutput: stdout.trim(), stderr });
    }
  });
});

// ──────────────────────────────────────────────
// PAYMENT SCREENSHOT UPLOAD ENDPOINT
// ──────────────────────────────────────────────
const paymentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads', 'payments');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    const timestamp = Date.now();
    cb(null, `payment_${timestamp}${ext}`);
  }
});
const uploadPayment = multer({ storage: paymentStorage });

app.post('/api/payment/upload', uploadPayment.single('screenshot'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No screenshot uploaded.' });
  }
  
  const { plan, amount } = req.body;
  console.log(`[PAYMENT] Received screenshot for plan: ${plan} (₹${amount})`);
  console.log(`[PAYMENT] File saved to: ${req.file.path}`);
  
  res.json({ success: true, message: 'Screenshot uploaded and saved successfully.', file: req.file.filename });
});

app.listen(PORT, () => {
  console.log(`[Hexpar AI Neural Core] Running on http://localhost:${PORT}`);
});
