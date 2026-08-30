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

const BULLET_PREFIX = /^\s*[•▪‣◦·*\-–—]\s+/;

/** Is this line already a bullet in the source document? */
export const isBulletLine = (line: string): boolean => BULLET_PREFIX.test(line);

/**
 * Convert achievement lines to the `"* point"` form.
 *
 * `renderSummaryList` in every resume template splits on `\n` and tests
 * `startsWith('*')`. Any other marker renders as a flat paragraph.
 */
export const toBulletFormat = (lines: string[]): string =>
  lines
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => (isBulletLine(line) ? `* ${line.replace(BULLET_PREFIX, '').trim()}` : line))
    .join('\n');

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
