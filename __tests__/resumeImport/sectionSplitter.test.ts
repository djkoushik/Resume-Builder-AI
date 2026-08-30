import { collapseUniformSpacing } from '../../utils/resumeImport/extractText';
import { splitEntries, splitSections } from '../../utils/resumeImport/sectionSplitter';
import { parseResumeText } from '../../utils/resumeImport/heuristicParser';

describe('splitSections', () => {
  const text = [
    'JANE DOE', 'jane@example.com', '',
    'PROFESSIONAL SUMMARY', 'A summary line.', '',
    'WORK EXPERIENCE', 'Acme Ltd - Engineer', '',
    'TECHNICAL SKILLS', 'Go, Rust',
  ].join('\n');

  test('separates the contact block from headed sections', () => {
    const { contact, sections } = splitSections(text);
    expect(contact).toEqual(['JANE DOE', 'jane@example.com']);
    expect(sections.summary).toEqual(['A summary line.']);
    expect(sections.experience).toEqual(['Acme Ltd - Engineer']);
    expect(sections.skills).toEqual(['Go, Rust']);
  });

  test('matches header wording variants', () => {
    ['SUMMARY', 'Professional Summary', 'PROFILE', 'Objective:', '- OVERVIEW -'].forEach(heading => {
      const { sections } = splitSections(`Name\n\n${heading}\nText here.`);
      expect(sections.summary).toEqual(['Text here.']);
    });
  });

  test('an unknown all-caps heading ends the previous section', () => {
    const { sections, unknownHeadings } = splitSections(
      ['Name', '', 'SKILLS', 'Go', '', 'VOLUNTEERING', 'Food bank'].join('\n')
    );
    expect(sections.skills).toEqual(['Go']);
    expect(unknownHeadings).toContain('VOLUNTEERING');
    expect(sections.skills).not.toContain('Food bank');
  });

  test('an all-caps job title does not end the contact block', () => {
    // Name and title both in caps is common. Treating the title as a section
    // boundary discarded every contact line beneath it.
    const { contact, sections } = splitSections(
      ['NINA PATEL', 'DATA SCIENTIST', 'nina@example.com', '+1 206 555 0188', '', 'SKILLS', 'Go'].join('\n')
    );
    expect(contact).toContain('nina@example.com');
    expect(contact).toContain('+1 206 555 0188');
    expect(sections.skills).toEqual(['Go']);
  });

  test('an all-caps comma list is content, not a heading', () => {
    const { sections, unknownHeadings } = splitSections(
      ['Nina Patel', '', 'SKILLS', 'HTML, CSS, JAVASCRIPT', 'React, Node'].join('\n')
    );
    expect(sections.skills).toEqual(['HTML, CSS, JAVASCRIPT', 'React, Node']);
    expect(unknownHeadings).toEqual([]);
  });

  test('a run of all-caps acronyms is a skills list, not a series of headings', () => {
    const { sections } = splitSections(
      ['Nina Patel', '', 'SKILLS', 'AWS', 'DOCKER', 'KUBERNETES', '', 'EXPERIENCE', 'Acme Ltd - Engineer'].join('\n')
    );
    expect(sections.skills).toEqual(['AWS', 'DOCKER', 'KUBERNETES']);
    expect(sections.experience).toEqual(['Acme Ltd - Engineer']);
  });

  test('the last acronym in a run is not a heading', () => {
    // Checking only the following line misclassified KUBERNETES, because the
    // line after it ("HTML, CSS, ...") is not itself a candidate.
    const { sections } = splitSections(
      ['Nina Patel', '', 'SKILLS', 'AWS', 'DOCKER', 'KUBERNETES', 'HTML, CSS, JAVASCRIPT'].join('\n')
    );
    expect(sections.skills).toEqual(['AWS', 'DOCKER', 'KUBERNETES', 'HTML, CSS, JAVASCRIPT']);
  });

  test('a genuine unknown section still ends the previous one', () => {
    // The behaviour the rule exists for must survive the tightening.
    const { sections, unknownHeadings } = splitSections(
      ['Nina Patel', '', 'SKILLS', 'Go and Rust', '', 'VOLUNTEERING', 'Food bank on Saturdays'].join('\n')
    );
    expect(sections.skills).toEqual(['Go and Rust']);
    expect(unknownHeadings).toContain('VOLUNTEERING');
    expect(JSON.stringify(sections)).not.toContain('Food bank');
  });

  test('a date line is not treated as a heading', () => {
    const { sections } = splitSections(['Name', '', 'EXPERIENCE', '2019 - 2021', 'Acme Ltd'].join('\n'));
    expect(sections.experience).toEqual(['2019 - 2021', 'Acme Ltd']);
  });
});

describe('splitEntries', () => {
  test('splits on blank lines', () => {
    expect(splitEntries(['a', 'b', '', 'c'])).toEqual([['a', 'b'], ['c']]);
  });

  test('a block with no blank lines is a single entry', () => {
    expect(splitEntries(['a', 'b', 'c'])).toEqual([['a', 'b', 'c']]);
  });
});

describe('collapseUniformSpacing (the DOCX shape)', () => {
  // mammoth returns every paragraph blank-line separated. Without collapsing
  // that, a two-job resume parses as five one-line jobs.
  const doubled = [
    'PRIYA SHARMA', '', 'priya@example.com', '', '', '',
    'WORK EXPERIENCE', '', '', '',
    'Razorpay - Senior Backend Engineer', '', 'March 2021 - Present', '', '- Led the migration.', '', '', '',
    'Flipkart - Backend Engineer', '', 'June 2018 - February 2021', '', '- Built the service.',
  ].join('\n');

  test('halves doubled spacing and keeps real blank lines', () => {
    expect(collapseUniformSpacing('A\n\nB\n\n\n\nC')).toBe('A\nB\n\nC');
  });

  test('leaves a normally spaced document untouched', () => {
    expect(collapseUniformSpacing('A\nB\n\nC')).toBe('A\nB\n\nC');
    expect(collapseUniformSpacing('')).toBe('');
  });

  test('uncollapsed, every line becomes its own entry', () => {
    expect(parseResumeText(doubled).content.experience.length).toBeGreaterThan(2);
  });

  test('collapsed, the real entry count is recovered', () => {
    const { content } = parseResumeText(collapseUniformSpacing(doubled));
    expect(content.experience).toHaveLength(2);
    expect(content.experience[0].company).toBe('Razorpay');
    expect(content.experience[0].position).toBe('Senior Backend Engineer');
    expect(content.experience[1].company).toBe('Flipkart');
  });
});
