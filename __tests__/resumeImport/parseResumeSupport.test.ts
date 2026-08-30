import {
  buildParsePrompt,
  checkRateLimit,
  MAX_BLOCKS,
  MAX_BLOCK_CHARS,
  parseModelJson,
  RATE_LIMIT_BURST,
  RATE_LIMIT_DAILY,
  RATE_LIMIT_DAY_MS,
  RATE_LIMIT_WINDOW_MS,
  resetRateLimits,
  sanitizeBlocks,
  validateRefinement,
  type ParseResumeBlocks,
} from '../../api/parseResumeSupport';

const blocks = (experience: string[] = [], education: string[] = []): ParseResumeBlocks => ({
  experience,
  education,
});

describe('sanitizeBlocks', () => {
  it('accepts a well-formed body', () => {
    const result = sanitizeBlocks({ blocks: { experience: ['Acme Inc. Engineer'], education: [] } });
    expect(result).toEqual({ ok: true, blocks: blocks(['Acme Inc. Engineer'], []) });
  });

  it('rejects a body that is not an object', () => {
    expect(sanitizeBlocks(null).ok).toBe(false);
    expect(sanitizeBlocks('blocks').ok).toBe(false);
    expect(sanitizeBlocks({}).ok).toBe(false);
  });

  it('rejects a request with nothing to parse', () => {
    expect(sanitizeBlocks({ blocks: { experience: [], education: [] } }).ok).toBe(false);
    expect(sanitizeBlocks({ blocks: { experience: ['   '] } }).ok).toBe(false);
  });

  it('drops non-string entries rather than failing', () => {
    const result = sanitizeBlocks({ blocks: { experience: ['Acme', 42, null, { a: 1 }] } });
    expect(result).toMatchObject({ ok: true, blocks: { experience: ['Acme'] } });
  });

  // Truncating rather than rejecting: a 30-year career still imports.
  it('truncates an over-long block instead of rejecting it', () => {
    const result = sanitizeBlocks({ blocks: { experience: ['x'.repeat(MAX_BLOCK_CHARS + 500)] } });
    expect(result).toMatchObject({ ok: true });
    if (result.ok) expect(result.blocks.experience[0]).toHaveLength(MAX_BLOCK_CHARS);
  });

  it('caps the number of blocks', () => {
    const many = Array.from({ length: MAX_BLOCKS + 10 }, (_, i) => `Role ${i}`);
    const result = sanitizeBlocks({ blocks: { experience: many } });
    if (result.ok) expect(result.blocks.experience).toHaveLength(MAX_BLOCKS);
  });
});

describe('validateRefinement', () => {
  const input = blocks(['Acme Inc. Engineer'], ['MIT BSc']);

  it('accepts a matching reply', () => {
    const result = validateRefinement(
      {
        experience: [{ company: 'Acme Inc.', position: 'Engineer', location: '' }],
        education: [{ institution: 'MIT', degree: 'BSc', areaOfStudy: '' }],
      },
      input
    );
    expect(result).toEqual({
      experience: [{ company: 'Acme Inc.', position: 'Engineer', location: '' }],
      education: [{ institution: 'MIT', degree: 'BSc', areaOfStudy: '' }],
    });
  });

  // The client merges by index. A dropped or invented entry silently shifts
  // every later job onto the wrong employer, so there is no partial recovery.
  it('rejects a reply with the wrong number of entries', () => {
    expect(validateRefinement({ experience: [], education: [{ institution: 'MIT', degree: 'BSc', areaOfStudy: '' }] }, input)).toBeNull();
    expect(
      validateRefinement(
        {
          experience: [
            { company: 'Acme', position: 'Engineer', location: '' },
            { company: 'Extra', position: 'Invented', location: '' },
          ],
          education: [{ institution: 'MIT', degree: 'BSc', areaOfStudy: '' }],
        },
        input
      )
    ).toBeNull();
  });

  it('rejects non-string fields and non-object entries', () => {
    expect(validateRefinement({ experience: [{ company: 42, position: 'Engineer', location: '' }], education: [{ institution: 'MIT', degree: 'BSc', areaOfStudy: '' }] }, input)).toBeNull();
    expect(validateRefinement({ experience: ['Acme Inc. Engineer'], education: [{ institution: 'MIT', degree: 'BSc', areaOfStudy: '' }] }, input)).toBeNull();
    expect(validateRefinement('not an object', input)).toBeNull();
    expect(validateRefinement(null, input)).toBeNull();
  });

  it('fills a missing field with an empty string rather than failing', () => {
    const result = validateRefinement({ experience: [{ company: 'Acme Inc.' }], education: [] }, blocks(['Acme Inc.']));
    expect(result?.experience[0]).toEqual({ company: 'Acme Inc.', position: '', location: '' });
  });

  it('treats an absent array as empty when no blocks were sent', () => {
    expect(validateRefinement({ experience: [{ company: 'A', position: 'B', location: '' }] }, blocks(['A B']))).toEqual({
      experience: [{ company: 'A', position: 'B', location: '' }],
      education: [],
    });
  });
});

