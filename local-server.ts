import app from './api/index';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`🚀 AI API Server running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🤖 AI endpoint: http://localhost:${PORT}/api/ai`);

    // Log configuration status
    console.log(`🔑 OpenRouter configured: ${!!process.env.OPENROUTER_API_KEY}`);
    console.log(`🔑 Gemini configured: ${!!(process.env.API_KEY || process.env.GEMINI_API_KEY)}`);
});
