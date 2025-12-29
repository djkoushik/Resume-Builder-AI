import { OpenRouter } from '@openrouter/sdk';
import { GoogleGenAI } from '@google/genai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Initialize AI clients outside handler for potential reuse (though serverless instances may recycle)
// We access process.env inside handler or here, but env vars should be available.

const openRouterClient = new OpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
});

const geminiClient = new GoogleGenAI({
    apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

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
                // Handle multimodal content array if it occurs
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
}
