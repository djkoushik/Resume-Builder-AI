// Bullet markers a Word export actually produces.
//
// Regression for an import where every achievement in a role collapsed into one
// run-on paragraph. The document used U+25CF, which the old character class did
// not list, so `parseExperienceEntry` sent the lines down the prose branch and
// `splitDatedEntries` lost the boundary between two jobs.

import { isBulletLine, renderEntryBody, stripBulletMarker } from '../../utils/resumeImport/normalize';
import { splitDatedEntries } from '../../utils/resumeImport/sectionSplitter';
import { parseResumeText } from '../../utils/resumeImport/heuristicParser';

describe('bullet marker recognition', () => {
  const markers: Array<[string, string]> = [
    ['U+2022 bullet', '•'],
    ['U+25CF black circle', '●'],
    ['U+25AA black small square', '▪'],
    ['U+25E6 white bullet', '◦'],
    ['U+2043 hyphen bullet', '⁃'],
    ['U+2219 bullet operator', '∙'],
    ['U+00B7 middle dot', '·'],
    ['U+25BA black right pointer', '►'],
    ['U+27A4 black arrowhead', '➤'],
    ['U+F0B7 Word Symbol bullet', ''],
    ['U+F0A7 Wingdings square', ''],
    ['U+F0FC Wingdings check', ''],
    ['asterisk', '*'],
    ['hyphen', '-'],
    ['en dash', '–'],
  ];

  it.each(markers)('recognises %s', (_label, marker) => {
    const line = `${marker} Built a retrieval pipeline`;
    expect(isBulletLine(line)).toBe(true);
    expect(stripBulletMarker(line)).toBe('Built a retrieval pipeline');
  });

  it('accepts a marker with no separating space', () => {
    expect(isBulletLine('●Built a retrieval pipeline')).toBe(true);
  });

  it('accepts a doubled marker', () => {
    expect(stripBulletMarker('●- Built it')).toBe('Built it');
  });

  // A marker with no space is only a bullet when a word follows it, so the
  // no-space form cannot swallow the open end of a date column.
  it('does not treat an unspaced date fragment as a bullet', () => {
    expect(isBulletLine('–2021')).toBe(false);
    expect(isBulletLine('●2021')).toBe(false);
    expect(isBulletLine('Built a retrieval pipeline')).toBe(false);
  });

  it('renders recognised bullets in the "* point" form templates expect', () => {
    expect(
      renderEntryBody([
        { kind: 'bullet', text: '\u25cf First point' },
        { kind: 'bullet', text: '\uf0b7 Second point' },
      ])
    ).toBe('* First point\n* Second point');
  });

  it('keeps prose and bullets in one entry, in source order', () => {
    expect(
      renderEntryBody([
        { kind: 'prose', text: 'Led the retrieval team.' },
        { kind: 'prose', text: 'Reported to the VP of Engineering.' },
        { kind: 'bullet', text: '\u25cf Shipped hybrid search.' },
      ])
    ).toBe('Led the retrieval team. Reported to the VP of Engineering.\n* Shipped hybrid search.');
  });
});

describe('U+25CF resume import', () => {
  const resume = [
    'Pranay Dasari',
    'pranay@example.com',
    '',
    'EXPERIENCE',
    '',
    'EverestIMS Technologies',
    'Data Scientist',
    'October 2022 - 2024',
    '● Achieved 42% improvement in retrieval relevance across 25+ enterprise customers.',
    '● Built a multi-agent orchestration system with four specialised agents.',
    '',
    'Adaptive Learning Solutions',
    'Python Developer',
    'July 2021 - October 2022',
    '● Architected a Kafka event pipeline processing 500K+ events per day.',
  ];

  it('keeps the two roles separate', () => {
    expect(splitDatedEntries(resume.slice(5))).toHaveLength(2);
  });

  it('keeps every achievement as its own bullet', () => {
    const { content } = parseResumeText(resume.join('\n'));

    expect(content.experience).toHaveLength(2);
    expect(content.experience[0].summary.split('\n')).toEqual([
      '* Achieved 42% improvement in retrieval relevance across 25+ enterprise customers.',
      '* Built a multi-agent orchestration system with four specialised agents.',
    ]);
    expect(content.experience[1].summary).toBe(
      '* Architected a Kafka event pipeline processing 500K+ events per day.'
    );
  });
});

describe('mixed prose and bullets in one role', () => {
  it('keeps the descriptive sentence as well as the bullets', () => {
    const { content } = parseResumeText(
      [
        'Pranay Dasari',
        '',
        'EXPERIENCE',
        '',
        'EverestIMS Technologies',
        'Data Scientist',
        'October 2022 - Present',
        'Led the retrieval team across four product lines and reported to the VP.',
        '● Shipped hybrid search to 25+ enterprise customers.',
      ].join('\n')
    );

    expect(content.experience[0].summary).toBe(
      'Led the retrieval team across four product lines and reported to the VP.\n' +
        '* Shipped hybrid search to 25+ enterprise customers.'
    );
  });
});

describe('contact lines separated by a non-U+2022 glyph', () => {
  it('does not read a separated contact line as the name', () => {
    const { content } = parseResumeText(
      [
        'Pranay Dasari',
        'Bangalore, India ● +91 8801645404 ● pranay@example.com',
        '',
        'EXPERIENCE',
        '',
        'EverestIMS Technologies',
        'Data Scientist',
        'October 2022 - Present',
        '● Shipped hybrid search.',
      ].join('\n')
    );

    expect(content.basics.name).toBe('Pranay Dasari');
    expect(content.basics.email).toBe('pranay@example.com');
  });
});
