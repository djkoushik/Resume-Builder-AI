// The acceptance criterion for Phase 2: when refinement fails in any way, the
// Phase 1 result must come back untouched. Most of these tests assert that
// nothing happened.

import { refineWithAI } from '../../utils/resumeImport/aiRefine';
import type { ImportedContent, ParsedResume } from '../../utils/resumeImport/types';

const emptyContent = (): ImportedContent => ({
  basics: {
    name: 'Priya Sharma',
    headline: '',
    photo: '',
    email: 'priya@example.com',
    phone: '+91 98765 43210',
    website: '',
    location: 'Bengaluru',
  },
  summary: '',
  profiles: [],
  experience: [],
  education: [],
  skills: [],
  languages: [],
  certifications: [],
  projects: [],
  interests: [],
  references: '',
});

const experienceEntry = (overrides: Partial<ImportedContent['experience'][number]> = {}) => ({
  id: '1',
  company: 'Stripe',
  position: 'San Francisco, CA',
  location: '',
  startDate: 'January 2019',
  endDate: 'March 2021',
  isCurrent: false,
  summary: '* Did the thing',
  ...overrides,
});

const parsedFixture = (): ParsedResume => ({
  content: {
    ...emptyContent(),
    experience: [experienceEntry()],
  },
  lowConfidence: ['experience.0.company', 'experience.0.position'],
  warnings: [],
  rawHeadings: { experience: { 0: 'Stripe, San Francisco, CA | Senior Engineer' }, education: {} },
});

const mockFetch = jest.fn();

beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch as unknown as typeof fetch;
});

const ok = (data: unknown) => ({
  ok: true,
  json: async () => ({ success: true, data }),
});

describe('refineWithAI — when it works', () => {
  it('overwrites only the flagged fields and clears their guess flags', async () => {
    mockFetch.mockResolvedValue(
      ok({ experience: [{ company: 'Stripe', position: 'Senior Engineer', location: 'San Francisco, CA' }], education: [] })
    );

    const result = await refineWithAI(parsedFixture());

    expect(result.content.experience[0]).toMatchObject({
      company: 'Stripe',
      position: 'Senior Engineer',
      location: 'San Francisco, CA',
      // Dates and bullets are resolved deterministically and must not be touched.
      startDate: 'January 2019',
      endDate: 'March 2021',
      summary: '* Did the thing',
      id: '1',
    });
    expect(result.lowConfidence).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it('sends only the flagged heading text, never contact details', async () => {
    mockFetch.mockResolvedValue(ok({ experience: [{ company: 'Stripe', position: 'Senior Engineer', location: '' }], education: [] }));

    await refineWithAI(parsedFixture());

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/parse-resume');

    const body = JSON.parse(init.body);
    expect(body).toEqual({ blocks: { experience: ['Stripe, San Francisco, CA | Senior Engineer'], education: [] } });

    const serialised = init.body as string;
    expect(serialised).not.toContain('Priya Sharma');
    expect(serialised).not.toContain('priya@example.com');
    expect(serialised).not.toContain('98765');
    expect(serialised).not.toContain('Bengaluru');
  });

  it('keeps the heuristic value when the model returns an empty field', async () => {
    mockFetch.mockResolvedValue(ok({ experience: [{ company: '', position: 'Senior Engineer', location: '' }], education: [] }));

    const result = await refineWithAI(parsedFixture());
    expect(result.content.experience[0].company).toBe('Stripe');
    expect(result.content.experience[0].position).toBe('Senior Engineer');
  });

  it('merges onto the right entry when only a later one was flagged', async () => {
    const parsed: ParsedResume = {
      content: {
        ...emptyContent(),
        experience: [
          experienceEntry({ id: '0', company: 'Acme Inc.', position: 'Engineer' }),
          experienceEntry({ id: '1', company: 'Globex', position: 'Berlin, DE' }),
        ],
      },
      lowConfidence: ['experience.1.company', 'experience.1.position'],
      warnings: [],
      rawHeadings: { experience: { 1: 'Globex, Berlin, DE | Staff Engineer' }, education: {} },
    };

    mockFetch.mockResolvedValue(ok({ experience: [{ company: 'Globex', position: 'Staff Engineer', location: 'Berlin, DE' }], education: [] }));

    const result = await refineWithAI(parsed);
    expect(result.content.experience[0]).toMatchObject({ company: 'Acme Inc.', position: 'Engineer' });
    expect(result.content.experience[1]).toMatchObject({ company: 'Globex', position: 'Staff Engineer' });
  });
});

describe('refineWithAI — when there is nothing to do', () => {
  it('makes no request when the parser was confident throughout', async () => {
    const parsed: ParsedResume = {
      content: { ...emptyContent(), experience: [experienceEntry()] },
      lowConfidence: [],
      warnings: [],
      rawHeadings: { experience: {}, education: {} },
    };

    const result = await refineWithAI(parsed);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(result).toBe(parsed);
    expect(result.warnings).toEqual([]);
  });

  it('makes no request when the parser recorded no headings at all', async () => {
    const parsed: ParsedResume = { content: emptyContent(), lowConfidence: [], warnings: [] };
    expect(await refineWithAI(parsed)).toBe(parsed);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe('refineWithAI — every failure path keeps Phase 1 intact', () => {
  const unchanged = (result: ParsedResume) => {
    expect(result.content.experience[0]).toMatchObject({ company: 'Stripe', position: 'San Francisco, CA' });
    expect(result.lowConfidence).toEqual(['experience.0.company', 'experience.0.position']);
    expect(result.warnings).toContain('ai-unavailable');
  };

  it('survives a network error', async () => {
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));
    unchanged(await refineWithAI(parsedFixture()));
  });

  it('survives a timeout', async () => {
    mockFetch.mockRejectedValue(Object.assign(new Error('signal timed out'), { name: 'TimeoutError' }));
    unchanged(await refineWithAI(parsedFixture()));
  });

  it('survives a non-200 response', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 502, json: async () => ({ success: false, error: 'nope' }) });
    unchanged(await refineWithAI(parsedFixture()));
  });

  it('survives being rate limited', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 429, json: async () => ({ success: false, error: 'Too many' }) });
    unchanged(await refineWithAI(parsedFixture()));
  });

  it('survives a body that is not JSON', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => { throw new SyntaxError('Unexpected token <'); } });
    unchanged(await refineWithAI(parsedFixture()));
  });

  it('survives success:false', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ success: false, error: 'Could not refine' }) });
    unchanged(await refineWithAI(parsedFixture()));
  });

  it('survives a reply with no data', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    unchanged(await refineWithAI(parsedFixture()));
  });

  // A count mismatch means the model dropped, merged or invented an entry, so
  // index alignment is gone. Discarding the whole reply is the only safe move.
  it('discards a reply whose entry count does not match', async () => {
    mockFetch.mockResolvedValue(
      ok({
        experience: [
          { company: 'Stripe', position: 'Senior Engineer', location: '' },
          { company: 'Invented Corp', position: 'Nobody', location: '' },
        ],
        education: [],
      })
    );
    unchanged(await refineWithAI(parsedFixture()));
  });

  it('does not add the warning twice', async () => {
    mockFetch.mockRejectedValue(new Error('offline'));
    const parsed = parsedFixture();
    const once = await refineWithAI(parsed);
    const twice = await refineWithAI(once);
    expect(twice.warnings.filter(w => w === 'ai-unavailable')).toHaveLength(1);
  });
});
