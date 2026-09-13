// A single-column resume that indents a second value on some lines.
//
// Regression for an import where the name, the headline and every date landed
// at the END of the document and no entry kept its dates. The layout below is
// the shape that caused it: "Label:   value" skill rows put their values in a
// loose x cluster, which read as the left edge of a second column, and the
// renderer then emitted that phantom column after the whole body.

import { linesFromItems } from '../../utils/resumeImport/extractText';
import { parseResumeText } from '../../utils/resumeImport/heuristicParser';
import type { PositionedText } from '../../utils/resumeImport/types';

const run = (str: string, x: number, y: number): PositionedText => ({ str, x, y, page: 1 });

/** Full-width body lines, all starting at the left margin. */
const body = (topY: number, lines: string[], leading = 11.5): PositionedText[] =>
  lines.map((str, i) => run(str, 45, topY - i * leading));

const items: PositionedText[] = [
  run('DREW OKAFOR', 223.6, 737.2),
  run('Data Scientist | Machine Learning, RAG & LLM Applications', 160.3, 720.7),
  run('Lisbon, Portugal • +351 912 345 678 • drew@example.com', 87.5, 707.0),

  ...body(684.1, ['SUMMARY']),
  ...body(666.8, [
    'Data scientist with five years of experience applying Python and machine',
    'learning to build applied AI systems across data-intensive environments.',
  ]),

  ...body(597.8, ['CORE SKILLS']),
  // The indented values: same baseline as their label, x scattered by label width.
  run('Programming:', 45, 580.5),
  run('Python (NumPy, Pandas), SQL, REST APIs', 208.3, 580.5),
  ...body(569.0, ['applied across data-pipeline and model-serving logic']),
  run('Machine Learning:', 45, 555.5),
  run('Feature Engineering, Predictive Modeling', 198.3, 555.5),
  run('Generative AI:', 45, 530.5),
  run('Hybrid RAG, LangChain, Agent Orchestration', 154.5, 530.5),
  run('Data Engineering:', 45, 494.0),
  run('PostgreSQL, Kafka, ETL Pipelines', 133.3, 494.0),

  ...body(446.1, ['EXPERIENCE']),
  // Right-aligned location and dates, each sharing a baseline with its heading.
  run('Northwind Analytics Ltd', 45, 424.9),
  run('— Lisbon, Portugal', 223.3, 424.9),
  run('Data Scientist (Team Lead)', 45, 413.2),
  run('| 2024 – Present', 303.1, 413.2),
  ...body(401.5, [
    '• Led a cross-functional team delivering AI features across three products.',
    '• Shipped a hybrid retrieval pipeline powering root-cause analysis.',
  ]),
];

describe('indented values are not a second column', () => {
  const text = linesFromItems(items);
  const lines = text.split('\n').filter(line => line.trim() !== '');

  test('keeps the document in reading order', () => {
    expect(lines[0]).toContain('DREW OKAFOR');
    expect(lines.findIndex(l => l.includes('SUMMARY'))).toBeLessThan(
      lines.findIndex(l => l.includes('EXPERIENCE'))
    );
  });

  test('keeps each indented value on its label’s line', () => {
    expect(lines).toContain('Data Engineering: PostgreSQL, Kafka, ETL Pipelines');
  });

  test('keeps right-aligned dates on their heading’s line', () => {
    expect(lines.some(l => l.includes('Northwind Analytics Ltd') && l.includes('Lisbon'))).toBe(true);
    expect(lines.some(l => l.includes('Data Scientist (Team Lead)') && l.includes('2024'))).toBe(true);
  });

  test('parses the name, headline, location and the role’s dates', () => {
    const { content } = parseResumeText(text);

    expect(content.basics.name).toBe('DREW OKAFOR');
    expect(content.basics.location).toBe('Lisbon, Portugal');
    expect(content.experience).toHaveLength(1);
    expect(content.experience[0]).toMatchObject({
      company: 'Northwind Analytics Ltd',
      position: 'Data Scientist (Team Lead)',
      location: 'Lisbon, Portugal',
      startDate: '2024',
      endDate: 'Present',
      isCurrent: true,
    });
  });

  test('does not take the headline’s trailing half as the location', () => {
    const { content } = parseResumeText(text);
    expect(content.basics.location).not.toContain('Machine Learning');
  });

  test('keeps each skill category, and brackets intact', () => {
    const { content } = parseResumeText(text);
    const names = content.skills.map(s => s.name);

    expect(names).toEqual(['Programming', 'Machine Learning', 'Generative AI', 'Data Engineering']);
    expect(content.skills[0].keywords).toContain('Python (NumPy, Pandas)');
  });
});
