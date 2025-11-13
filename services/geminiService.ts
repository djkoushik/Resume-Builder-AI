
import { GoogleGenAI } from "@google/genai";

// FIX: Removed apiKey parameter and rely on process.env.API_KEY as per guidelines.
export const enhanceTextWithGemini = async (promptText: string, instruction: string): Promise<string> => {
  // FIX: The API key must be obtained exclusively from the environment variable `process.env.API_KEY`.
  // As per guidelines, assume the API key is pre-configured and accessible.
  const apiKey = process.env.API_KEY;

  // Validate API key is present
  if (!apiKey) {
    console.error("GEMINI_API_KEY environment variable is not set. Please add GEMINI_API_KEY to your .env file.");
    return "Error: API key is not configured. Please set GEMINI_API_KEY in your .env file.";
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
      config: {
          systemInstruction: instruction,
          temperature: 0.7,
          topP: 1,
          topK: 1
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        return `Error: ${error.message}`;
    }
    return "An unknown error occurred with the AI service.";
  }
};