describe('parseModelJson', () => {
  it('parses plain JSON', () => {
    expect(parseModelJson('{"experience":[]}')).toEqual({ experience: [] });
  });

  // OpenRouter's free model has no schema guarantee and fences its output.
  it('parses JSON wrapped in a code fence', () => {
    expect(parseModelJson('```json\n{"experience":[]}\n```')).toEqual({ experience: [] });
    expect(parseModelJson('```\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it('recovers an object buried in prose', () => {
    expect(parseModelJson('Sure! Here it is: {"a":1} Hope that helps.')).toEqual({ a: 1 });
  });

  it('returns null for unparseable text', () => {
    expect(parseModelJson('I could not do that.')).toBeNull();
    expect(parseModelJson('')).toBeNull();
  });
});

describe('checkRateLimit', () => {
  beforeEach(resetRateLimits);

  it('allows a burst up to the limit and then refuses', () => {
    const now = 1_000_000;
    for (let i = 0; i < RATE_LIMIT_BURST; i += 1) {
      expect(checkRateLimit('1.2.3.4', now + i).allowed).toBe(true);
    }
    const refused = checkRateLimit('1.2.3.4', now + RATE_LIMIT_BURST);
    expect(refused.allowed).toBe(false);
    expect(refused.reason).toBe('burst');
    expect(refused.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('keeps addresses independent', () => {
    const now = 1_000_000;
    for (let i = 0; i < RATE_LIMIT_BURST; i += 1) checkRateLimit('1.2.3.4', now + i);
    expect(checkRateLimit('5.6.7.8', now).allowed).toBe(true);
  });

  it('lets the burst window roll off', () => {
    const now = 1_000_000;
    for (let i = 0; i < RATE_LIMIT_BURST; i += 1) checkRateLimit('1.2.3.4', now + i);
    expect(checkRateLimit('1.2.3.4', now + RATE_LIMIT_BURST).allowed).toBe(false);
    expect(checkRateLimit('1.2.3.4', now + RATE_LIMIT_WINDOW_MS + 1).allowed).toBe(true);
  });

  // The burst window alone lets a patient script run all day. The daily cap
  // is what actually bounds the bill.
  it('enforces a daily cap across windows', () => {
    let now = 1_000_000;
    let allowed = 0;

    for (let i = 0; i < RATE_LIMIT_DAILY + 10; i += 1) {
      if (checkRateLimit('1.2.3.4', now).allowed) allowed += 1;
      now += RATE_LIMIT_WINDOW_MS + 1;
    }

    expect(allowed).toBe(RATE_LIMIT_DAILY);
    expect(checkRateLimit('1.2.3.4', now).reason).toBe('daily');
  });

  it('resets the daily cap after a day', () => {
    const now = 1_000_000;
    for (let i = 0; i < RATE_LIMIT_DAILY; i += 1) {
      checkRateLimit('1.2.3.4', now + i * (RATE_LIMIT_WINDOW_MS + 1));
    }
    expect(checkRateLimit('1.2.3.4', now + RATE_LIMIT_DAY_MS - 1).allowed).toBe(false);
    expect(checkRateLimit('1.2.3.4', now + RATE_LIMIT_DAY_MS + 1).allowed).toBe(true);
  });
});

describe('buildParsePrompt', () => {
  it('states the expected count for each section', () => {
    const prompt = buildParsePrompt(blocks(['A', 'B'], ['C']));
    expect(prompt).toContain('EXPERIENCE (2 blocks');
    expect(prompt).toContain('EDUCATION (1 blocks');
    expect(prompt).toContain('exactly 2 and 1 objects');
  });

  it('omits a section with no blocks', () => {
    const prompt = buildParsePrompt(blocks(['A'], []));
    expect(prompt).not.toContain('EDUCATION (');
  });

  it('numbers the blocks so replies can be aligned', () => {
    expect(buildParsePrompt(blocks(['First', 'Second']))).toContain('1. First\n2. Second');
  });
});
