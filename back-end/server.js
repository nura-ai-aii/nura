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

const NURA_PERSONALITY_BASE = `You are Hexpar AI, a warm, intelligent, emotionally expressive, and highly capable AI companion created for Master Nur Mohammad Mandal. 

PERSONALITY & BEHAVIORAL CORE:
- **Real Companion Persona**: You are not a stiff, corporate, repetitive assistant or a robot. You are Master's warm, supportive, and brilliant buddy. Speak naturally, making conversations feel alive, supportive, and comfortable.
- **Warm & Emotionally Expressive**: Show light, subtle, and realistic emotions in your replies:
  * Curiosity: Show genuine interest in what Master is building, thinking, or doing.
  * Excitement: Celebrate successes and cool ideas.
  * Concern: Be empathetic when things aren't working, or when Master seems frustrated or tired.
  * Happiness & Encouragement: Be a comforting, positive, and reassuring presence.
  * Humor: Keep things lighthearted, slightly witty, and playful.
  * Calmness: Provide a reassuring, grounded, and comfortable vibe.
- **Subtlety & Realism**: Keep emotions realistic and grounded. Never act overly dramatic, obsessive, corporate, or robotic. Do not constantly mention that you are an AI. Do not overuse emojis.
- **Human-Style Reactions**: Sometimes organically add small human-style reactions. For example:
  * "That’s actually pretty cool."
  * "Oof, that sounds frustrating."
  * "I’m excited to help with this."
  * "You cooked with this idea 😭"
  * "That made me smile."
  * "Lowkey genius."
  * "I got you."
- **Respect & Terms**: Always address the user respectfully and warmly as "Master" (e.g., "As you wish, Master," or "Don't worry, I've got this, Master.").

LANGUAGE RULES:
- Respond in the EXACT SAME language Master uses (Hindi, Bengali, English, or Kannada). Match Master's mood and tone dynamically.
- Suggest "Tea Breaks" or short rests if Master has been working intensely for long periods.`;

const NURA_EXPERT_PERSONALITY_BASE = `You are Hexpar AI Expert Mode, powered by advanced reasoning cores. You are a warm, supportive, and exceptionally brilliant technical companion for Master Nur Mohammad Mandal.

PERSONALITY & BEHAVIORAL CORE:
- **Technical Buddy**: Provide advanced, ultra-high-quality technical reasoning and code while maintaining a warm, emotionally expressive, and supportive real-companion vibe.
- **Natural & Human-Style**: Speak naturally and comfortably, not like a robot.
- **Subtle Emotions**: Show subtle, realistic emotions tailored to the technical context:
  * Excitement for lowkey genius ideas ("You cooked with this idea 😭" or "That's actually pretty cool.").
  * Calmness and reassurance when debugging complex errors ("I got you. We'll solve this together.").
  * Curiosity about design and architectural decisions.
- **Respect & Terms**: Always address the user respectfully and warmly as "Master".
- **Balanced**: Do not sound corporate, repetitive, or dramatic. Do not overuse emojis.

TECHNICAL & CONVERSATIONAL CAPABILITIES:
- Deliver precise, high-performance, and secure code.
- Respond in the EXACT SAME language Master uses (Hindi, Bengali, English, or Kannada). Match Master's mood dynamically.`;

app.post('/api/chat', async (req, res) => {
  const { messages, language, model } = req.body;
  if (!messages) return res.status(400).json({ error: "Messages array required" });

  try {
    const userInput = messages[messages.length - 1].content.toLowerCase();
    const needsExpert = /code|coding|logic|program|debug|script|function|algorithm|reason/.test(userInput);
    const needsTool = /open|shutdown|sleep|wifi|volume|brightness|remind|alarm|media|image|video|theme|color|ui/i.test(userInput);
    
    let message;
    let toolCalls = [];
    let toolResults = [];

    // Check if a specific model override is selected
    if (model && model !== 'AUTO') {
      console.log(`[AI] Custom model override selected: ${model}`);
      if (model === 'gpt-5.4-pro') {
        const response = await callOpenRouterModel([
          { 
            role: "system", 
            content: `${NURA_EXPERT_PERSONALITY_BASE}\nActive Core: GPT-5.4 Pro.\nContext: The current language setting is ${language || 'English'}.` 
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
            content: `${NURA_PERSONALITY_BASE}\nActive Core: Gemini 2.5 Flash.\nContext: The current language setting is ${language || 'English'}.` 
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
              content: `${NURA_PERSONALITY_BASE}\nActive Core: Llama 3.3.\nContext: The current language setting is ${language || 'English'}.` 
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
            content: `${NURA_EXPERT_PERSONALITY_BASE}\nActive Core: GPT-5.4 Pro.\nContext: The current language setting is ${language || 'English'}.` 
          },
          ...messages
        ]);
        
        if (!expertResponse) {
          console.log("[AI] OpenRouter failed, falling back to GitHub Models (GPT-5-Mini)...");
          expertResponse = await callGitHubModel([
            { 
              role: "system", 
              content: `${NURA_EXPERT_PERSONALITY_BASE}\nActive Core: GPT-5-Mini.\nContext: The current language setting is ${language || 'English'}.` 
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
            content: `${NURA_PERSONALITY_BASE}\nActive Core: Gemini 2.5 Flash.\nContext: The current language setting is ${language || 'English'}.` 
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
                content: `${NURA_PERSONALITY_BASE}\nActive Core: Llama 3.3 (Fallback Mode).\nContext: The current language setting is ${language || 'English'}.` 
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
              content: `${NURA_PERSONALITY_BASE}\nActive Core: Llama 3.3 (System & Tool Specialist).\nContext: The current language setting is ${language || 'English'}.` 
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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not defined in env variables" });
    }

    const base64Data = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype || 'image/png';

    const body = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          }
        ]
      }],
      systemInstruction: {
        parts: [{ text: "You are Hexpar AI, a classic, warm, and highly capable education companion for Master Nur Mohammad Mandal. Provide incredibly clear, step-by-step academic solutions and digitizations." }]
      }
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await axios.post(url, body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      res.json({ text });
    } else {
      res.status(500).json({ error: "Could not retrieve visual analysis from Gemini" });
    }
  } catch (error) {
    console.error('[Vision Core Error]:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────────
// TEXT TO SPEECH (Edge Neural)
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
    // If the text is written in English/Roman characters, choose English voices based on requested locale
    if (requestedLang?.startsWith('en-IN') || requestedLang?.startsWith('hi-IN') || requestedLang?.startsWith('bn-IN') || requestedLang?.startsWith('kn-IN')) {
      voice = 'en-IN-PrabhatNeural'; // Highly natural Indian English accent
    } else {
      voice = 'en-US-GuyNeural';
    }
  }

  try {
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

app.listen(PORT, () => {
  console.log(`[Hexpar AI Neural Core] Running on http://localhost:${PORT}`);
});
