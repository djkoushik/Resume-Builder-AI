import { linesFromItems } from '../../utils/resumeImport/extractText';
import { parseResumeText } from '../../utils/resumeImport/heuristicParser';
import type { PositionedText } from '../../utils/resumeImport/types';

/** Build positioned runs for one column: lines top-to-bottom at a fixed x. */
const column = (x: number, topY: number, lines: string[], leading = 16): PositionedText[] =>
  lines.map((str, i) => ({ str, x, y: topY - i * leading, page: 1 }));

describe('two-column pages', () => {
  // A sidebar layout: contact and skills on the left, experience on the right.
  // Each column owns its own y values, which is what makes them columns.
  const sidebar = column(50, 700, [
    'NINA PATEL',
    'nina.patel@gmail.com',
    '+1 206 555 0188',
    'Seattle, WA',
    'SKILLS',
    'Machine learning: PyTorch, scikit-learn',
    'Data: SQL, Spark, dbt',
    'EDUCATION',
    'University of Washington',
    'MS in Statistics',
    '2015 - 2017',
  ]);

  // Offset by 8 so no line accidentally shares a rounded y with the sidebar,
  // and with a wider gap between the two roles — real resumes space entries
  // apart, and that spacing is the only signal separating one job from the next.
  const main = [
    ...column(320, 692, ['EXPERIENCE']),
    ...column(320, 676, [
      'Zillow Group - Senior Data Scientist',
      'Seattle, WA | April 2020 - Present',
      '- Built the home valuation model.',
    ]),
    ...column(320, 612, [
      'Expedia - Data Scientist',
      'Seattle, WA | 2017 - 2020',
      '- Developed demand forecasting.',
    ]),
  ];

  // Interleaved, exactly as pdfjs would hand them over.
  const scrambled = [...sidebar, ...main].sort((a, b) => b.y - a.y);

  test('renders each column in full instead of interleaving them', () => {
    const text = linesFromItems(scrambled);
    const lines = text.split('\n').filter(Boolean);

    const skillsAt = lines.findIndex(l => l === 'SKILLS');
    const experienceAt = lines.findIndex(l => l === 'EXPERIENCE');
    const zillowAt = lines.findIndex(l => l.startsWith('Zillow'));

    // The whole left column precedes the whole right column.
    expect(skillsAt).toBeGreaterThan(-1);
    expect(experienceAt).toBeGreaterThan(skillsAt);
    expect(zillowAt).toBeGreaterThan(experienceAt);

    // No line may fuse content from both columns.
    expect(lines.some(l => l.includes('NINA PATEL') && l.includes('EXPERIENCE'))).toBe(false);
  });

  test('the parser recovers the real resume from a scrambled two-column page', () => {
    const { content } = parseResumeText(linesFromItems(scrambled));

    expect(content.basics.name).toBe('NINA PATEL');
    expect(content.basics.email).toBe('nina.patel@gmail.com');
    expect(content.experience).toHaveLength(2);
    expect(content.experience[0].company).toBe('Zillow Group');
    expect(content.experience[0].position).toBe('Senior Data Scientist');
    expect(content.experience[1].company).toBe('Expedia');
    expect(content.education[0].institution).toBe('University of Washington');
    expect(content.skills.map(s => s.name)).toContain('Machine learning');
  });

  test('without column handling the same page interleaves', () => {
    // Guards the guard: if detection regressed to a no-op, rendering the runs
    // in raw y order would fuse the columns onto shared lines.
    const naive = [...scrambled]
      .sort((a, b) => (b.y - a.y) || (a.x - b.x))
      .map(r => r.str);
    const nina = naive.indexOf('NINA PATEL');
    const experience = naive.indexOf('EXPERIENCE');
    expect(Math.abs(nina - experience)).toBeLessThan(3);
  });
});

