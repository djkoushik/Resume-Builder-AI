import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        openRouterConfigured: !!process.env.OPENROUTER_API_KEY,
        geminiConfigured: !!(process.env.API_KEY || process.env.GEMINI_API_KEY)
    });
}
