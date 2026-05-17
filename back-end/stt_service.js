const fs = require('fs');
const path = require('path');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Transcribes an audio buffer using Groq Whisper Large v3 Turbo (Ultra-fast).
 * @param {Buffer} audioBuffer - The raw audio data.
 * @param {string} mimeType - The MIME type of the audio.
 * @param {string} language - The BCP-47 language code.
 * @returns {Promise<string>} The transcribed text.
 */
async function transcribeAudio(audioBuffer, mimeType, language) {
  let ext = 'webm';
  if (mimeType && mimeType.includes('ogg')) ext = 'ogg';
  if (mimeType && mimeType.includes('mp4')) ext = 'mp4';
  if (mimeType && mimeType.includes('wav')) ext = 'wav';

  const tempPath = path.join(__dirname, `temp_audio_${Date.now()}.${ext}`);
  fs.writeFileSync(tempPath, audioBuffer);

  try {
    console.log(`[STT] Processing audio with Groq Whisper Ultra-Fast (${language})...`);
    
    const langCode = language ? language.split('-')[0] : 'en';
    
    // Whisper-large-v3-turbo is currently the fastest high-accuracy model
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(tempPath),
      model: 'whisper-large-v3-turbo',
      language: langCode,
      response_format: 'verbose_json',
      temperature: 0.0, // Best for factual transcription
    });

    if (transcription && transcription.text) {
      console.log(`[STT] Result: "${transcription.text}"`);
      return transcription.text;
    }

    return '';

  } catch (error) {
    console.error('[STT] Groq Transcription Error:', error.message);
    return '';
  } finally {
    try {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch (e) {
      console.error('[STT] Cleanup error:', e.message);
    }
  }
}

module.exports = { transcribeAudio };
