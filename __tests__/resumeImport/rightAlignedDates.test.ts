import { linesFromItems } from '../../utils/resumeImport/extractText';
import { parseResumeText } from '../../utils/resumeImport/heuristicParser';
import type { PositionedText } from '../../utils/resumeImport/types';

// A right-aligned date column is the most common resume layout there is, and
// PDF extraction renders the gap as a run of spaces. The date patterns used to
// accept any alphabetic run before a year, so "Meta          2021 - Present"
// parsed as a month-year range and swallowed the employer.
describe('right-aligned date columns', () => {
  const resume = [
    'Jordan Lee',
    'jordan.lee@gmail.com',
    '',
    'EXPERIENCE',
    'Meta                                    2021 - Present',
    'Product Manager',
    '- Led ads ranking experiments across three surfaces.',
    '',
    'Shopify                                 2018 - 2021',
    'Associate Product Manager',
    '- Owned the merchant onboarding funnel.',
    '',
    'EDUCATION',
    'Rice University                         2014 - 2018',
    'Bachelor of Arts, Economics',
  ].join('\n');

  const { content } = parseResumeText(resume);

  test('the employer survives the date extraction', () => {
    expect(content.experience.map(entry => entry.company)).toEqual(['Meta', 'Shopify']);
  });

  test('the role survives alongside it', () => {
    expect(content.experience.map(entry => entry.position)).toEqual([
      'Product Manager',
      'Associate Product Manager',
    ]);
  });

  test('the dates are still read', () => {
    expect(content.experience[0]).toMatchObject({ startDate: '2021', endDate: 'Present' });
    expect(content.experience[1]).toMatchObject({ startDate: '2018', endDate: '2021' });
  });

  test('an institution is not eaten by the year beside it', () => {
    expect(content.education[0].institution).toBe('Rice University');
  });

  test('a word that merely starts like a month is not a date', () => {
    const { content: other } = parseResumeText(
      ['NAME', 'name@example.com', '', 'EXPERIENCE', 'Marketing Partners      2019 - 2022', 'Director'].join('\n')
    );
    expect(other.experience[0].company).toBe('Marketing Partners');
  });

  test('a real month-year range is still recognised', () => {
    const { content: other } = parseResumeText(
      ['NAME', 'name@example.com', '', 'EXPERIENCE', 'Acme Ltd', 'Engineer', 'Jan 2020 - Dec 2022'].join('\n')
    );
    expect(other.experience[0]).toMatchObject({ startDate: 'January 2020', endDate: 'December 2022' });
  });
});

// Runs on one visual line rarely share an exact baseline. Rounding y to the
// nearest unit split a line in two whenever its runs straddled a .5 boundary,
// so whether a given PDF parsed came down to where its baselines happened to
// fall.
describe('sub-point baseline drift', () => {
  const drifted: PositionedText[] = [
    { str: 'Meta', x: 72, y: 700.0, page: 1 },
    { str: 'Product Manager', x: 160, y: 700.4, page: 1 },
    { str: 'Led ads ranking experiments.', x: 72, y: 686.0, page: 1 },
  ];

  test('runs a fraction of a point apart stay on one line', () => {
    expect(linesFromItems(drifted).split('\n')[0]).toBe('Meta Product Manager');
  });

  test('the line order follows the page, not the rounding', () => {
    expect(linesFromItems(drifted).split('\n').filter(Boolean)).toEqual([
      'Meta Product Manager',
      'Led ads ranking experiments.',
    ]);
  });

  test('genuinely separate lines are still separate', () => {
    const stacked: PositionedText[] = [
      { str: 'Acme Ltd', x: 72, y: 700, page: 1 },
      { str: 'Engineer', x: 72, y: 686, page: 1 },
    ];
    expect(linesFromItems(stacked).split('\n').filter(Boolean)).toEqual(['Acme Ltd', 'Engineer']);
  });
});
