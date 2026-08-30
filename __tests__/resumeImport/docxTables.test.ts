import { htmlToLines } from '../../utils/resumeImport/extractText';
import { parseResumeText } from '../../utils/resumeImport/heuristicParser';

/** Mirrors what mammoth's convertToHtml emits for a Word document. */
const layoutTable = `
<p>NINA PATEL</p><p>Senior Data Scientist</p>
<table><tr>
<td><p>CONTACT</p><p>nina.patel@gmail.com</p><p>+1 206 555 0188</p><p>Seattle, WA</p>
<p>SKILLS</p><p>Machine learning: PyTorch</p><p>Data: SQL, Spark</p></td>
<td><p>WORK EXPERIENCE</p>
<p>Zillow Group - Senior Data Scientist</p><p>Seattle, WA | April 2020 - Present</p>
<ul><li>Built the home valuation model.</li></ul>
<p></p>
<p>Expedia - Data Scientist</p><p>Seattle, WA | 2017 - 2020</p>
<ul><li>Developed demand forecasting.</li></ul></td>
</tr></table>`;

const dataTable = `
<p>Nina Patel</p><p>nina@example.com</p>
<p>EDUCATION</p>
<table>
<tr><td><p>2015 - 2017</p></td><td><p>University of Washington</p><p>MS in Statistics</p></td></tr>
<tr><td><p>2011 - 2015</p></td><td><p>UC Berkeley</p><p>BSc Computer Science</p></td></tr>
</table>`;

describe('htmlToLines', () => {
  test('separates table rows with a blank line and keeps a row together', () => {
    const lines = htmlToLines(dataTable);
    const first = lines.indexOf('2015 - 2017');
    const second = lines.indexOf('2011 - 2015');

    // The date and its institution stay in the same block...
    expect(lines[first + 1]).toBe('University of Washington');
    // ...and a blank line separates one row from the next.
    expect(lines.slice(first, second)).toContain('');
  });

  test('marks list items so they survive as bullets', () => {
    // Word bullets carry no literal bullet character; without the prefix they
    // would render as paragraphs in every resume template.
    expect(htmlToLines('<ul><li>Did the thing.</li></ul>')).toEqual(['- Did the thing.']);
  });

  test('ignores empty paragraphs at the edges and collapses blank runs', () => {
    expect(htmlToLines('<p></p><p>A</p><p></p><p></p><p>B</p><p></p>')).toEqual(['A', '', 'B']);
  });

  test('does not confuse a nested table\'s rows for the outer table\'s', () => {
    const lines = htmlToLines(
      '<table><tr><td><p>Outer</p><table><tr><td><p>Inner</p></td></tr></table></td></tr></table>'
    );
    expect(lines).toEqual(['Outer', 'Inner']);
  });
});

describe('parsing a table-based resume', () => {
  test('a two-cell layout table parses like a sidebar resume', () => {
    const { content } = parseResumeText(htmlToLines(layoutTable).join('\n'));

    expect(content.basics.name).toBe('NINA PATEL');
    expect(content.basics.email).toBe('nina.patel@gmail.com');
    expect(content.basics.phone).toContain('206');
    expect(content.experience).toHaveLength(2);
    expect(content.experience[0].company).toBe('Zillow Group');
    expect(content.experience[1].company).toBe('Expedia');
    expect(content.experience[0].summary).toBe('* Built the home valuation model.');
    expect(content.skills.map(g => g.name)).toContain('Machine learning');
  });

  test('two jobs in one table cell with no blank line still split', () => {
    // Word authors separate entries with paragraph spacing, not empty
    // paragraphs, so a table cell can hold two roles back to back.
    const { content } = parseResumeText(htmlToLines(
      `<p>Nina Patel</p><p>nina@example.com</p><table><tr><td>
       <p>WORK EXPERIENCE</p>
       <p>Zillow Group - Senior Data Scientist</p><p>April 2020 - Present</p>
       <ul><li>Built the model.</li></ul>
       <p>Expedia - Data Scientist</p><p>2017 - 2020</p>
       <ul><li>Forecast demand.</li></ul>
       </td></tr></table>`
    ).join('\n'));

    expect(content.experience).toHaveLength(2);
    expect(content.experience[0].company).toBe('Zillow Group');
    expect(content.experience[0].summary).toBe('* Built the model.');
    expect(content.experience[1].company).toBe('Expedia');
    expect(content.experience[1].summary).toBe('* Forecast demand.');
  });

  test('two bullet-less jobs back to back split on the second date range', () => {
    const { content } = parseResumeText([
      'Nina Patel', 'nina@example.com', '',
      'EXPERIENCE',
      'Acme Ltd - Engineer', '2019 - 2021',
      'Beta Corp - Analyst', '2016 - 2019',
    ].join('\n'));

    expect(content.experience).toHaveLength(2);
    expect(content.experience[0].company).toBe('Acme Ltd');
    expect(content.experience[1].company).toBe('Beta Corp');
  });

  test('a date-first layout splits at the row, not after the date', () => {
    // "2015 - 2017 / University / MS" puts the date first, so the lines after
    // it belong to the SAME entry, not the next one.
    const { content } = parseResumeText([
      'Nina Patel', 'nina@example.com', '',
      'EDUCATION',
      '2015 - 2017', 'University of Washington', 'MS in Statistics',
      '2011 - 2015', 'UC Berkeley', 'BSc Computer Science',
    ].join('\n'));

    expect(content.education).toHaveLength(2);
    expect(content.education[0].institution).toBe('University of Washington');
    expect(content.education[1].institution).toBe('UC Berkeley');
  });

  test('a single job with many bullets is not split', () => {
    const { content } = parseResumeText([
      'Nina Patel', 'nina@example.com', '',
      'EXPERIENCE',
      'Acme Ltd - Engineer', 'London, UK | 2019 - 2021',
      '- One.', '- Two.', '- Three.',
    ].join('\n'));

    expect(content.experience).toHaveLength(1);
    expect(content.experience[0].summary.split('\n')).toHaveLength(3);
  });

  test('a date-column education table yields one entry per row, not one merged entry', () => {
    const { content } = parseResumeText(htmlToLines(dataTable).join('\n'));

    expect(content.education).toHaveLength(2);
    expect(content.education[0].institution).toBe('University of Washington');
    expect(content.education[0].startDate).toBe('2015');
    expect(content.education[1].institution).toBe('UC Berkeley');
    expect(content.education[1].degree).toContain('BSc');
  });
});
