import { parseResumeText } from '../../utils/resumeImport/heuristicParser';

const parse = (lines: string[]) =>
  parseResumeText(['Nina Patel', 'nina@example.com', '', 'WORK EXPERIENCE', '', ...lines].join('\n'))
    .content.experience;

describe('heading layouts', () => {
  const layouts: Array<[string, string[]]> = [
    ['Company - Title, then location | dates', ['Acme Ltd - Senior Engineer', 'San Francisco, CA | Jan 2019 - Present']],
    ['Title | Company | Location | Dates', ['Senior Engineer | Acme Inc. | San Francisco, CA | Jan 2019 - Present']],
    ['Company / Title / Location / Dates stacked', ['Acme Ltd', 'Senior Engineer', 'San Francisco, CA', 'Jan 2019 - Present']],
    ['Title, Company', ['Senior Engineer, Acme Ltd', 'Jan 2019 - Present']],
    ['Company, Title', ['Acme Ltd, Senior Engineer', 'Jan 2019 - Present']],
    ['Title at Company', ['Senior Engineer at Acme Ltd', 'Jan 2019 - Present']],
    ['right-aligned date on the company line', ['Acme Ltd                    Jan 2019 - Present', 'Senior Engineer']],
  ];

  test.each(layouts)('%s', (_label, lines) => {
    const [entry] = parse([...lines, '- Did a thing.']);
    expect(entry.company).toBe(lines[0].includes('Inc.') ? 'Acme Inc.' : 'Acme Ltd');
    expect(entry.position).toBe('Senior Engineer');
    expect(entry.startDate).toBe('January 2019');
  });

  test('a suffix-less employer is not swallowed by the location', () => {
    // "Stripe, San Francisco, CA" has no company marker and no title word, so
    // the whole thing used to be read as a location and the employer vanished.
    const [entry] = parse(['Stripe, San Francisco, CA', 'Backend Engineer', '2019 - 2021']);
    expect(entry.company).toBe('Stripe');
    expect(entry.location).toBe('San Francisco, CA');
    expect(entry.position).toBe('Backend Engineer');
  });

  test('a title containing a comma is not split', () => {
    const [entry] = parse(['Engineer, Backend Systems | Acme Ltd | 2019 - 2021']);
    expect(entry.position).toBe('Engineer, Backend Systems');
    expect(entry.company).toBe('Acme Ltd');
  });

  test('a company containing a comma is not split', () => {
    const [entry] = parse(['Acme Technologies, Inc. - Engineer', '2019 - 2021']);
    expect(entry.company).toBe('Acme Technologies, Inc.');
    expect(entry.position).toBe('Engineer');
  });

  test('"Remote" counts as a location', () => {
    const [entry] = parse(['Acme Ltd - Engineer | Remote | 2019 - 2021']);
    expect(entry.location).toBe('Remote');
    expect(entry.company).toBe('Acme Ltd');
  });
});

describe('descriptions', () => {
  test('a bullet wrapped onto a second line stays one bullet', () => {
    // The wrapped remainder used to become a second job whose company was the
    // tail of the sentence.
    const entries = parse([
      'Acme Ltd - Engineer', '2019 - 2021',
      '- A very long achievement that',
      'wrapped onto a second line.',
    ]);

    expect(entries).toHaveLength(1);
    expect(entries[0].summary).toBe('* A very long achievement that wrapped onto a second line.');
  });

  test('a prose description instead of bullets is kept', () => {
    // Previously dropped entirely: only bullet lines reached the summary.
    const [entry] = parse([
      'Acme Ltd - Engineer', '2019 - 2021',
      'Led the platform team and shipped three products.',
    ]);
    expect(entry.summary).toBe('Led the platform team and shipped three products.');
  });

  test('an indented sub-bullet is kept', () => {
    const [entry] = parse(['Acme Ltd - Engineer', '2019 - 2021', '- A.', '  - A sub point.', '- B.']);
    expect(entry.summary.split('\n')).toHaveLength(3);
  });
});

describe('multiple roles', () => {
  test('a promotion inherits the employer above it', () => {
    // A promotion block lists only the new title.
    const entries = parse([
      'Acme Ltd', 'Senior Engineer', '2021 - Present', '- A.', '',
      'Engineer', '2019 - 2021', '- B.',
    ]);

    expect(entries).toHaveLength(2);
    expect(entries[0].company).toBe('Acme Ltd');
    expect(entries[1].company).toBe('Acme Ltd');
    expect(entries[1].position).toBe('Engineer');
  });

  test('two suffix-less employers stay separate', () => {
    const entries = parse([
      'Google', 'Software Engineer', '2021 - Present', '- A.', '',
      'Stripe', 'Backend Engineer', '2019 - 2021', '- B.',
    ]);
    expect(entries.map(e => e.company)).toEqual(['Google', 'Stripe']);
  });
});

describe('date formats', () => {
  const dates: Array<[string, string, string, boolean]> = [
    ['Jan 2019 - Present', 'January 2019', 'Present', true],
    ['Jan 2019 - present', 'January 2019', 'Present', true],
    ['January 2019 to March 2021', 'January 2019', 'March 2021', false],
    ["Jan '19 - Mar '21", 'January 2019', 'March 2021', false],
    ['01/2019 - 12/2021', 'January 2019', 'December 2021', false],
    ['2019 - 2021', '2019', '2021', false],
  ];

  test.each(dates)('%s', (raw, start, end, current) => {
    const [entry] = parse(['Acme Ltd - Engineer', raw, '- Did a thing.']);
    expect(entry.startDate).toBe(start);
    expect(entry.endDate).toBe(end);
    expect(entry.isCurrent).toBe(current);
    // The ATS scorer runs new Date() over these.
    expect(Number.isNaN(new Date(entry.startDate).getTime())).toBe(false);
  });
});
