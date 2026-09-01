// Server-owned prompt registry for POST /api/ai.
//
// The system prompt, the temperature and the token ceiling are properties of
// the OPERATION, not of the request. The client names an operation; the server
// decides everything else. That is what stops /api/ai being a general-purpose
// LLM proxy: there is no filtering of a caller-supplied `systemMessage`, the
// field is simply never read.
//
// Adding an operation means adding an entry here AND to AiOperation in
// utils/aiClient.ts. Never accept a prompt template from the client.

export type AiOperation = 'summary' | 'experience' | 'coverLetter';

export interface AiPreset {
  readonly systemMessage: string;
  readonly temperature: number;
  readonly maxTokens: number;
  /**
   * Longest user text this operation can legitimately need, in characters.
   *
   * This is a cost boundary, not a model limit: gemini-2.5-flash-lite accepts
   * around a million tokens, so even the largest value here uses a fraction of
   * a percent of it. Set it well clear of any real resume — a cap that rejects
   * genuine users is a bug, and output tokens are the expensive half anyway.
   */
  readonly maxPromptChars: number;
}

/**
 * The three operations the product actually performs. The prompts are the ones
 * that used to be authored in the React components — moving them here is the
 * whole point, so they must not be edited in passing.
 *
 * Frozen because validateAiRequest hands the preset out by reference and this
 * module is shared by every request on a warm serverless instance: an
 * accidental write in a handler would re-tune the model parameters for every
 * later user on that instance, not just the one request.
 */
export const AI_PRESETS: Record<AiOperation, AiPreset> = Object.freeze({
  summary: {
    systemMessage:
      'You are a professional resume writer. Improve the following summary to be more ' +
      'impactful and concise for a job application. Return only the improved text.',
    temperature: 0.7,
    maxTokens: 400,
    maxPromptChars: 8_000,
  },
  experience: {
    systemMessage:
      'You are a professional resume writer. Rewrite the following work experience ' +
      'summary using action verbs and focusing on achievements. Return only the improved ' +
      'text, formatted with markdown for bullet points (e.g., * Point 1).',
    temperature: 0.7,
    maxTokens: 400,
    maxPromptChars: 8_000,
  },
  coverLetter: {
    systemMessage:
      'You are an expert career consultant and professional writer. Draft a compelling, ' +
      'professional cover letter body for the applicant. The tone should be enthusiastic ' +
      "yet professional, highlighting how the applicant's experience aligns with the " +
      'desired role.\n\nKey requirements:\n' +
      '- Output ONLY the body paragraphs (no salutation or closing)\n' +
      '- Keep it to 2-3 paragraphs maximum\n' +
      '- Be specific about relevant experience and skills\n' +
      '- Show enthusiasm for the role and company\n' +
      '- Maintain professional tone throughout\n' +
      '- Make it personalized to the job and company',
    temperature: 0.6,
    maxTokens: 500,
    // The cover-letter prompt embeds the whole resume, so it is legitimately
    // the largest. 12k rejected a real profile: eight roles with detailed
    // bullets came to 13.4k characters.
    maxPromptChars: 40_000,
  },
} satisfies Record<AiOperation, AiPreset>);

for (const preset of Object.values(AI_PRESETS)) Object.freeze(preset);

/** Narrow an untrusted value to a known operation name. */
export const isAiOperation = (v: unknown): v is AiOperation =>
  typeof v === 'string' && Object.prototype.hasOwnProperty.call(AI_PRESETS, v);

export type AiRequestCheck =
  | { ok: true; operation: AiOperation; prompt: string; preset: AiPreset }
  | { ok: false; status: 400; error: string };

/**
 * Validate an /api/ai body.
 *
 * The ONLY caller-supplied values are `operation` and `prompt`. `systemMessage`,
 * `temperature` and `maxTokens` are deliberately not named anywhere below, so a
 * caller cannot reach the model parameters even by accident. Callers get the
 * preset back; they must not fall back to the request for any of it.
 */
export const validateAiRequest = (body: unknown): AiRequestCheck => {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, status: 400, error: 'Request body must be an object' };
  }

  const { operation, prompt } = body as Record<string, unknown>;

  if (!isAiOperation(operation)) {
    return { ok: false, status: 400, error: 'Unknown operation' };
  }
  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    return { ok: false, status: 400, error: 'Prompt is required' };
  }

  const preset = AI_PRESETS[operation];
  if (prompt.length > preset.maxPromptChars) {
    return { ok: false, status: 400, error: 'This text is too long to enhance. Please shorten it and try again.' };
  }

  return { ok: true, operation, prompt, preset };
};
