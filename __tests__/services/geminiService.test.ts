/**
 * @jest-environment jsdom
 */

import { enhanceCoverLetterWithAI } from '../../services/geminiService';
import { initialResumeData } from '../../types';

const mockResumeData = {
  ...initialResumeData,
  summary: 'Experienced software developer with 5 years in web development',
  experience: [
    {
      id: '1',
      company: 'Tech Solutions',
      position: 'Senior Developer',
      location: 'San Francisco, CA',
      startDate: 'Jan 2020',
      endDate: 'Present',
      isCurrent: true,
      summary: 'Led development of web applications using React and Node.js'
    }
  ],
  skills: [
    {
      id: '1',
      name: 'Programming Languages',
      keywords: ['JavaScript', 'TypeScript', 'Python']
    }
  ]
};

describe('geminiService', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  describe('enhanceCoverLetterWithAI', () => {
    test('throws error when job title is missing', async () => {
      await expect(
        enhanceCoverLetterWithAI('', 'Tech Corp', mockResumeData)
      ).rejects.toThrow('Job title is required for AI enhancement');
    });

    test('throws error when company name is missing', async () => {
      await expect(
        enhanceCoverLetterWithAI('Developer', '', mockResumeData)
      ).rejects.toThrow('Company name is required for AI enhancement');
    });

    test('calls AI API via fetch with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, content: 'Generated cover letter content' })
      });

      const result = await enhanceCoverLetterWithAI(
        'Software Developer',
        'Tech Corp',
        mockResumeData,
        'Draft content'
      );

      expect(mockFetch).toHaveBeenCalledWith('/api/ai', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }));

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.prompt).toContain('Software Developer');
      expect(body.operation).toBe('coverLetter');
      expect(result).toBe('Generated cover letter content');

      // The system prompt and the model parameters belong to the server, in
      // api/aiPresets.ts. Sending them from the browser is what made /api/ai a
      // general-purpose LLM proxy; the payload must stay these two fields.
      expect(Object.keys(body).sort()).toEqual(['operation', 'prompt']);
    });

    test('includes resume context in the payload', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, content: 'Generated content' })
      });

      await enhanceCoverLetterWithAI(
        'Software Developer',
        'Tech Corp',
        mockResumeData
      );

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.prompt).toContain('Software Developer');
      expect(body.prompt).toContain('Tech Corp');
      expect(body.prompt).toContain('Experienced software developer');
      expect(body.prompt).toContain('Senior Developer at Tech Solutions');
      expect(body.prompt).toContain('JavaScript, TypeScript, Python');
    });

    // The server answers every failure in JSON with a message written for a
    // person. Reporting the status code instead tells the user nothing and
    // tells us nothing when they report it.
    // The prompt caps are cost boundaries set well clear of any real resume, so
    // trimming is a safety net for extremes rather than something normal users
    // meet. See next_feature.md and api/aiPresets.ts.
    describe('oversized resumes', () => {
      const role = (id: string, endDate: string, chars: number, isCurrent = false) => ({
        id,
        company: `Company ${id}`,
        position: 'Senior Software Engineer',
        location: 'Remote',
        startDate: '2010',
        endDate,
        isCurrent,
        summary: `[role ${id}] ` + 'B'.repeat(chars),
      });

      const huge = {
        ...mockResumeData,
        // Deliberately NOT in date order: the editor appends new entries to the
        // end of the array and never sorts, so position says nothing about
        // recency. Dropping by array position would discard the current job.
        experience: [
          role('oldest', '2012', 6000),
          role('current', 'Present', 6000, true),
          role('middle', '2018', 6000),
          role('recent', '2021', 6000),
          role('ancient', '2010', 6000),
          role('older', '2014', 6000),
          role('old', '2016', 6000),
          role('newer', '2023', 6000),
        ],
      };

      const promptFor = () => JSON.parse(mockFetch.mock.calls[0][1].body).prompt as string;

      const respondOnce = () => mockFetch.mockResolvedValueOnce({
        ok: true, status: 200, json: async () => ({ success: true, content: 'letter' })
      });

      test('leaves a normal resume untouched', async () => {
        respondOnce();
        const onTrimmed = jest.fn();
        await enhanceCoverLetterWithAI('Developer', 'Tech Corp', mockResumeData, undefined, onTrimmed);

        expect(onTrimmed).not.toHaveBeenCalled();
        expect(promptFor()).toContain('Led development of web applications');
      });

      test('fits an oversized resume under the server cap', async () => {
        respondOnce();
        await enhanceCoverLetterWithAI('Developer', 'Tech Corp', huge);
        expect(promptFor().length).toBeLessThanOrEqual(40_000);
      });

      test('keeps the closing instruction, skills and education', async () => {
        respondOnce();
        await enhanceCoverLetterWithAI('Developer', 'Tech Corp', huge);
        const prompt = promptFor();

        // A plain slice() of the assembled prompt would remove all three, and
        // the last of them is the only thing telling the model what to do.
        expect(prompt).toContain('Please generate compelling body content');
        expect(prompt).toContain('Skills:');
        expect(prompt).toContain('Education:');
      });

      test('reports that it trimmed', async () => {
        respondOnce();
        const onTrimmed = jest.fn();
        await enhanceCoverLetterWithAI('Developer', 'Tech Corp', huge, undefined, onTrimmed);

        expect(onTrimmed).toHaveBeenCalledTimes(1);
        const info = onTrimmed.mock.calls[0][0];
        expect(info.trimmed).toBe(true);
        expect(info.rolesTotal).toBe(8);
        expect(info.rolesKept).toBeGreaterThan(0);
      });

      test('shortens bullets rather than dropping roles where it can', async () => {
        respondOnce();
        await enhanceCoverLetterWithAI('Developer', 'Tech Corp', huge);
        const prompt = promptFor();

        // 8 roles x 6000 chars fits at 40k once the bullets are shortened, so
        // no job should vanish from the letter.
        for (const id of ['current', 'newer', 'recent', 'ancient']) {
          expect(prompt).toContain(`[role ${id}]`);
        }
      });

      test('drops the least recent role first, not the last one entered', async () => {
        respondOnce();
        // Shortening bullets rescues even very long summaries, so roles are
        // only dropped when there are a great many of them.
        const extreme = {
          ...mockResumeData,
          experience: [
            ...Array.from({ length: 200 }, (_, i) =>
              role(`y${String(1801 + i).padStart(4, '0')}`, String(1801 + i), 900)),
            // Entered LAST, and the only current role. Array position would
            // discard it; recency must keep it.
            role('current', 'Present', 900, true),
          ],
        };
        await enhanceCoverLetterWithAI('Developer', 'Tech Corp', extreme);
        const prompt = promptFor();

        expect(prompt.length).toBeLessThanOrEqual(40_000);
        expect(prompt).toContain('[role current]');  // isCurrent outranks everything
        expect(prompt).not.toContain('[role y1801]'); // the oldest goes first
      });
    });

    test('surfaces the message the server sent', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ success: false, error: 'Prompt is too long' })
      });

      await expect(
        enhanceCoverLetterWithAI('Developer', 'Tech Corp', mockResumeData)
      ).rejects.toThrow('Prompt is too long');
    });

    test('falls back to the status when the body is not ours to read', async () => {
      // A gateway or proxy replying in HTML, not our API.
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
        json: async () => { throw new SyntaxError('Unexpected token <'); }
      });

      await expect(
        enhanceCoverLetterWithAI('Developer', 'Tech Corp', mockResumeData)
      ).rejects.toThrow('AI request failed (status 502)');
    });

    // The server meters AI calls per address, so 429 is an expected outcome and
    // needs a message the user can act on rather than a status code.
    test('explains a rate limit rather than reporting a status code', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429
      });

      await expect(
        enhanceCoverLetterWithAI('Developer', 'Tech Corp', mockResumeData)
      ).rejects.toThrow(/wait a few minutes/i);
    });

    test('handles API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false, error: 'API rate limit exceeded' })
      });

      await expect(
        enhanceCoverLetterWithAI('Developer', 'Tech Corp', mockResumeData)
      ).rejects.toThrow('API rate limit exceeded');
    });

    test('includes body draft when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, content: 'Enhanced content' })
      });

      await enhanceCoverLetterWithAI(
        'Developer',
        'Tech Corp',
        mockResumeData,
        'My draft content'
      );

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.prompt).toContain('My draft content');
      // Sent inside the prompt only. The server never read the separate
      // jobTitle/companyName/resumeData/bodyDraft fields, so posting them was
      // resume PII on the wire for nothing.
      expect(body.bodyDraft).toBeUndefined();
      expect(body.resumeData).toBeUndefined();
    });

    test('handles empty resume data gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, content: 'Generated content' })
      });

      const emptyResumeData = {
        ...initialResumeData,
        experience: [],
        skills: [],
        education: []
      };

      const result = await enhanceCoverLetterWithAI(
        'Developer',
        'Tech Corp',
        emptyResumeData
      );

      expect(result).toBe('Generated content');
      expect(mockFetch).toHaveBeenCalled();
    });

    test('trims whitespace from required fields', async () => {
      await expect(
        enhanceCoverLetterWithAI('  ', 'Tech Corp', mockResumeData)
      ).rejects.toThrow('Job title is required for AI enhancement');

      await expect(
        enhanceCoverLetterWithAI('Developer', '  ', mockResumeData)
      ).rejects.toThrow('Company name is required for AI enhancement');
    });
  });
});