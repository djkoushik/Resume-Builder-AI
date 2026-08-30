// Splits flat resume text into labelled blocks.
//
// Resumes are wildly inconsistent in wording but remarkably consistent in
// shape: a contact block at the top, then headed sections. Detecting those
// headers reliably is what makes the rest of the parsing tractable.

export type SectionKey =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'languages'
  | 'interests'
  | 'references';

export interface SplitResult {
  /** Lines above the first recognised header — name, contact details, links. */
  contact: string[];
  /** Lines belonging to each section that was found. */
  sections: Partial<Record<SectionKey, string[]>>;
  /** Headers we saw but do not map to anything, kept for diagnostics. */
  unknownHeadings: string[];
}

/**
 * Header wordings we recognise, longest-first within each group so that
 * "WORK EXPERIENCE" is not shadowed by a looser "EXPERIENCE" entry.
 */
const HEADINGS: Array<[SectionKey, string[]]> = [
  ['summary', [
    'professional summary', 'career objective', 'career summary', 'executive summary',
    'summary', 'objective', 'profile', 'about me', 'about', 'overview',
  ]],
  ['experience', [
    'professional experience', 'employment history', 'relevant experience',
    'work experience', 'career history', 'work history', 'experience', 'employment',
  ]],
  ['education', [
    'educational qualifications', 'academic background', 'academic qualifications',
    'education', 'academics', 'qualifications',
  ]],
  ['skills', [
    'technical skills', 'core competencies', 'areas of expertise', 'key skills',
    'skills and abilities', 'technologies', 'competencies', 'tech stack',
    'expertise', 'skills',
  ]],
  ['projects', [
    'selected projects', 'personal projects', 'key projects', 'side projects',
    'projects',
  ]],
  ['certifications', [
    'certifications and licenses', 'licenses and certifications', 'certifications',
    'certificates', 'accreditations', 'licenses', 'courses', 'training',
  ]],
  ['languages', ['language proficiency', 'languages known', 'languages']],
  ['interests', ['interests and hobbies', 'extracurricular', 'activities', 'interests', 'hobbies']],
  ['references', ['references']],
];

/**
 * Headings whose content belongs in the contact block rather than a section of
 * its own. Sidebar layouts almost always label this, and without it the
 * unknown-heading rule below would discard the user's email and phone.
 */
const CONTACT_HEADINGS = [
  'contact information', 'personal information', 'contact details',
  'personal details', 'contact', 'details',
];

/** Strip decoration so "— WORK EXPERIENCE —" and "Work Experience:" compare equal. */
const normalizeHeading = (line: string): string =>
  line
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Headers are short, standalone, and rarely end in sentence punctuation. */
const looksLikeHeading = (line: string): boolean => {
  const trimmed = line.trim();
  if (trimmed.length === 0 || trimmed.length > 45) return false;
  if (/[.;,]$/.test(trimmed)) return false;
  // A line with several digits is a date line or an address, not a header.
  if ((trimmed.match(/\d/g) || []).length > 4) return false;
  return true;
};

type HeadingMatch = SectionKey | 'contact';

const matchHeading = (line: string): HeadingMatch | null => {
  if (!looksLikeHeading(line)) return null;

  const normalized = normalizeHeading(line);
  if (normalized.length === 0) return null;

  if (CONTACT_HEADINGS.includes(normalized)) return 'contact';

  for (const [key, variants] of HEADINGS) {
    for (const variant of variants) {
      if (normalized === variant) return key;
    }
  }
  return null;
};

/**
 * Could this ALL-CAPS line be a section we do not recognise?
 *
 * Deliberately strict, because the consequence of a false positive is that the
 * content underneath is discarded. A comma means a list ("HTML, CSS, JS"), a
 * digit means a date or an address, and anything over three words is prose.
 */
const isUnknownHeadingCandidate = (line: string): boolean => {
  const trimmed = line.trim();
  if (!looksLikeHeading(trimmed)) return false;
  if (trimmed.length < 3) return false;
  if (trimmed.includes(',')) return false;
  if (/\d/.test(trimmed)) return false;

  const letters = trimmed.replace(/[^A-Za-z]/g, '');
  if (letters.length < 3) return false;

  return letters === letters.toUpperCase() && trimmed.split(/\s+/).length <= 3;
};

/** The nearest line with content in the given direction, or null. */
const meaningfulNeighbour = (
  lines: string[],
  from: number,
  step: 1 | -1
): string | null => {
  for (let i = from + step; i >= 0 && i < lines.length; i += step) {
    if (lines[i].trim() !== '') return lines[i];
  }
  return null;
};

