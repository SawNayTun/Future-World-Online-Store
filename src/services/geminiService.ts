import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export async function translateText(text: string, targetLanguage: string): Promise<string> {
  if (!ai) {
    console.warn('Gemini API key not found. Returning original text.');
    return text;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Translate the following text to ${targetLanguage}. Only return the translated text without any explanation, quotes, or markdown formatting.\n\nText: ${text}`,
    });
    return response.text?.trim() || text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}
