// Client-side AI interface that calls secure API endpoints.
// No API keys are exposed to the browser.
//
// The request body is `{ operation, prompt }` and nothing else. The system
// prompt, the temperature and the token ceiling belong to the server, in
// `api/aiPresets.ts` — sending them from here is what let /api/ai be used as a
// general-purpose LLM. Adding an operation means adding it there first.

/** Must stay in step with AiOperation in `api/aiPresets.ts`. */
export type AiOperation = 'summary' | 'experience' | 'coverLetter';

export interface AIResponse {
  success: boolean;
  content?: string;
  error?: string;
  provider?: 'openrouter' | 'gemini';
}

/**
 * Turn a failed response into something worth showing a user.
 *
 * Every failure from /api/ai carries a JSON `error` written for a person —
 * "Prompt is too long", "AI is not configured". Reporting the status code
 * instead would tell them nothing and tell us nothing when they report it.
 */
const describeFailure = async (response: Response): Promise<string> => {
  // Metering is an expected outcome, not a fault, and deserves the more
  // specific advice: the server can only say "later", we can say how much.
  if (response.status === 429) {
    return 'You have made a lot of AI requests. Please wait a few minutes and try again.';
  }

  try {
    const result: AIResponse = await response.json();
    if (result?.error) return result.error;
  } catch {
    // Not our API answering — a proxy or gateway can still reply in HTML.
  }

  return `AI request failed (status ${response.status})`;
};

const callAi = async (operation: AiOperation, prompt: string): Promise<string> => {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operation, prompt }),
  });

  if (!response.ok) {
    throw new Error(await describeFailure(response));
  }

  const result: AIResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'AI generation failed');
  }

  if (!result.content) {
    throw new Error('No content received from AI service');
  }

  return result.content;
};

/** Polish a professional summary. */
export const enhanceSummary = async (text: string): Promise<string> =>
  callAi('summary', text);

/** Rewrite a work experience entry as achievement-focused bullets. */
export const enhanceExperience = async (text: string): Promise<string> =>
  callAi('experience', text);

/** Mirrors AI_PRESETS.coverLetter.maxPromptChars in api/aiPresets.ts. */
const COVER_LETTER_PROMPT_LIMIT = 40_000;
/** Land under the server's cap rather than exactly on it. */
const PROMPT_RESERVE = 1_000;

export interface CoverLetterTrim {
  /** True when the resume context had to be shortened to fit. */
  trimmed: boolean;
  rolesKept: number;
  rolesTotal: number;
}

/**
 * Newest first, so that the roles dropped last are the ones that matter most.
 *
 * The editor appends new entries to the end of the array and never sorts, so
 * position says nothing about recency — the dates have to be read.
 */
const byRecency = (a: any, b: any): number => {
  if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
  return String(b.endDate || b.startDate || '').localeCompare(String(a.endDate || a.startDate || ''));
};

/**
 * Fit the work experience block into `budget` characters.
 *
 * Only this block is touched: it is the one section that grows without bound,
 * and the closing instruction that tells the model what to do sits at the end
 * of the prompt, where a plain truncation would remove it.
 */
const fitExperience = (roles: any[], budget: number): { text: string; trimmed: boolean; rolesKept: number } => {
  const line = (r: any) => `${r.position} at ${r.company}: ${r.summary}`;
  const ranked = [...roles].sort(byRecency);
  let kept = ranked;
  let trimmed = false;

  const total = () => kept.map(line).join('\n').length;

  // Shorten each role's bullets before dropping any role outright: a summary
  // the model sees in brief still beats a job it never hears about.
  for (const limit of [1200, 800, 500, 300]) {
    if (total() <= budget) break;
    kept = kept.map(r => {
      if (String(r.summary || '').length <= limit) return r;
      trimmed = true;
      return { ...r, summary: String(r.summary).slice(0, limit).trimEnd() + '…' };
    });
  }

  // Only then drop the least recent roles.
  while (total() > budget && kept.length > 1) {
    kept.pop();
    trimmed = true;
  }

  // Restore the author's own ordering for the prompt itself.
  const keptIds = new Set(kept.map(r => r.id));
  const byId = new Map(kept.map(r => [r.id, r]));
  const ordered = roles.filter(r => keptIds.has(r.id)).map(r => byId.get(r.id));

  return { text: ordered.map(line).join('\n'), trimmed, rolesKept: ordered.length };
};

/**
 * Draft a cover letter body.
 *
 * The resume context below is assembled into the USER prompt: it is data the
 * model works from, not instructions telling it what to be. It is also the only
 * place resume content is sent — `resumeData` is deliberately not posted as its
 * own field, because the server never read it.
 */
export const enhanceCoverLetterWithAI = async (
  jobTitle: string,
  companyName: string,
  resumeData: any,
  bodyDraft?: string,
  onTrimmed?: (info: CoverLetterTrim) => void
): Promise<string> => {
  if (!jobTitle.trim()) {
    throw new Error("Job title is required for AI enhancement");
  }

  if (!companyName.trim()) {
    throw new Error("Company name is required for AI enhancement");
  }

  const roles: any[] = resumeData.experience || [];
  const experienceContext = roles
    .map((exp: any) => `${exp.position} at ${exp.company}: ${exp.summary}`)
    .join('\n');

  const skillsContext = resumeData.skills
    ?.map((skill: any) => `${skill.name}: ${skill.keywords?.join(', ') || ''}`)
    .join('\n') || '';

  const educationContext = resumeData.education
    ?.map((edu: any) => `${edu.degree} in ${edu.areaOfStudy} from ${edu.institution}`)
    .join('\n') || '';

  const assemble = (experienceBlock: string) => `Write a cover letter body for:

Job Title: ${jobTitle}
Company: ${companyName}
${bodyDraft ? `Current draft/focus: ${bodyDraft}` : ''}

Applicant's Background:
Professional Summary: ${resumeData.summary || ''}

Work Experience:
${experienceBlock}

Skills:
${skillsContext}

Education:
${educationContext}

Please generate compelling body content that connects the applicant's background to this specific role at ${companyName}.`;

  // The server's cap is the real boundary — a hand-rolled request bypasses
  // everything here — but users should never be the ones who hit it. The caps
  // are set well clear of any real resume, so this only engages for extremes.
  let userQuery = assemble(experienceContext);
  if (userQuery.length > COVER_LETTER_PROMPT_LIMIT - PROMPT_RESERVE) {
    const scaffolding = assemble('').length;
    const fitted = fitExperience(roles, COVER_LETTER_PROMPT_LIMIT - PROMPT_RESERVE - scaffolding);
    userQuery = assemble(fitted.text);
    onTrimmed?.({ trimmed: fitted.trimmed, rolesKept: fitted.rolesKept, rolesTotal: roles.length });
  }

  try {
    return await callAi('coverLetter', userQuery);
  } catch (error) {
    console.error("Cover letter generation error:", error);
    // Rethrown as-is: callAi's message is already the one to show, and
    // prefixing it produced "Cover letter generation failed: AI generation
    // failed."
    throw error instanceof Error ? error : new Error('Cover letter generation failed');
  }
};
