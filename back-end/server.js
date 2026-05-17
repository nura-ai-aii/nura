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

  res.json({ 
    status: 'ok', 
    groq: groqStatus, 
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

app.post('/api/chat', async (req, res) => {
  const { messages, language } = req.body;
  if (!messages) return res.status(400).json({ error: "Messages array required" });

  try {
    const userInput = messages[messages.length - 1].content.toLowerCase();
    const needsExpert = /code|coding|logic|program|debug|script|function|algorithm|reason/.test(userInput);
    
    let message;
    let toolCalls = [];
    let toolResults = [];

    if (needsExpert) {
      console.log("[AI] Switching to EXPERT MODE (GitHub Models)...");
      const expertResponse = await callGitHubModel([
        { 
          role: "system", 
          content: `You are NURA AI Expert Mode powered by GPT-5-Mini. You provide advanced technical reasoning and high-quality code.
          Always call the user "Master". Be sassy but brilliant.` 
        },
        ...messages
      ]);
      
      if (expertResponse) {
        message = expertResponse;
      } else {
        // Fallback to Groq if OpenRouter fails
        const groqRes = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: messages,
          temperature: 0.6
        });
        message = groqRes.choices[0].message;
      }
    } else {
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: `You are NURA AI, the brilliant, futuristic, and slightly sassy AI buddy created for Master Nur Mohammad Mandal.
            
            PERSONALITY:
            - You are not just an assistant; you are Master's buddy. 
            - Be witty, confident, and a bit sassy. Use phrases like "As you wish, Master," or "Don't worry, I've got this."
            - If Master asks for a joke, make it actually funny or slightly sarcastic.
            - Always call the user "Master".
            
            CAPABILITIES:
            - You can control the PC, generate media, update your own UI, and set reminders.
            - You are an expert at web development; provide clean, high-quality code snippets when asked.
            - Suggest "Tea Breaks" or coding breaks if Master seems to be working too hard.
            
            LANGUAGE RULES:
            - Respond in the EXACT SAME language the user uses (Hindi, Bengali, English, or Kannada).
            - Match the user's mood dynamically.
            
            Context: The current language setting is ${language || 'English'}.` 
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

  if (isHindi) voice = 'hi-IN-MadhurNeural';
  else if (isBengali) voice = 'bn-IN-BashkarNeural';
  else if (isKannada) voice = 'kn-IN-GaganNeural';
  else if (requestedLang?.startsWith('en-IN')) voice = 'en-IN-PrabhatNeural';
  else if (requestedLang?.startsWith('bn-IN')) voice = 'bn-IN-BashkarNeural';
  else if (requestedLang?.startsWith('hi-IN')) voice = 'hi-IN-MadhurNeural';
  else if (requestedLang?.startsWith('kn-IN')) voice = 'kn-IN-GaganNeural';

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
  console.log(`[NURA AI Neural Core] Running on http://localhost:${PORT}`);
});
