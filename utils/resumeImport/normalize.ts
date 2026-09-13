// Turning messy extracted values into shapes the builder and templates expect.

import type { ImportedContent } from './types';

/**
 * Unique ids for bulk inserts.
 *
 * The editor sections all use a bare `Date.now().toString()`, which is fine for
 * one item added by hand but collides for every row when a parse inserts six at
 * once — same id, colliding React keys, deleting one removes the wrong row.
 */
export const makeId = (index: number): string => `${Date.now()}-${index}`;

const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

const MONTH_LOOKUP = new Map<string, string>();
MONTHS.forEach((month, i) => {
  const proper = month[0].toUpperCase() + month.slice(1);
  MONTH_LOOKUP.set(month, proper);
  MONTH_LOOKUP.set(month.slice(0, 3), proper);
  MONTH_LOOKUP.set(String(i + 1).padStart(2, '0'), proper);
  MONTH_LOOKUP.set(String(i + 1), proper);
});

const CURRENT_WORDS = /^(present|current|now|to date|ongoing|till date)$/i;

export const isCurrentDate = (value: string): boolean => CURRENT_WORDS.test(value.trim());

/**
 * Normalise a single date to `"March 2021"` (or `"2021"` when no month is given).
 *
 * `atsService` runs `new Date(exp.startDate)` for its experience-years maths, so
 * a format JS cannot parse silently degrades the user's ATS score. `"March 2021"`
 * parses; `"03/2021"` does not.
 */
