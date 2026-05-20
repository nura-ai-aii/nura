require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.GEMINI_API_KEY;

async function testModel(modelName) {
  console.log(`[TEST] Testing model: ${modelName}...`);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;
  
  try {
    const response = await axios.post(url, {
      contents: [{
        parts: [{ text: "Hello! Reply with a one-sentence greeting." }]
      }]
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log(`[SUCCESS] ${modelName} responded:`);
    console.log(response.data?.candidates?.[0]?.content?.parts?.[0]?.text);
    return true;
  } catch (error) {
    console.error(`[ERROR] ${modelName} failed:`, error.response?.data || error.message);
    return false;
  }
}

async function run() {
  const models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-2.5-flash"];
  for (const model of models) {
    await testModel(model);
    console.log("-----------------------------------------");
  }
}

run();
