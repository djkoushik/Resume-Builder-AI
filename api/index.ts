import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenRouter } from '@openrouter/sdk';
import { GoogleGenAI } from '@google/genai';
import { calculateATSScore } from '../services/atsService';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Also try loading .env.local if it exists (for local development variables)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
if (fs.existsSync(path.join(__dirname, '../.env.local'))) {
  const envConfig = dotenv.parse(fs.readFileSync(path.join(__dirname, '../.env.local')));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize AI clients
const openRouterClient = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const geminiClient = new GoogleGenAI({
  apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY
});

// AI generation endpoint
app.post('/api/ai', async (req, res) => {
  console.log('📨 Received AI request:', {
    hasPrompt: !!req.body.prompt,
    type: req.body.type,
    promptLength: req.body.prompt?.length
  });

  try {
    const {
      prompt,
      systemMessage = "You are a professional resume writer. Output ONLY the enhanced polished professional text. No explanations, no additional commentary.",
      temperature = 0.4,
      maxTokens = 300,
      type
    } = req.body;

    if (!prompt) {
      console.error('❌ No prompt provided');
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    // Check API key configuration
    if (!process.env.OPENROUTER_API_KEY && !process.env.API_KEY && !process.env.GEMINI_API_KEY) {
      console.error('❌ No API keys configured');
      return res.status(500).json({
        success: false,
        error: 'No AI providers configured. Please check your environment variables.'
      });
    }

    let result;
    let usedProvider = 'openrouter';

    // Try OpenRouter first
    try {
      console.log('🚀 Trying OpenRouter...');

      const response = await openRouterClient.chat.send({
        model: "nex-agi/deepseek-v3.1-nex-n1:free",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: prompt }
        ],
        temperature,
        maxTokens: maxTokens,
        stream: false
      });

      const messageContent = response.choices[0]?.message?.content;

      let contentString = "";
      if (Array.isArray(messageContent)) {
        contentString = messageContent
          .filter(item => item.type === 'text')
          .map(item => (item as any).text || '')
          .join(' ');
      } else {
        contentString = messageContent || "";
      }

      if (!contentString) {
        throw new Error("No content received from OpenRouter");
      }

      result = contentString.trim();
      console.log('✅ OpenRouter success');
    } catch (openRouterError: any) {
      console.warn("⚠️ OpenRouter failed, falling back to Gemini:", openRouterError.message);
      usedProvider = 'gemini';

      // Fallback to Gemini
      console.log('🔄 Trying Gemini fallback...');

      const response = await geminiClient.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
        config: {
          systemInstruction: systemMessage,
          temperature: Math.min(temperature * 1.5, 1.0),
          topP: 1,
          topK: 1
        }
      });

      result = response.text.trim();
      console.log('✅ Gemini success');
    }

    res.json({
      success: true,
      content: result,
      provider: usedProvider
    });

  } catch (error: any) {
    console.error("❌ AI API Error:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    res.status(500).json({
      success: false,
      error: `AI generation failed: ${error.message}`,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ATS Score endpoint
app.post('/api/ats-score', async (req, res) => {
  try {
    const { candidate, jobDescription } = req.body;

    if (!candidate || !jobDescription) {
      return res.status(400).json({ success: false, error: 'Missing candidate or jobDescription' });
    }

    const result = calculateATSScore(candidate, jobDescription);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('ATS Error:', error);
    res.status(500).json({ success: false, error: 'Failed to calculate ATS score' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    openRouterConfigured: !!process.env.OPENROUTER_API_KEY,
    geminiConfigured: !!(process.env.API_KEY || process.env.GEMINI_API_KEY)
  });
});

// Export the app for Vercel
export default app;
