// Vercel routes /api/<name> to api/<name>.ts. There is no api/parse-resume.ts
// entry in the rewrite table that ever worked — /api/(.*) pointed at
// "/api/index.js", a path no function is published at — so this route answered
// 405 in production and the import's optional AI refinement never ran once.
//
// The implementation stays in api/index.ts, where the route lives alongside the
// others and the local dev server can serve it. This file only makes Vercel
// publish that app at this path; Express reads the real request URL and matches
// its own `app.post('/api/parse-resume')`.
export { default } from './index.js';
