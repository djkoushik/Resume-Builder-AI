import * as fs from 'fs';
import * as path from 'path';
import { parseResumeText } from '../../utils/resumeImport/heuristicParser';

const fixture = (name: string): string =>
  fs.readFileSync(path.join(__dirname, 'fixtures', `${name}.txt`), 'utf8');

const parse = (name: string) => parseResumeText(fixture(name));

describe('contact details', () => {
  test('reads name, email, phone and location from a single-column resume', () => {
    const { content } = parse('single-column');
    expect(content.basics.name).toBe('PRIYA SHARMA');
    expect(content.basics.email).toBe('priya.sharma@gmail.com');
    expect(content.basics.phone).toContain('98765');
    expect(content.basics.location).toBe('Bengaluru, India');
  });

  test('reads contact details spread across separate lines', () => {
    const { content } = parse('company-above-title');
    expect(content.basics.name).toBe('Aisha Rahman');
    expect(content.basics.email).toBe('aisha.rahman@gmail.com');
    expect(content.basics.phone).toContain('7700');
    expect(content.basics.location).toBe('London, United Kingdom');
  });

  test('does not mistake an email local part for a phone number', () => {
    const { content } = parse('minimal');
    expect(content.basics.email).toBe('sam.taylor@outlook.com');
    expect(content.basics.phone).toBe('');
  });

  test('recovers a profile URL that wrapped across two lines', () => {
    // Real PDFs wrap long contact lines mid-URL; naive matching captures only
    // the fragment before the break.
    const { content } = parseResumeText(
      ['PRIYA SHARMA', 'Bengaluru, India | priya.sharma@gmail.com | linkedin.com/in/pr', 'iyasharma', '', 'SKILLS', 'Go, Python'].join('\n')
    );
    expect(content.profiles[0].username).toBe('priyasharma');
    expect(content.profiles[0].url).toBe('https://linkedin.com/in/priyasharma');
  });

  test('reads a phone with a parenthesised area code and a seven-digit local part', () => {
    // "(555) 123-4567" is only eight characters after the area code; an earlier
    // pattern required nine and dropped the number entirely.
    const { content } = parseResumeText(
      ['Nina Patel', 'nina@example.com | (555) 123-4567 | Seattle, WA', '', 'SKILLS', 'Go'].join('\n')
    );
    expect(content.basics.phone).toBe('(555) 123-4567');
  });

  test('does not mistake a year range for a phone number', () => {
    // The permissive phone pattern matches "2019 - 2021" (8 digits); a date in
    // the contact block was being stored as the candidate's phone number.
    const { content } = parseResumeText(
      ['Nina Patel', 'Seattle, WA', '2019 - 2021', 'nina@example.com', '', 'SKILLS', 'Go'].join('\n')
    );
    expect(content.basics.phone).toBe('');
  });

  test('still finds a real phone on a line that also carries a date', () => {
    const { content } = parseResumeText(
      ['Nina Patel', '2019 - 2021 | +1 206 555 0188', 'nina@example.com', '', 'SKILLS', 'Go'].join('\n')
    );
    expect(content.basics.phone).toContain('206');
  });

  test('picks up LinkedIn and GitHub profiles', () => {
    expect(parse('single-column').content.profiles).toEqual([
      expect.objectContaining({ network: 'LinkedIn', username: 'priyasharma' }),
    ]);
    expect(parse('pipe-heading').content.profiles).toEqual([
      expect.objectContaining({ network: 'GitHub', username: 'mokonkwo' }),
    ]);
  });
});

