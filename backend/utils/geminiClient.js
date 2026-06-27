const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const generateWithFallback = async (contents, config) => {
  const delays = [2000, 5000, 10000];
  let currentModel = 'gemini-2.5-flash';

  for (let attempt = 0; attempt <= 3; attempt++) {
    try {
      const res = await ai.models.generateContent({
        model: currentModel,
        contents,
        config
      });
      return res;
    } catch (error) {
      console.warn(`[Gemini API Error] Attempt ${attempt + 1} failed. Model: ${currentModel}. Error:`, error.message);
      
      // On failure, switch to the reliable fallback model
      currentModel = 'gemini-1.5-flash';

      if (attempt === 3) {
        // After 3 retries (4 total attempts), throw graceful error
        throw new Error("AI agents are experiencing high demand. Please retry in a few moments.");
      }

      // If it's a rate limit or overloaded error, wait and retry
      if (error.status === 503 || error.status === 429 || error.message.includes('503') || error.message.includes('429') || error.message.includes('quota') || error.message.includes('demand')) {
        await new Promise(resolve => setTimeout(resolve, delays[attempt]));
      } else {
        // If it's another error (like 400 Bad Request), throw immediately
        throw new Error("AI agents are experiencing high demand. Please retry in a few moments.");
      }
    }
  }
};

module.exports = { generateWithFallback };