export const normalizeDate = (raw: string): string => {
  const value = raw.trim();
  if (value === '') return '';
  if (isCurrentDate(value)) return 'Present';

  // "March 2021", "Mar 2021", "Mar. 2021"
  const monthYear = value.match(/^([A-Za-z]{3,9})\.?\s+(\d{4})$/);
  if (monthYear) {
    const month = MONTH_LOOKUP.get(monthYear[1].toLowerCase());
    if (month) return `${month} ${monthYear[2]}`;
  }

  // "Mar '19", "March '19"
  const monthShortYear = value.match(/^([A-Za-z]{3,9})\.?\s*'(\d{2})$/);
  if (monthShortYear) {
    const month = MONTH_LOOKUP.get(monthShortYear[1].toLowerCase());
    if (month) return `${month} 20${monthShortYear[2]}`;
  }

  // "03/2021", "3-2021"
  const numericMonthYear = value.match(/^(\d{1,2})[/\-.](\d{4})$/);
  if (numericMonthYear) {
    const month = MONTH_LOOKUP.get(numericMonthYear[1].replace(/^0/, ''));
    if (month) return `${month} ${numericMonthYear[2]}`;
  }

  // "2021-03", "2021/03"
  const yearMonth = value.match(/^(\d{4})[/\-.](\d{1,2})$/);
  if (yearMonth) {
    const month = MONTH_LOOKUP.get(yearMonth[2].replace(/^0/, ''));
    if (month) return `${month} ${yearMonth[1]}`;
  }

  // "03/15/2021" — take the month and year, drop the day.
  const fullDate = value.match(/^(\d{1,2})[/\-.]\d{1,2}[/\-.](\d{4})$/);
  if (fullDate) {
    const month = MONTH_LOOKUP.get(fullDate[1].replace(/^0/, ''));
    if (month) return `${month} ${fullDate[2]}`;
  }

  // Bare year.
  const year = value.match(/^(\d{4})$/);
  if (year) return year[1];

  // Unrecognised — hand it back unchanged rather than losing it. The review
  // step is where the user fixes what we could not read.
  return value;
};

/**
 * A month name, spelled out or abbreviated.
 *
 * Deliberately an explicit list rather than `[A-Za-z]{3,9}`. A loose alphabetic
 * run followed by a year matches any word sitting to the left of a date, and
 * right-aligned dates — "Meta          2021 - Present" — put a company name
 * exactly there. The employer then disappears into the date range.
 */
export const MONTH_PATTERN =
  "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\\b\\.?";

/**
 * One end of a date range: "March 2021", "Mar '21", "03/2021" or a bare year.
 *
 * The gap between month and year is bounded at two spaces for the same reason
 * the month list is explicit: column padding is three spaces or more, so a
 * wider gap means the two halves were never one date.
 */
export const DATE_TOKEN_PATTERN = `(?:${MONTH_PATTERN}\\s{0,2}'?\\d{2,4}|\\b\\d{1,2}[/\\-.]\\d{4}\\b|\\b\\d{4}\\b)`;

/** Words standing in for an open-ended end date. */
export const CURRENT_PATTERN = "(?:present|current|now|ongoing|till date|to date)";

/** The separator between the two ends of a range. */
export const RANGE_SEPARATOR_PATTERN = "(?:\\u2013|\\u2014|-|to|until|through)";

/** A full range, e.g. "Jun 2019 - Present". Group 1 is the whole range. */
export const DATE_RANGE_PATTERN =
  `(${DATE_TOKEN_PATTERN}\\s*${RANGE_SEPARATOR_PATTERN}\\s*(?:${CURRENT_PATTERN}|${DATE_TOKEN_PATTERN}))`;

const RANGE_SEPARATOR = /\s*(?:–|—|-|\bto\b|\buntil\b|\bthrough\b)\s*/i;

export interface DateRange {
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

/** Split "March 2021 - Present" into its parts. */
export const parseDateRange = (raw: string): DateRange => {
  const value = raw.trim();
  if (value === '') return { startDate: '', endDate: '', isCurrent: false };

  const parts = value.split(RANGE_SEPARATOR).filter(part => part.trim() !== '');

  if (parts.length >= 2) {
    const endRaw = parts[parts.length - 1];
    const current = isCurrentDate(endRaw);
    return {
      startDate: normalizeDate(parts[0]),
      endDate: current ? 'Present' : normalizeDate(endRaw),
      isCurrent: current,
    };
  }

  const single = normalizeDate(value);
  return { startDate: single, endDate: '', isCurrent: false };
};

/**
 * Characters a resume uses to open a bullet.
 *
 * The long tail matters far more than it looks. Word writes its default bullet
 * in the Symbol font and its list styles in Wingdings, and neither carries a
 * Unicode mapping — pdf.js surfaces them as Private Use Area codepoints
 * (U+F0B7, U+F0A7, U+F0D8, U+F0FC...) rather than as U+2022. Exporters that do
 * map the glyph often pick U+25CF over U+2022. A class covering only U+2022 and
 * the dashes therefore misses most Word-exported PDFs, which are the single
 * most common thing a user uploads.
 *
 * Missing a marker is not a cosmetic loss: `parseExperienceEntry` routes
 * unrecognised bullets into prose, which joins the whole role into one
 * paragraph, and `splitDatedEntries` loses the boundary between two jobs.
 */
const BULLET_GLYPHS =
  // Unicode bullets and geometric markers.
  '\\u2022\\u2023\\u2043\\u2219\\u00b7\\u25aa\\u25ab\\u25e6\\u25cf\\u25cb\\u25a0\\u25a1' +
  '\\u25b8\\u25b9\\u25ba\\u2756\\u276f\\u279c\\u27a1\\u27a2\\u27a4\\u00bb\\u2713\\u2714' +
  // Word's Symbol/Wingdings bullets, as pdf.js reports them.
  '\\uf020\\uf076\\uf0a7\\uf0a8\\uf0b7\\uf0d8\\uf0e0\\uf0fc';

/** The glyphs above plus the ASCII markers, which only count at line start. */
const BULLET_CHARS = `${BULLET_GLYPHS}*\\-\\u2010\\u2011\\u2012\\u2013\\u2014\\u2212`;

/**
 * A character used to separate fields *within* a line — "Berlin • +49 30 1234".
 *
 * Only the glyph markers, never the ASCII ones: a hyphen is ordinary inside a
 * name ("Anne-Marie") or a city ("Wilkes-Barre"), and an asterisk is a footnote.
 */
export const INLINE_SEPARATOR = new RegExp(`[|${BULLET_GLYPHS}]`);

/**
 * A bullet marker at the start of a line, with its trailing space.
 *
 * Repeated markers ("•-", "--") are taken as one prefix. The separating space
 * is usually there but not always, so a marker followed directly by a word also
 * counts — restricted to a letter or an opening bracket so that "- 2021" and
 * "–Present", which are date fragments rather than bullets, do not match.
 */
export const BULLET_PREFIX = new RegExp(
  `^\\s*[${BULLET_CHARS}]+(?:\\s+|(?=[A-Za-z(\\[]))`
);

/** Is this line already a bullet in the source document? */
export const isBulletLine = (line: string): boolean => BULLET_PREFIX.test(line);

/** Drop a leading bullet marker, if there is one. */
export const stripBulletMarker = (line: string): string =>
  line.replace(BULLET_PREFIX, '').trim();

/**
 * Tokens a line cannot end on unless it wrapped: a dangling function word, or
 * punctuation that opens rather than closes.
 */
const UNFINISHED_TAIL = new RegExp(
  '(?:\\b(?:a|an|the|and|or|but|with|via|to|of|in|on|at|by|for|from|into|onto|' +
    'across|over|under|through|within|between|using|including|that|which|while|' +
    'when|where|as|per)\\b|[,;:(\\u2013\\u2014-])\\s*$',
  'i'
);

/**
 * Does `line` continue `previous`, rather than start something new?
 *
 * A lowercase opening is the classic tell, and on its own it is wrong often
 * enough to matter: technical resumes wrap onto proper nouns constantly —
 * "...telemetry via Kafka and" / "RabbitMQ into PostgreSQL", "...services in" /
 * "Python with PostgreSQL". Reading those as new content costs more than a
 * stray line, because both callers treat a non-continuation after a bullet as
 * the start of a new job: one wrapped bullet silently becomes an extra role
 * whose company name is the second half of a sentence.
 *
 * So the previous line gets a vote too. A line ending on "and", "in" or "the"
 * has wrapped whatever the next line starts with, while a heading or a finished
 * bullet ends on a word or a full stop.
 */
export const continuesPreviousLine = (previous: string, line: string): boolean => {
  const trimmed = line.trim();
  if (trimmed === '') return false;

  return /^[a-z]/.test(trimmed) || UNFINISHED_TAIL.test(previous.trimEnd());
};

/** One line of an entry's body, tagged so bullets and prose keep their order. */
export interface BodyLine {
  kind: 'bullet' | 'prose';
  text: string;
}

/**
 * Render an entry's body in the form every resume template expects.
 *
 * `renderSummaryList` splits on `\n` and tests `startsWith('*')`, so a bullet
 * has to arrive as `"* point"` — any other marker renders as a flat paragraph.
 * Prose stays a bare line, which is what makes a mixed entry possible: a role
 * described in a sentence *and then* itemised keeps both halves, in the order
 * they appeared, instead of the sentence being dropped.
 *
 * Adjacent prose lines are merged, since they are almost always one paragraph
 * that wrapped rather than two separate thoughts.
 */
export const renderEntryBody = (body: BodyLine[]): string => {
  const out: string[] = [];

  for (const line of body) {
    const text = line.text.trim();
    if (text === '') continue;

    const previous = out[out.length - 1];

    if (line.kind === 'prose' && previous !== undefined && !previous.startsWith('*')) {
      out[out.length - 1] = `${previous} ${text}`;
      continue;
    }

    out.push(line.kind === 'bullet' ? `* ${stripBulletMarker(text)}` : text);
  }

  return out.join('\n');
};

/** Field length ceilings, mirroring CoverLetterEditor.validateField. */
export const CAPS = { short: 100, long: 5000 } as const;

export const cap = (value: string, max: number): string =>
  value.length > max ? value.slice(0, max).trimEnd() : value;

/** An entirely empty resume. Never a partial object — see ImportedContent. */
export const emptyContent = (): ImportedContent => ({
  basics: { name: '', headline: '', photo: '', email: '', phone: '', website: '', location: '' },
  summary: '',
  profiles: [],
  experience: [],
  education: [],
  skills: [],
  languages: [],
  certifications: [],
  projects: [],
  interests: [],
  references: '',
});

/**
 * Guarantee a complete, capped, safely-shaped content object.
 *
 * This is the last line of defence against the seed-data fallback: whatever the
 * parser managed to find, every key leaves here defined.
 */
export const finalizeContent = (partial: Partial<ImportedContent>): ImportedContent => {
  const base = emptyContent();
  const basics = { ...base.basics, ...(partial.basics ?? {}) };

  return {
    basics: {
      name: cap(basics.name, CAPS.short),
      headline: cap(basics.headline, CAPS.short),
      photo: basics.photo,
      email: cap(basics.email, CAPS.short),
      phone: cap(basics.phone, CAPS.short),
      website: cap(basics.website, CAPS.short),
      location: cap(basics.location, CAPS.short),
    },
    summary: cap(partial.summary ?? '', CAPS.long),
    profiles: partial.profiles ?? [],
    experience: (partial.experience ?? []).map(item => ({
      ...item,
      company: cap(item.company, CAPS.short),
      position: cap(item.position, CAPS.short),
      location: cap(item.location, CAPS.short),
      summary: cap(item.summary, CAPS.long),
    })),
    education: (partial.education ?? []).map(item => ({
      ...item,
      institution: cap(item.institution, CAPS.short),
      degree: cap(item.degree, CAPS.short),
      areaOfStudy: cap(item.areaOfStudy, CAPS.short),
      summary: cap(item.summary, CAPS.long),
    })),
    skills: partial.skills ?? [],
    languages: partial.languages ?? [],
    certifications: partial.certifications ?? [],
    projects: (partial.projects ?? []).map(item => ({
      ...item,
      name: cap(item.name, CAPS.short),
      role: cap(item.role, CAPS.short),
      description: cap(item.description, CAPS.long),
    })),
    interests: partial.interests ?? [],
    // references is a string in ResumeData, never an array.
    references: cap(partial.references ?? '', CAPS.long),
  };
};
