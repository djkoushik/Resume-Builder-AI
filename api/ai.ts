// See api/parse-resume.ts. This file used to carry a second, older
// implementation of /api/ai — the one that read systemMessage, temperature and
// maxTokens straight off the request body. Because Vercel serves the function
// file in preference to the app, that older handler is what production ran, and
// the lockdown added to api/index.ts never took effect.
export { default } from './index.js';
