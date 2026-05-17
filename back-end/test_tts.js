const { MsEdgeTTS } = require('msedge-tts');
const tts = new MsEdgeTTS();
(async () => {
  try {
    const buffer = await tts.toBuffer("Hello", { voice: 'en-US-GuyNeural' });
    console.log("SUCCESS, buffer length:", buffer.length);
    process.exit(0);
  } catch (e) {
    console.error("FAILURE:", e.message);
    process.exit(1);
  }
})();