describe('two-column pages with right-aligned dates in the main column', () => {
  // The layout that defeats a "widest single gap" heuristic: a left rail, a
  // main column, and the main column's dates pushed to the right margin. The
  // widest x-gap sits between the main text and its dates, not at the gutter.
  const rail = column(48, 700, [
    'MARIA GOMEZ',
    'maria.gomez@gmail.com',
    '+1 415 555 0142',
    'San Francisco, CA',
    'SKILLS',
    'Languages: Go, Python, TypeScript',
    'Infra: AWS, Terraform, Kubernetes',
    'EDUCATION',
    'UC Berkeley',
    'BS in EECS',
    '2011 - 2015',
  ]);

  const mainBody = [
    ...column(300, 690, ['EXPERIENCE']),
    ...column(300, 672, ['Stripe - Staff Engineer']),
    ...column(300, 656, ['- Led the payments reliability program.']),
    ...column(300, 640, ['- Cut incident volume by 40%.']),
    ...column(300, 604, ['Airbnb - Senior Engineer']),
    ...column(300, 588, ['- Built the pricing experimentation platform.']),
    ...column(300, 572, ['- Mentored six engineers.']),
  ];

  // Right-aligned dates sharing a line with each company heading.
  const dates: PositionedText[] = [
    { str: 'Jan 2020 - Present', x: 520, y: 672, page: 1 },
    { str: '2015 - 2020', x: 520, y: 604, page: 1 },
  ];

  const scrambled = [...rail, ...mainBody, ...dates].sort((a, b) => b.y - a.y);

  test('splits at the real gutter, not between the text and its dates', () => {
    const lines = linesFromItems(scrambled).split('\n').filter(Boolean);

    const skillsAt = lines.findIndex(l => l === 'SKILLS');
    const experienceAt = lines.findIndex(l => l === 'EXPERIENCE');
    const stripeAt = lines.findIndex(l => l.startsWith('Stripe'));

    expect(skillsAt).toBeGreaterThan(-1);
    expect(experienceAt).toBeGreaterThan(skillsAt);
    expect(stripeAt).toBeGreaterThan(experienceAt);
    expect(lines.some(l => l.includes('MARIA GOMEZ') && l.includes('EXPERIENCE'))).toBe(false);
  });

  test('the parser recovers both roles and their dates', () => {
    const { content } = parseResumeText(linesFromItems(scrambled));

    expect(content.basics.name).toBe('MARIA GOMEZ');
    expect(content.experience).toHaveLength(2);
    expect(content.experience[0].company).toBe('Stripe');
    expect(content.experience[0].position).toBe('Staff Engineer');
    expect(content.experience[0].startDate).toContain('2020');
    expect(content.experience[1].company).toBe('Airbnb');
  });
});

describe('two-column pages with a full-width header band', () => {
  // Name and contact run across the whole page above the columns — a few lines
  // straddle the gutter, but the body below is cleanly divided.
  const header: PositionedText[] = [
    { str: 'DAVID OKAFOR', x: 250, y: 770, page: 1 },
    { str: 'david.okafor@gmail.com', x: 60, y: 752, page: 1 },
    { str: '+44 7700 900123', x: 250, y: 752, page: 1 },
    { str: 'London, UK', x: 430, y: 752, page: 1 },
  ];

  const rail = column(55, 710, [
    'SKILLS',
    'Product analytics, SQL, Looker',
    'Experimentation, causal inference',
    'CERTIFICATIONS',
    'PMP, 2019',
  ]);

  const main = [
    ...column(320, 710, ['EXPERIENCE']),
    ...column(320, 692, ['Deliveroo - Lead Product Manager', 'London, UK | 2019 - Present', '- Owned the rider app roadmap.']),
    ...column(320, 628, ['Monzo - Product Manager', 'London, UK | 2016 - 2019', '- Launched shared tabs.']),
  ];

  const scrambled = [...header, ...rail, ...main].sort((a, b) => b.y - a.y);

  test('still detects the split despite the straddling header lines', () => {
    const lines = linesFromItems(scrambled).split('\n').filter(Boolean);

    const skillsAt = lines.findIndex(l => l === 'SKILLS');
    const experienceAt = lines.findIndex(l => l === 'EXPERIENCE');

    expect(skillsAt).toBeGreaterThan(-1);
    expect(experienceAt).toBeGreaterThan(skillsAt);
    expect(lines.some(l => l.includes('SKILLS') && l.includes('EXPERIENCE'))).toBe(false);
    expect(lines.some(l => l.startsWith('Deliveroo'))).toBe(true);
  });
});

