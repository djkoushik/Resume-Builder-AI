import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenRouter } from '@openrouter/sdk';
import { GoogleGenAI } from '@google/genai';
import { calculateATSScore } from '../services/atsService.js';
import { validateAiRequest } from './aiPresets.js';
import {
  buildParsePrompt,
  checkAiRateLimit,
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

// The SPA and this function are served from one domain (see vercel.json), so
// every legitimate browser call is same-origin. Locking the allowlist down
// stops another site calling our AI endpoint from its own visitors' browsers.
// It is a speed bump, not a wall: CORS is enforced by browsers, not by curl.
const ALLOWED_ORIGINS = new Set([
  'https://buildresumenow.in',
  'https://www.buildresumenow.in',
  'http://localhost:3000', // vite dev server, pinned in vite.config.ts
]);

app.use(cors({
  origin: (origin, cb) => {
    // Same-origin browser requests and server-to-server calls send no Origin.
    if (!origin || ALLOWED_ORIGINS.has(origin)) return cb(null, true);
    return cb(null, false);
  },
}));

// Explicit rather than the 100 KB default: /api/parse-resume legitimately posts
// large blocks of extracted resume text.
app.use(express.json({ limit: '256kb' }));

// Initialize AI clients
const openRouterClient = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const geminiClient = new GoogleGenAI({
  apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY
});

// AI generation endpoint
//
// The client names one of the operations in `api/aiPresets.ts` and supplies the
// user's own text. It does NOT supply the system prompt, the temperature or the
// token ceiling: those are properties of the operation and live on the server.
// Reading any of them off req.body would turn this back into a free
// general-purpose LLM billed to our Gemini key.
app.post('/api/ai', async (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const limit = checkAiRateLimit(ip);

  if (!limit.allowed) {
    if (limit.retryAfterSeconds) res.setHeader('Retry-After', String(limit.retryAfterSeconds));
    return res.status(429).json({
      success: false,
      error: 'Too many AI requests from this address. Please try again later.',
    });
  }

  const checked = validateAiRequest(req.body);
  if (checked.ok !== true) {
    return res.status(checked.status).json({ success: false, error: checked.error });
  }

  const { operation, prompt, preset } = checked;

  // Prompt content is the user's resume, so only its shape is logged.
  console.log('📨 /api/ai', { operation, promptLength: prompt.length });

  if (!process.env.OPENROUTER_API_KEY && !process.env.API_KEY && !process.env.GEMINI_API_KEY) {
    console.error('❌ No API keys configured');
    return res.status(500).json({ success: false, error: 'AI is not configured' });
  }

  let result = '';
  let usedProvider = 'openrouter';

  // OpenRouter first: the free model absorbs the load that Gemini would bill.
  try {
    // The OpenRouter SDK takes no abort signal, so the timeout is a race.
    // The request may outlive it; the response is simply discarded.
    const response: any = await Promise.race([
      openRouterClient.chat.send({
        model: 'nex-agi/deepseek-v3.1-nex-n1:free',
        messages: [
          { role: 'system', content: preset.systemMessage },
          { role: 'user', content: prompt },
        ],
        temperature: preset.temperature,
        maxTokens: preset.maxTokens,
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

    if (!text.trim()) throw new Error('No content received from OpenRouter');
    result = text.trim();
  } catch (openRouterError: any) {
    // Every failure here lands on the provider that bills us, so the provider
    // that served each request is logged to keep that cost visible.
    console.warn('⚠️ /api/ai: OpenRouter failed, falling back to Gemini:', openRouterError?.message);
    usedProvider = 'gemini';

    try {
      const response = await geminiClient.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: prompt,
        config: {
          systemInstruction: preset.systemMessage,
          // Gemini's usable range runs past 1.0; the scaling preserves the
          // output this endpoint produced before the presets landed.
          temperature: Math.min(preset.temperature * 1.5, 1.0),
          maxOutputTokens: preset.maxTokens,
          topP: 1,
          topK: 1,
          abortSignal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
        },
      });

      result = (response.text ?? '').trim();
    } catch (geminiError: any) {
      console.error('❌ /api/ai: both providers failed', {
        operation,
        openRouter: openRouterError?.message,
        gemini: geminiError?.message,
      });
      // Generic on the wire: provider names, model IDs and quota states are
      // ours to know, not the caller's.
      return res.status(502).json({
        success: false,
        error: 'AI generation failed. Please try again.',
      });
    }
  }

  if (!result) {
    console.error('❌ /api/ai: empty completion', { operation, provider: usedProvider });
    return res.status(502).json({ success: false, error: 'AI generation failed. Please try again.' });
  }

  console.log(`✅ /api/ai served by ${usedProvider}`);
  res.json({ success: true, content: result, provider: usedProvider });
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

// Errors raised before a route runs — chiefly an oversized or malformed body
// from express.json() — otherwise reach Express's default handler, which
// answers with an HTML page carrying a stack trace and filesystem paths. Every
// route here answers in JSON, so these should too, and for the same reason the
// AI route returns a generic message: the internals are ours, not the caller's.
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (res.headersSent) return next(err);

  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ success: false, error: 'Request is too large' });
  }
  if (err?.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return res.status(400).json({ success: false, error: 'Request body is not valid JSON' });
  }

  console.error('❌ Unhandled API error:', { message: err?.message, name: err?.name, type: err?.type });
  return res.status(500).json({ success: false, error: 'Something went wrong' });
});

// Export the app for Vercel
export default app;