describe('work experience', () => {
  test('splits "Company - Title" headings with a date line below', () => {
    const { content } = parse('single-column');
    expect(content.experience).toHaveLength(2);

    const [first, second] = content.experience;
    expect(first.company).toBe('Razorpay');
    expect(first.position).toBe('Senior Backend Engineer');
    expect(first.location).toBe('Bengaluru, India');
    expect(first.startDate).toBe('March 2021');
    expect(first.isCurrent).toBe(true);
    expect(first.endDate).toBe('Present');

    expect(second.company).toBe('Flipkart');
    expect(second.startDate).toBe('June 2018');
    expect(second.endDate).toBe('February 2021');
    expect(second.isCurrent).toBe(false);
  });

  test('splits pipe-delimited "Title | Company | Location | Dates" headings', () => {
    const { content } = parse('pipe-heading');
    expect(content.experience).toHaveLength(2);

    const [first, second] = content.experience;
    expect(first.company).toBe('Datadog Inc.');
    expect(first.position).toBe('Staff Software Engineer');
    expect(first.location).toBe('New York, NY');
    expect(first.isCurrent).toBe(true);

    // 06/2016 must normalise to a form new Date() can parse, for the ATS scorer.
    expect(second.startDate).toBe('June 2016');
    expect(Number.isNaN(new Date(second.startDate).getTime())).toBe(false);
  });

  test('handles company on one line and title on the next', () => {
    const { content } = parse('company-above-title');
    expect(content.experience).toHaveLength(2);

    const [first] = content.experience;
    expect(first.company).toBe('Monzo Bank Ltd');
    expect(first.position).toBe('Senior Product Designer');
    expect(first.startDate).toBe('September 2019');
    expect(first.isCurrent).toBe(true);
  });

  test('converts source bullets to the "* " form the templates require', () => {
    const { content } = parse('single-column');
    const lines = content.experience[0].summary.split('\n');
    expect(lines).toHaveLength(2);
    lines.forEach(line => expect(line.startsWith('* ')).toBe(true));
    expect(lines[0]).toContain('settlements pipeline');
  });

  test('gives every entry a unique id', () => {
    const { content } = parse('pipe-heading');
    const ids = content.experience.map(entry => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('education', () => {
  test('separates institution from degree', () => {
    const { content } = parse('pipe-heading');
    expect(content.education).toHaveLength(1);
    expect(content.education[0].institution).toBe('Stanford University');
    expect(content.education[0].degree).toContain('Master of Science');
  });

  test('reads an institution-above-degree layout', () => {
    const { content } = parse('company-above-title');
    expect(content.education[0].institution).toBe('University of the Arts London');
    expect(content.education[0].degree).toBe('BA Graphic Design');
  });
});

describe('skills', () => {
  test('turns "Label: a, b, c" lines into skill categories', () => {
    const { content } = parse('single-column');
    expect(content.skills).toHaveLength(3);
    expect(content.skills[0]).toEqual(
      expect.objectContaining({ name: 'Languages', keywords: ['Go', 'Python', 'Java'] })
    );
    expect(content.skills[1].keywords).toContain('Kubernetes');
  });

  test('falls back to a single group when there are no labels', () => {
    const { content } = parse('pipe-heading');
    expect(content.skills).toHaveLength(1);
    expect(content.skills[0].name).toBe('Skills');
    expect(content.skills[0].keywords).toContain('Rust');
  });
});

describe('missing sections', () => {
  test('returns explicit empty values, never seed data', () => {
    const { content } = parse('minimal');

    // The regression that matters most: a sparse resume must not inherit
    // anything from initialResumeData.
    expect(content.projects).toEqual([]);
    expect(content.certifications).toEqual([]);
    expect(content.interests).toEqual([]);
    expect(content.languages).toEqual([]);
    expect(content.education).toEqual([]);
    expect(content.summary).toBe('');
    expect(content.references).toBe('');
    expect(content.basics.website).toBe('');
    expect(content.basics.phone).toBe('');

    // Nothing from the John Doe seed may appear anywhere.
    const serialized = JSON.stringify(content);
    ['John Doe', '555) 123-4567', 'johndoe.me', 'E-Commerce Platform', 'Hiking'].forEach(
      needle => expect(serialized).not.toContain(needle)
    );
  });

  test('every content key is present even for a near-empty document', () => {
    const { content } = parseResumeText('Someone\nsomeone@example.com');
    const keys = [
      'basics', 'summary', 'profiles', 'experience', 'education', 'skills',
      'languages', 'certifications', 'projects', 'interests', 'references',
    ];
    keys.forEach(key => expect(content).toHaveProperty(key));
  });

  test('never emits references as an array', () => {
    const { content } = parse('minimal');
    expect(typeof content.references).toBe('string');
  });
});

describe('section ordering', () => {
  test('parses a resume whose sections arrive sidebar-first', () => {
    // This is the shape column-splitting produces for a sidebar layout: the
    // left column's sections (contact, skills, education) come before the
    // right column's (experience).
    const { content } = parse('sidebar-order');

    expect(content.basics.name).toBe('NINA PATEL');
    expect(content.basics.email).toBe('nina.patel@gmail.com');
    expect(content.experience).toHaveLength(2);
    expect(content.experience[0].company).toBe('Zillow Group');
    expect(content.education[0].institution).toBe('University of Washington');
    expect(content.skills.map(group => group.name)).toContain('Machine learning');
  });
});

describe('confidence reporting', () => {
  test('resolves suffix-less employers from job-title vocabulary', () => {
    const { content } = parse('no-suffix-employers');
    expect(content.experience).toHaveLength(2);

    // "Google" and "Stripe" carry no company marker, but "Software Engineer"
    // and "Backend Engineer" do carry title vocabulary — which is enough.
    expect(content.experience[0].company).toBe('Google');
    expect(content.experience[0].position).toBe('Software Engineer');
    expect(content.experience[1].company).toBe('Stripe');
    expect(content.experience[1].position).toBe('Backend Engineer');
  });

  test('flags a heading with no company or title vocabulary at all', () => {
    const { content, lowConfidence } = parseResumeText(
      ['Jo Blake', 'jo@blake.dev', '', 'EXPERIENCE', '', 'Northwind', 'Operations', '2020 - Present', '- Ran the desk.'].join('\n')
    );

    expect(content.experience).toHaveLength(1);
    // Nothing to key on, so the split is positional — and reported as a guess.
    expect(lowConfidence).toContain('experience.0.company');
    expect(lowConfidence).toContain('experience.0.position');
  });

  test('does not flag headings it resolved from real signals', () => {
    const { lowConfidence } = parse('pipe-heading');
    expect(lowConfidence).not.toContain('experience.0.company');
  });
});