describe('narrow sidebars', () => {
  // A rail carrying only contact and a short skills list — around a sixth of the
  // page's runs, below the old one-fifth floor, but still a real column that
  // must not interleave with the body.
  const rail = column(50, 700, [
    'CONTACT',
    'sam.lee@gmail.com',
    '+1 312 555 0190',
    'Chicago, IL',
    'linkedin.com/in/samlee',
  ]);

  const main = [
    ...column(270, 730, ['SUMMARY']),
    ...column(270, 714, [
      'Backend engineer with nine years building payment and settlement systems.',
      'Comfortable owning a service from design through on-call.',
    ]),
    ...column(270, 682, ['EXPERIENCE']),
    ...column(270, 664, [
      'Braintree - Principal Engineer',
      'Chicago, IL',
      'January 2018 - Present',
      '- Re-architected the settlement pipeline for exactly-once payouts.',
      '- Halved p99 latency across the ledger service.',
      '- Chaired the backend architecture review board.',
      '- Introduced load-shedding that survived three Black Fridays.',
      '- Mentored four engineers to senior.',
    ]),
    ...column(270, 520, [
      'PayPal - Senior Engineer',
      'San Jose, CA',
      'June 2014 - December 2017',
      '- Built the dispute automation service handling 20k cases a day.',
      '- Led a team of five through the GraphQL migration.',
      '- Owned the on-call rotation and the incident review process.',
      '- Cut build times from 40 minutes to 8.',
    ]),
    ...column(270, 380, ['EDUCATION']),
    ...column(270, 364, ['University of Illinois', 'BS in Computer Science', '2010 - 2014']),
    ...column(270, 300, ['SKILLS']),
    ...column(270, 284, [
      'Java, Go, PostgreSQL, Kafka, gRPC, Terraform',
      'AWS, Kubernetes, Datadog, PagerDuty',
    ]),
  ];

  const scrambled = [...rail, ...main].sort((a, b) => b.y - a.y);

  test('a contact-only rail is still separated from the body', () => {
    const lines = linesFromItems(scrambled).split('\n').filter(Boolean);
    expect(lines.some(l => l.includes('CONTACT') && l.includes('SUMMARY'))).toBe(false);

    const { content } = parseResumeText(linesFromItems(scrambled));
    expect(content.basics.email).toBe('sam.lee@gmail.com');
    expect(content.basics.phone).toContain('312');
    expect(content.experience).toHaveLength(2);
    expect(content.experience[0].company).toBe('Braintree');
  });
});

describe('single-column pages are left alone', () => {
  test('right-aligned dates are not mistaken for a second column', () => {
    // "Acme Ltd .......... January 2019" — two x clusters, but every right-hand
    // run shares a line with something on the left.
    const runs: PositionedText[] = [];
    const rows = [
      ['Acme Ltd', 'January 2019'],
      ['Senior Engineer', 'San Francisco, CA'],
      ['Beta Corp', 'March 2016'],
      ['Engineer', 'Austin, TX'],
      ['Gamma Inc', 'June 2013'],
      ['Analyst', 'Boston, MA'],
      ['Delta LLC', 'May 2011'],
      ['Associate', 'Denver, CO'],
      ['Epsilon Ltd', 'April 2009'],
      ['Intern', 'Seattle, WA'],
      ['Zeta Group', 'July 2007'],
      ['Trainee', 'Portland, OR'],
    ];
    rows.forEach(([left, right], i) => {
      const y = 700 - i * 16;
      runs.push({ str: left, x: 50, y, page: 1 });
      runs.push({ str: right, x: 450, y, page: 1 });
    });

    const lines = linesFromItems(runs).split('\n').filter(Boolean);

    // Each pair stays on one line, in source order — no column split.
    expect(lines[0]).toBe('Acme Ltd January 2019');
    expect(lines[1]).toBe('Senior Engineer San Francisco, CA');
    expect(lines).toHaveLength(rows.length);
  });

  test('an ordinary single-column page renders unchanged', () => {
    const runs = column(50, 700, [
      'PRIYA SHARMA', 'Senior Backend Engineer', 'priya@example.com',
      'SUMMARY', 'Backend engineer with 8 years of experience.',
      'EXPERIENCE', 'Razorpay - Senior Backend Engineer', 'March 2021 - Present',
      '- Led the migration.', 'SKILLS', 'Languages: Go, Python',
    ]);
    const lines = linesFromItems(runs).split('\n').filter(Boolean);
    expect(lines[0]).toBe('PRIYA SHARMA');
    expect(lines).toHaveLength(11);
  });

  test('a sparse page is not split on too little evidence', () => {
    const runs: PositionedText[] = [
      { str: 'Name', x: 50, y: 700, page: 1 },
      { str: 'Date', x: 450, y: 700, page: 1 },
      { str: 'Role', x: 50, y: 684, page: 1 },
    ];
    expect(linesFromItems(runs).split('\n')).toEqual(['Name Date', 'Role']);
  });
});
