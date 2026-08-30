import { linesFromItems } from '../../utils/resumeImport/extractText';
import { parseResumeText } from '../../utils/resumeImport/heuristicParser';
import type { PositionedText } from '../../utils/resumeImport/types';

/** Lines top-to-bottom at a fixed x on a given page. */
const page = (n: number, lines: string[], x = 50, topY = 700, leading = 16): PositionedText[] =>
  lines.map((str, i) => ({ str, x, y: topY - i * leading, page: n }));

describe('running headers and footers', () => {
  test('a repeated name header and page footer are removed', () => {
    const items = [
      ...page(1, [
        'Nina Patel - Resume',
        'EXPERIENCE',
        'Zillow Group - Senior Data Scientist',
        'April 2020 - Present',
        'Page 1 of 2',
      ]),
      ...page(2, [
        'Nina Patel - Resume',
        'EDUCATION',
        'University of Washington',
        'MS in Statistics',
        'Page 2 of 2',
      ]),
    ];

    const lines = linesFromItems(items).split('\n').filter(Boolean);

    // The header repeats verbatim; the footer repeats once digits are masked.
    expect(lines.filter(l => l === 'Nina Patel - Resume')).toHaveLength(0);
    expect(lines.some(l => l.startsWith('Page '))).toBe(false);

    // Real content survives.
    expect(lines).toContain('EXPERIENCE');
    expect(lines).toContain('University of Washington');
  });

  test('a single-page document is never stripped', () => {
    // With one page there is nothing to compare against, and a real heading
    // would be indistinguishable from a header.
    const items = page(1, ['Nina Patel', 'EXPERIENCE', 'Acme Ltd - Engineer', 'Page 1 of 1']);
    const lines = linesFromItems(items).split('\n').filter(Boolean);
    expect(lines).toContain('Nina Patel');
    expect(lines).toContain('Page 1 of 1');
  });

  test('a line repeated in the middle of pages is not treated as a header', () => {
    const items = [
      ...page(1, ['TOP ONE', 'EXPERIENCE', 'Shared middle line', 'Acme Ltd - Engineer', 'FOOT ONE']),
      ...page(2, ['TOP TWO', 'EDUCATION', 'Shared middle line', 'Some University', 'FOOT TWO']),
    ];
    const lines = linesFromItems(items).split('\n').filter(Boolean);
    expect(lines.filter(l => l === 'Shared middle line')).toHaveLength(2);
  });
});

describe('entries split across a page break', () => {
  const jobAcrossPages = [
    ...page(1, [
      'EXPERIENCE',
      'Zillow Group - Senior Data Scientist',
      'Seattle, WA | April 2020 - Present',
      '- Built the home valuation model.',
    ]),
    ...page(2, [
      '- Led a team of four analysts.',
      '- Owned the experimentation platform.',
    ]),
  ];

  test('bullets continuing onto the next page stay in the same job', () => {
    const { content } = parseResumeText(linesFromItems(jobAcrossPages));

    expect(content.experience).toHaveLength(1);
    expect(content.experience[0].company).toBe('Zillow Group');
    // All three bullets belong to the one role.
    expect(content.experience[0].summary.split('\n')).toHaveLength(3);
    expect(content.experience[0].summary).toContain('experimentation platform');
  });

  test('a page starting a new section still gets a break', () => {
    const items = [
      ...page(1, ['EXPERIENCE', 'Acme Ltd - Engineer', '2019 - 2021', '- Did the thing.']),
      ...page(2, ['EDUCATION', 'Some University', 'BSc Computing', '2015 - 2019']),
    ];
    const { content } = parseResumeText(linesFromItems(items));
    expect(content.experience).toHaveLength(1);
    expect(content.education).toHaveLength(1);
    expect(content.education[0].institution).toBe('Some University');
  });

  test('two jobs on separate pages stay separate', () => {
    const items = [
      ...page(1, ['EXPERIENCE', 'Acme Ltd - Engineer', '2019 - 2021', '- Did the thing.']),
      ...page(2, ['Beta Corp - Analyst', '2016 - 2019', '- Did another thing.']),
    ];
    const { content } = parseResumeText(linesFromItems(items));
    expect(content.experience).toHaveLength(2);
    expect(content.experience[0].company).toBe('Acme Ltd');
    expect(content.experience[1].company).toBe('Beta Corp');
  });
});
