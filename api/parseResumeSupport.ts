// Request guards for POST /api/parse-resume.
//
// Kept out of `api/index.ts` so the fragile parts — the count-match rule and
// the rate limiter's window arithmetic — can be unit tested without standing
// up Express or calling a model.

/** Per list. The 100 KB `express.json()` body limit bounds the rest. */
export const MAX_BLOCKS = 25;
export const MAX_BLOCK_CHARS = 4000;

/** How long a provider gets before we give up and let the heuristics stand. */
export const PROVIDER_TIMEOUT_MS = 12_000;

export interface ParseResumeBlocks {
  experience: string[];
  education: string[];
}

export interface ExperienceRefinement {
  company: string;
  position: string;
  location: string;
}

export interface EducationRefinement {
  institution: string;
  degree: string;
  areaOfStudy: string;
}

export interface Refinement {
  experience: ExperienceRefinement[];
  education: EducationRefinement[];
}

const EXPERIENCE_FIELDS = ['company', 'position', 'location'] as const;
const EDUCATION_FIELDS = ['institution', 'degree', 'areaOfStudy'] as const;

/**
 * Normalise an untrusted request body into blocks we are willing to send on.
 *
 * Oversized input is truncated rather than rejected: a user with a 30-year
 * career should still get a refined import, just not an unbounded bill.
 */
export const sanitizeBlocks = (
  body: unknown
): { ok: true; blocks: ParseResumeBlocks } | { ok: false; error: string } => {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, error: 'Request body must be an object' };
  }

  const raw = (body as { blocks?: unknown }).blocks;
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, error: 'Missing blocks' };
  }

  const list = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return value
      .filter((item): item is string => typeof item === 'string')
      .map(item => item.trim())
      .filter(item => item.length > 0)
      .slice(0, MAX_BLOCKS)
      .map(item => item.slice(0, MAX_BLOCK_CHARS));
  };

  const blocks: ParseResumeBlocks = {
    experience: list((raw as { experience?: unknown }).experience),
    education: list((raw as { education?: unknown }).education),
  };

  if (blocks.experience.length === 0 && blocks.education.length === 0) {
    return { ok: false, error: 'No blocks to parse' };
  }

  return { ok: true, blocks };
};

const validateList = <T extends string>(
  value: unknown,
  expectedLength: number,
  fields: readonly T[]
): Record<T, string>[] | null => {
  if (!Array.isArray(value)) return null;
  // A model that dropped, merged or invented an entry has broken the index
  // alignment the client merges on. There is no safe partial recovery.
  if (value.length !== expectedLength) return null;

  const result: Record<T, string>[] = [];

  for (const item of value) {
    if (typeof item !== 'object' || item === null) return null;

    const entry = {} as Record<T, string>;
    for (const field of fields) {
      const fieldValue = (item as Record<string, unknown>)[field];
      if (fieldValue !== undefined && typeof fieldValue !== 'string') return null;
      entry[field] = typeof fieldValue === 'string' ? fieldValue.trim() : '';
    }
    result.push(entry);
  }

  return result;
};

/**
 * Check a model's reply against the schema and the input counts.
 *
 * Returns `null` for anything we would not want to hand a user — the caller
 * turns that into a plain failure, and the client keeps its heuristic result.
 */
export const validateRefinement = (raw: unknown, blocks: ParseResumeBlocks): Refinement | null => {
  if (typeof raw !== 'object' || raw === null) return null;

  const source = raw as { experience?: unknown; education?: unknown };

  const experience = validateList(
    source.experience ?? [],
    blocks.experience.length,
    EXPERIENCE_FIELDS
  );
  const education = validateList(
    source.education ?? [],
    blocks.education.length,
    EDUCATION_FIELDS
  );

  if (experience === null || education === null) return null;

  return { experience, education };
};

/** Pull the model's object out of a reply that may be wrapped in a code fence. */
export const parseModelJson = (text: string): unknown => {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : trimmed;

  try {
    return JSON.parse(candidate);
  } catch {
    // A model that prefixed prose still usually emits one complete object.
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start === -1 || end <= start) return null;

    try {
      return JSON.parse(candidate.slice(start, end + 1));
    } catch {
      return null;
    }
  }
};

// --- Rate limiting ---------------------------------------------------------
//
// Per IP, in memory. The app has no sign-in — every `<AuthButton />` call site
// is commented out — so an IP is the only handle a request carries.
//
// On Vercel each warm instance holds its own copy of this map, so the real
// ceiling is (instances x limit) rather than the limit. That is understood and
// accepted: it stops a scripted loop, which is the realistic threat, and the
// whole mechanism is behind `checkRateLimit` so a shared KV store can replace
// it without the route changing.

export const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
/** Bursts within the window. Generous — a user may reasonably retry a file. */
export const RATE_LIMIT_BURST = 6;
export const RATE_LIMIT_DAY_MS = 24 * 60 * 60 * 1000;
/** Bounds the worst-case daily bill from any single address. */
export const RATE_LIMIT_DAILY = 40;

/**
 * AI enhancement is per-field, so one sitting is legitimately many calls: a
 * summary, a handful of experience entries and a cover letter. The import
 * numbers above are tuned for whole-file uploads and would cut that user off,
 * so /api/ai gets its own budget under its own key prefix.
 */
export const AI_RATE_LIMIT_BURST = 15;
export const AI_RATE_LIMIT_DAILY = 60;

export interface RateLimitPolicy {
  windowMs: number;
  burst: number;
  dayMs: number;
  daily: number;
}

