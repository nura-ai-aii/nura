const axios = require('axios');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY || "AIzaSyDmKWudx27toLZXyWY4mDupXl-s_8jGl-A";

async function callGeminiModel(messages) {
  try {
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

    console.log("[DEBUG] Body sending to Gemini:", JSON.stringify(body, null, 2));

    const response = await axios.post(url, body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    console.log("[SUCCESS] Response:", JSON.stringify(response.data, null, 2));
    return response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  } catch (error) {
    console.error('[ERROR] Gemini API call failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    return null;
  }
}

const mockMessages = [
  {
    role: "system",
    content: "You are NURA AI, a sassy assistant."
  },
  {
    role: "user",
    content: "Hello, who are you?"
  }
];

callGeminiModel(mockMessages);
