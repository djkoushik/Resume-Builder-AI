// Bullets that wrap onto a line starting with a proper noun.
//
// Regression for an import where four jobs became six entries, two of them with
// a half-sentence for a company name. A wrapped line was only recognised by its
// lowercase opening, and technical resumes wrap onto capitalised product names
// constantly — "...telemetry via Kafka and" / "RabbitMQ into PostgreSQL".

import { continuesPreviousLine } from '../../utils/resumeImport/normalize';
import { splitDatedEntries, splitEntries } from '../../utils/resumeImport/sectionSplitter';
import { parseResumeText } from '../../utils/resumeImport/heuristicParser';

describe('continuesPreviousLine', () => {
  it.each([
    ['telemetry via Kafka and', 'RabbitMQ into PostgreSQL (ETL), reducing noise.'],
    ['developing backend services in', 'Python with PostgreSQL and MongoDB.'],
    ['improving reliability and data flow across the', 'NMS platform.'],
    ['models (Python, scikit-learn, XGBoost)', 'and dashboards; integrated Flan-T5.'],
  ])('treats %j -> %j as a wrap', (previous, line) => {
    expect(continuesPreviousLine(previous, line)).toBe(true);
  });

  it.each([
    ['• Mentored four engineers to senior.', 'Braintree Ltd'],
    ['• Owned the on-call rotation.', 'PayPal'],
    ['Data Scientist (Team Lead)', 'Northwind Analytics Ltd'],
  ])('treats %j -> %j as a new line', (previous, line) => {
    expect(continuesPreviousLine(previous, line)).toBe(false);
  });
});

describe('wrapped bullets do not split an entry', () => {
  const experience = [
    'Northwind Analytics Ltd — Lisbon, Portugal',
    'Data Scientist (Team Lead) | 2024 – Present',
    '• Built event-management workflows ingesting telemetry via Kafka and',
    'RabbitMQ into PostgreSQL (ETL), reducing noise and speeding up analysis.',
    '• Led a cross-functional team across three products.',
    '',
    'Northwind Analytics Ltd — Lisbon, Portugal',
    'Software Engineer | Oct 2022 – 2024',
    '• Built and maintained full-stack features, developing backend services in',
    'Python with PostgreSQL and MongoDB.',
    '• Improved reliability and data flow across the',
    'NMS platform.',
  ];

  it('keeps one entry per job', () => {
    expect(splitDatedEntries(experience)).toHaveLength(2);
  });

  it('rejoins each wrapped bullet instead of starting a role', () => {
    const { content } = parseResumeText(['EXPERIENCE', '', ...experience].join('\n'));

    expect(content.experience).toHaveLength(2);
    expect(content.experience.map(e => e.company)).toEqual([
      'Northwind Analytics Ltd',
      'Northwind Analytics Ltd',
    ]);
    expect(content.experience[0].summary).toContain(
      '* Built event-management workflows ingesting telemetry via Kafka and RabbitMQ into PostgreSQL'
    );
    expect(content.experience[1].summary).toContain(
      '* Improved reliability and data flow across the NMS platform.'
    );
  });
});

describe('entries separated only by their bullets', () => {
  // A projects list written with no blank line between entries: the bullet
  // boundary is the only thing marking where one project ends.
  const projects = [
    'Growth Automation Agent — Multi-agent system | 2024',
    '• Built a multi-agent backend in Python with a retrieval pipeline; agents',
    'handle extraction, generation and validation.',
    'Resume Builder — Creator | example.com',
    '• Built a resume builder generating ATS-optimized output.',
    'Interactive Game — Creator',
    '• Architected a full-stack game with real-time interactions.',
  ];

  it('splits on the bullet boundary', () => {
    expect(splitEntries(projects)).toHaveLength(3);
  });

  it('parses every project rather than folding them into the first', () => {
    const { content } = parseResumeText(['PROJECTS', '', ...projects].join('\n'));

    expect(content.projects.map(p => p.name)).toEqual([
      'Growth Automation Agent',
      'Resume Builder',
      'Interactive Game',
    ]);
  });
});

describe('a long bullet wrapped onto a new sentence', () => {
  // The hard case: the continuation has no marker, opens on a capital, and the
  // line above it closed with a full stop — so neither wrap test in
  // continuesPreviousLine fires. Only its length says it is not a heading.
  const experience = [
    'Northwind Analytics Ltd — Lisbon, Portugal',
    'Data Scientist / Team Lead | 2024 to Present',
    '• Architected a hybrid retrieval pipeline serving 150K+ daily queries with 98.2% uptime.',
    'Achieved a 42% improvement in relevance and a 35% reduction in analysis time for 25+ enterprise',
    'customers.',
    '• Built a multi-agent orchestration system with four specialised agents for troubleshooting.',
    'Delivered 2.8x faster resolution, a 67% auto-remediation rate, and 44% fewer manual escalations.',
  ];

  it('does not turn a wrapped sentence into another job', () => {
    expect(splitDatedEntries(experience)).toHaveLength(1);
  });

  it('reattaches the sentence to the bullet it belongs to', () => {
    const { content } = parseResumeText(['EXPERIENCE', '', ...experience].join('\n'));

    expect(content.experience).toHaveLength(1);
    expect(content.experience[0]).toMatchObject({
      company: 'Northwind Analytics Ltd',
      position: 'Data Scientist / Team Lead',
    });

    expect(content.experience[0].summary.split('\n')).toEqual([
      '* Architected a hybrid retrieval pipeline serving 150K+ daily queries with 98.2% uptime. ' +
        'Achieved a 42% improvement in relevance and a 35% reduction in analysis time for 25+ ' +
        'enterprise customers.',
      '* Built a multi-agent orchestration system with four specialised agents for troubleshooting. ' +
        'Delivered 2.8x faster resolution, a 67% auto-remediation rate, and 44% fewer manual escalations.',
    ]);
  });

  it('still opens a new entry on a short company line ending in a full stop', () => {
    expect(
      splitDatedEntries([
        'Acme Inc.',
        'Engineer | 2020 - 2022',
        '• Shipped the billing service.',
        'Globex Ltd.',
        'Engineer | 2018 - 2020',
        '• Shipped the ledger service.',
      ])
    ).toHaveLength(2);
  });
});