export const splitSections = (text: string): SplitResult => {
  const lines = text.split('\n').map(line => line.replace(/\s+$/, ''));

  const contact: string[] = [];
  const sections: Partial<Record<SectionKey, string[]>> = {};
  const unknownHeadings: string[] = [];

  let current: SectionKey | null = null;
  let inUnknown = false;
  // Until a heading we recognise appears, everything is preamble: name, job
  // title, contact details. Applying the unknown-heading rule there would
  // treat an all-caps job title as a section boundary and throw away the
  // email and phone underneath it.
  let seenKnownHeading = false;

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const heading = matchHeading(line);

    if (heading) {
      inUnknown = false;
      seenKnownHeading = true;

      if (heading === 'contact') {
        // Route back into the contact block rather than opening a section.
        current = null;
        continue;
      }

      current = heading;
      // A repeated header appends rather than replacing — some resumes split
      // experience across pages and repeat the heading.
      if (!sections[heading]) sections[heading] = [];
      continue;
    }

    if (seenKnownHeading && isUnknownHeadingCandidate(line)) {
      // A real heading stands alone. A run of all-caps lines is a list of
      // acronym skills, so a candidate is only a heading when NEITHER
      // neighbour looks like one — checking only the next line misclassifies
      // the last acronym in a run, which then truncates the section.
      const previous = meaningfulNeighbour(lines, index, -1);
      const next = meaningfulNeighbour(lines, index, 1);

      const isolated =
        (previous === null || !isUnknownHeadingCandidate(previous)) &&
        next !== null &&
        !isUnknownHeadingCandidate(next);

      if (isolated) {
        unknownHeadings.push(line.trim());
        current = null;
        inUnknown = true;
        continue;
      }
    }

    if (inUnknown) continue;

    if (current === null) {
      contact.push(line);
    } else {
      sections[current]!.push(line);
    }
  }

  // Trim leading/trailing blank lines from every block.
  const trim = (block: string[]): string[] => {
    let start = 0;
    let end = block.length;
    while (start < end && block[start].trim() === '') start++;
    while (end > start && block[end - 1].trim() === '') end--;
    return block.slice(start, end);
  };

  for (const key of Object.keys(sections) as SectionKey[]) {
    sections[key] = trim(sections[key]!);
  }

  return { contact: trim(contact), sections, unknownHeadings };
};

const BULLET_LINE = /^\s*[\u2022\u25aa\u2023\u25e6\u00b7*\-\u2013\u2014]\s+/;

const DATE_RANGE_LINE =
  /(?:[A-Za-z]{3,9}\.?\s*'?\d{2,4}|\d{1,2}[/\-.]\d{4}|\b\d{4}\b)\s*(?:\u2013|\u2014|-|to|until|through)\s*(?:present|current|now|ongoing|[A-Za-z]{3,9}\.?\s*'?\d{2,4}|\d{1,2}[/\-.]\d{4}|\b\d{4}\b)/i;

/**
 * Break a dated section (experience, education) into entries.
 *
 * Blank lines are the primary signal, but they cannot be relied on alone: Word
 * authors separate entries with paragraph spacing rather than empty
 * paragraphs, and that spacing does not survive into text. Two further
 * boundaries cover it:
 *
 *  - a non-bullet line straight after a bullet — bullets belong to the entry
 *    above them, so the next ordinary line starts a new one;
 *  - a second date range inside one entry, which means two roles have merged.
 */
export const splitDatedEntries = (lines: string[]): string[][] => {
  const entries: string[][] = [];
  let entry: string[] = [];
  let sawBullet = false;
  let lastDateIndex = -1;

  const commit = (block: string[]): void => {
    if (block.length > 0) entries.push(block);
  };

  const restart = (carry: string[] = []): void => {
    entry = carry;
    sawBullet = false;
    lastDateIndex = carry.findIndex(line => DATE_RANGE_LINE.test(line));
  };

  for (const line of lines) {
    if (line.trim() === '') {
      commit(entry);
      restart();
      continue;
    }

    const isBullet = BULLET_LINE.test(line);
    const hasDateRange = DATE_RANGE_LINE.test(line);

    if (entry.length > 0) {
      // A bullet that wraps onto a second line is a continuation, not a new
      // entry. Wrapped text carries on mid-sentence, so a lowercase opening is
      // the reliable tell.
      const continuesBullet = sawBullet && /^[a-z]/.test(line.trim());

      if (!isBullet && sawBullet && !continuesBullet) {
        commit(entry);
        restart();
      } else if (hasDateRange && lastDateIndex >= 0) {
        // A second date means two entries have merged. Where the boundary
        // falls depends on the layout: with the date last ("Acme Ltd" then
        // "2019 - 2021"), the lines after it already belong to the next
        // entry; with the date first, as in a date-column table, they do not.
        const head = entry.slice(0, lastDateIndex + 1);
        const carry = entry.slice(lastDateIndex + 1);
        const headHasContent = head.some(item => !DATE_RANGE_LINE.test(item));

        if (carry.length > 0 && headHasContent) {
          commit(head);
          restart(carry);
        } else {
          commit(entry);
          restart();
        }
      }
    }

    entry.push(line);
    if (isBullet) sawBullet = true;
    if (hasDateRange) lastDateIndex = entry.length - 1;
  }

  commit(entry);
  return entries;
};

/**
 * Break a section's lines into entries on blank lines.
 *
 * PDF extraction reconstructs those blank lines from vertical spacing, so this
 * works for both formats. Falls back to treating the whole block as one entry.
 */
export const splitEntries = (lines: string[]): string[][] => {
  const entries: string[][] = [];
  let currentEntry: string[] = [];

  for (const line of lines) {
    if (line.trim() === '') {
      if (currentEntry.length > 0) {
        entries.push(currentEntry);
        currentEntry = [];
      }
    } else {
      currentEntry.push(line);
    }
  }
  if (currentEntry.length > 0) entries.push(currentEntry);

  return entries;
};
