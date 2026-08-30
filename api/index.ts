import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenRouter } from '@openrouter/sdk';
import { GoogleGenAI } from '@google/genai';
import { calculateATSScore } from '../services/atsService.js';
import {
  buildParsePrompt,
  checkRateLimit,
  PARSE_RESPONSE_SCHEMA,
  PARSE_SYSTEM_MESSAGE,
  parseModelJson,
  PROVIDER_TIMEOUT_MS,
  sanitizeBlocks,
  validateRefinement,
  type Refinement,
} from './parseResumeSupport.js';

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
// Vercel terminates TLS ahead of this app, so the client address only
// reaches us via x-forwarded-for. Rate limiting has nothing to key on
// without it.
app.set('trust proxy', true);
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
        model: 'gemini-2.5-flash-lite',
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

// Resume import refinement endpoint.
//
// Optional accuracy only. The browser has already produced a complete resume
// by the time this is called; every failure path here is a no-op the client
// absorbs silently. Nothing downstream may become dependent on it.
//
// Provider order is inverted versus /api/ai — Gemini first — because Gemini
// can be constrained to a JSON response schema and OpenRouter's free model
// cannot. This endpoint wants a strict object; /api/ai wants prose.
app.post('/api/parse-resume', async (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const limit = checkRateLimit(ip);

  if (!limit.allowed) {
    if (limit.retryAfterSeconds) res.setHeader('Retry-After', String(limit.retryAfterSeconds));
    return res.status(429).json({
      success: false,
      error: 'Too many resume imports from this address. Please try again later.',
    });
  }

  const sanitized = sanitizeBlocks(req.body);
  if (sanitized.ok !== true) {
    return res.status(400).json({ success: false, error: sanitized.error });
  }

  const { blocks } = sanitized;

  if (!process.env.API_KEY && !process.env.GEMINI_API_KEY && !process.env.OPENROUTER_API_KEY) {
    return res.status(500).json({ success: false, error: 'No AI providers configured' });
  }

  const prompt = buildParsePrompt(blocks);

  let refined: Refinement | null = null;
  let usedProvider = 'gemini';

  // Gemini first, schema-constrained.
  try {
    const response = await geminiClient.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: {
        systemInstruction: PARSE_SYSTEM_MESSAGE,
        temperature: 0,
        responseMimeType: 'application/json',
        responseSchema: PARSE_RESPONSE_SCHEMA,
        abortSignal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      },
    });

    refined = validateRefinement(parseModelJson(response.text ?? ''), blocks);
    if (!refined) throw new Error('Gemini reply did not match the schema');
  } catch (geminiError: any) {
    console.warn('⚠️ parse-resume: Gemini failed, trying OpenRouter:', geminiError?.message);
    usedProvider = 'openrouter';

    try {
      // The OpenRouter SDK takes no abort signal, so the timeout is a race.
      // The request may outlive it; the response is simply discarded.
      const response: any = await Promise.race([
        openRouterClient.chat.send({
          model: 'nex-agi/deepseek-v3.1-nex-n1:free',
          messages: [
            { role: 'system', content: PARSE_SYSTEM_MESSAGE },
            { role: 'user', content: prompt },
          ],
          temperature: 0,
          maxTokens: 2000,
          stream: false,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('OpenRouter timed out')), PROVIDER_TIMEOUT_MS)
        ),
      ]);

      const messageContent = response.choices?.[0]?.message?.content;
      const text = Array.isArray(messageContent)
        ? messageContent.filter((item: any) => item.type === 'text').map((item: any) => item.text || '').join(' ')
        : messageContent || '';

      refined = validateRefinement(parseModelJson(text), blocks);
    } catch (openRouterError: any) {
      console.warn('⚠️ parse-resume: OpenRouter failed:', openRouterError?.message);
    }
  }

  if (!refined) {
    // Not a 500: nothing is broken for the user, we simply have nothing to add.
    return res.status(502).json({ success: false, error: 'Could not refine this resume' });
  }

  res.json({ success: true, data: refined, provider: usedProvider });
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