export const PARSE_RATE_LIMIT: RateLimitPolicy = {
  windowMs: RATE_LIMIT_WINDOW_MS,
  burst: RATE_LIMIT_BURST,
  dayMs: RATE_LIMIT_DAY_MS,
  daily: RATE_LIMIT_DAILY,
};

export const AI_RATE_LIMIT: RateLimitPolicy = {
  windowMs: RATE_LIMIT_WINDOW_MS,
  burst: AI_RATE_LIMIT_BURST,
  dayMs: RATE_LIMIT_DAY_MS,
  daily: AI_RATE_LIMIT_DAILY,
};

/** Beyond this many tracked addresses, stale entries are swept. */
const MAX_TRACKED_IPS = 10_000;

interface Bucket {
  /** Timestamps inside the rolling burst window. */
  hits: number[];
  dayStart: number;
  dayCount: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  reason?: 'burst' | 'daily';
  retryAfterSeconds?: number;
}

const sweep = (now: number) => {
  for (const [ip, bucket] of buckets) {
    const idle = bucket.hits.length === 0 || now - bucket.hits[bucket.hits.length - 1] > RATE_LIMIT_DAY_MS;
    if (idle && now - bucket.dayStart > RATE_LIMIT_DAY_MS) buckets.delete(ip);
  }
};

/**
 * `key` is the bucket identity, not necessarily a bare IP: routes with their own
 * budget prefix it (see `checkAiRateLimit`) so their counts stay separate.
 */
export const checkRateLimit = (
  key: string,
  now: number = Date.now(),
  policy: RateLimitPolicy = PARSE_RATE_LIMIT,
): RateLimitResult => {
  if (buckets.size > MAX_TRACKED_IPS) sweep(now);

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { hits: [], dayStart: now, dayCount: 0 };
    buckets.set(key, bucket);
  }

  if (now - bucket.dayStart >= policy.dayMs) {
    bucket.dayStart = now;
    bucket.dayCount = 0;
  }

  bucket.hits = bucket.hits.filter(at => now - at < policy.windowMs);

  if (bucket.dayCount >= policy.daily) {
    return {
      allowed: false,
      reason: 'daily',
      retryAfterSeconds: Math.ceil((bucket.dayStart + policy.dayMs - now) / 1000),
    };
  }

  if (bucket.hits.length >= policy.burst) {
    return {
      allowed: false,
      reason: 'burst',
      retryAfterSeconds: Math.ceil((bucket.hits[0] + policy.windowMs - now) / 1000),
    };
  }

  bucket.hits.push(now);
  bucket.dayCount += 1;

  return { allowed: true };
};

/**
 * The /api/ai budget. Prefixing the key keeps AI calls and resume imports from
 * spending each other's allowance; pairing it with AI_RATE_LIMIT here means a
 * caller cannot accidentally combine one route's key with another's limits.
 */
export const checkAiRateLimit = (ip: string, now: number = Date.now()): RateLimitResult =>
  checkRateLimit(`ai:${ip}`, now, AI_RATE_LIMIT);

/** Test seam. Never called in production. */
export const resetRateLimits = () => buckets.clear();

// --- Prompt and schema -----------------------------------------------------

export const PARSE_SYSTEM_MESSAGE = [
  'You separate resume entry headings into their parts.',
  'You never invent, translate, summarise, reorder, merge or drop entries.',
  'Return exactly one object per numbered input block, in the same order.',
  'Copy text verbatim from the block. If a part is genuinely absent, return an empty string.',
  'Return JSON only.',
].join(' ');

/**
 * Ask for the two fields the heuristics cannot resolve, and nothing else.
 *
 * Dates, bullets and skills are already settled deterministically in the
 * browser and are more reliable than a model — sending them here would trade a
 * correct answer for a plausible one.
 */
export const buildParsePrompt = (blocks: ParseResumeBlocks): string => {
  const sections: string[] = [];

  if (blocks.experience.length > 0) {
    sections.push(
      `EXPERIENCE (${blocks.experience.length} blocks — return exactly ${blocks.experience.length} objects with company, position, location):\n` +
        blocks.experience.map((block, index) => `${index + 1}. ${block}`).join('\n')
    );
  }

  if (blocks.education.length > 0) {
    sections.push(
      `EDUCATION (${blocks.education.length} blocks — return exactly ${blocks.education.length} objects with institution, degree, areaOfStudy):\n` +
        blocks.education.map((block, index) => `${index + 1}. ${block}`).join('\n')
    );
  }

  return (
    'Split each resume heading below into its parts.\n\n' +
    sections.join('\n\n') +
    '\n\nRespond with {"experience": [...], "education": [...]}, ' +
    `containing exactly ${blocks.experience.length} and ${blocks.education.length} objects respectively.`
  );
};

const stringField = { type: 'STRING' as const };

/** Gemini response schema. Constrains the model to a valid, complete object. */
export const PARSE_RESPONSE_SCHEMA = {
  type: 'OBJECT' as const,
  properties: {
    experience: {
      type: 'ARRAY' as const,
      items: {
        type: 'OBJECT' as const,
        properties: { company: stringField, position: stringField, location: stringField },
        required: ['company', 'position', 'location'],
      },
    },
    education: {
      type: 'ARRAY' as const,
      items: {
        type: 'OBJECT' as const,
        properties: { institution: stringField, degree: stringField, areaOfStudy: stringField },
        required: ['institution', 'degree', 'areaOfStudy'],
      },
    },
  },
  required: ['experience', 'education'],
};
