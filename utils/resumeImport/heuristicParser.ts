// Rule-based resume parsing. No network, no model, no surprises.
//
// This layer is deliberately the whole feature on its own: it must produce a
// usable resume when the optional AI refinement is unavailable. Anything it has
// to guess is reported in `lowConfidence` so the review step can flag it.

import type {
  Certification, Education, Interest, Profile, Project, Skill, WorkExperience,
} from '../../types';
import { splitDatedEntries, splitEntries, splitSections, type SectionKey } from './sectionSplitter';
import {
  cap, CAPS, finalizeContent, isBulletLine, makeId, parseDateRange, toBulletFormat,
} from './normalize';
import type { ImportedContent, ParsedResume } from './types';

// --- Contact details -------------------------------------------------------

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/;
// Deliberately permissive: international formats vary far more than the
// well-known North American patterns suggest.
// The inner run allows as few as five separator/digit characters so a
// parenthesised area code plus a seven-digit local part — "(555) 123-4567" —
// still matches; isPlausiblePhone enforces the real >= 7-digit floor.
const PHONE = /(?:\+\d{1,3}[\s.-]?)?(?:\(\d{1,4}\)[\s.-]?)?\d[\d\s.-]{5,14}\d/;
const URL = /(?:https?:\/\/)?(?:www\.)?[\w-]+\.[a-z]{2,}(?:\/[\w./#?=&%-]*)?/i;

/** "2019 - 2021" satisfies the permissive phone pattern; it is a date. */
const YEAR_RANGE = /^\d{4}\s*(?:[-\u2013\u2014]|to)\s*\d{4}$/i;

const isPlausiblePhone = (value: string): boolean => {
  const trimmed = value.trim();
  if (YEAR_RANGE.test(trimmed)) return false;

  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
};

const PROFILE_HOSTS: Array<{ network: string; pattern: RegExp }> = [
  { network: 'LinkedIn', pattern: /linkedin\.com\/in\/([\w-]+)/i },
  { network: 'GitHub', pattern: /github\.com\/([\w-]+)/i },
  { network: 'Twitter', pattern: /(?:twitter|x)\.com\/([\w-]+)/i },
  { network: 'StackOverflow', pattern: /stackoverflow\.com\/users\/[\d]+\/([\w-]+)/i },
];

/** A name line: no digits, no @, few words, and not shouting a section header. */
const looksLikeName = (line: string): boolean => {
  const trimmed = line.trim();
  if (trimmed.length === 0 || trimmed.length > 60) return false;
  if (/[@\d]/.test(trimmed)) return false;
  if (trimmed.includes('|') || trimmed.includes('•')) return false;

  const words = trimmed.split(/\s+/);
  return words.length >= 2 && words.length <= 5;
};

interface ContactResult {
  basics: ImportedContent['basics'];
  profiles: Profile[];
  lowConfidence: string[];
}

const parseContact = (lines: string[]): ContactResult => {
  const joined = lines.join('\n');
  const lowConfidence: string[] = [];

  const email = joined.match(EMAIL)?.[0] ?? '';

  // Look for a phone only on lines without an email, so the local part of an
  // address is never mistaken for a number.
  let phone = '';
  for (const line of lines) {
    const searchable = EMAIL.test(line)
      ? line.replace(new RegExp(EMAIL.source, 'g'), ' ')
      : line;

    for (const candidate of searchable.match(new RegExp(PHONE.source, 'g')) ?? []) {
      if (isPlausiblePhone(candidate)) { phone = candidate.trim(); break; }
    }
    if (phone) break;
  }

  // A long contact line often wraps mid-URL in the source document, leaving
  // "linkedin.com/in/pr" on one line and "iyasharma" on the next. URLs never
  // contain whitespace, so the un-wrapped text recovers the full handle;
  // whichever match is longer wins.
  const condensed = joined.replace(/\s*\n\s*/g, '');

  const profiles: Profile[] = [];
  for (const { network, pattern } of PROFILE_HOSTS) {
    const direct = joined.match(pattern);
    const unwrapped = condensed.match(pattern);

    const match =
      unwrapped && (!direct || unwrapped[1].length > direct[1].length) ? unwrapped : direct;

    if (match) {
      profiles.push({
        id: makeId(profiles.length),
        network,
        username: match[1],
        url: match[0].startsWith('http') ? match[0] : `https://${match[0]}`,
      });
    }
  }

  // A personal site: a URL that is neither an email fragment nor a known
  // profile host. Emails are removed first — the local part of
  // "sam.taylor@outlook.com" is itself a valid-looking domain.
  const withoutEmails = joined.replace(new RegExp(EMAIL.source, 'g'), ' ');

  let website = '';
  for (const candidate of withoutEmails.match(new RegExp(URL.source, 'gi')) ?? []) {
    if (PROFILE_HOSTS.some(host => host.pattern.test(candidate))) continue;
    // A real TLD is lowercase in the source; this rejects "B.Tech" and friends.
    if (!/\.[a-z]{2,24}(?:[/:]|$)/.test(candidate)) continue;
    website = candidate;
    break;
  }

  const nonEmpty = lines.filter(line => line.trim() !== '');
  const name = nonEmpty.find(looksLikeName)?.trim() ?? '';
  if (name === '') lowConfidence.push('basics.name');

  // The headline is usually the line right after the name, when it is not a
  // contact line. This is a guess more often than not.
  let headline = '';
  const nameIndex = nonEmpty.findIndex(line => line.trim() === name);
  if (nameIndex >= 0 && nameIndex + 1 < nonEmpty.length) {
    const next = nonEmpty[nameIndex + 1].trim();
    if (!EMAIL.test(next) && !PHONE.test(next) && next.length <= CAPS.short) {
      headline = next;
      lowConfidence.push('basics.headline');
    }
  }

  // Location: a line with a comma, no digits-heavy content, no contact markers.
  let location = '';
  for (const line of nonEmpty) {
    const segments = line.split('|').map(part => part.trim());
    for (const segment of segments) {
      if (segment === name || segment === headline) continue;
      if (EMAIL.test(segment) || /\d{4}/.test(segment)) continue;
      if (segment.includes(',') && segment.length <= 60 && !URL.test(segment)) {
        location = segment;
        break;
      }
    }
    if (location) break;
  }
  if (location === '') lowConfidence.push('basics.location');

  return {
    basics: { name, headline, photo: '', email, phone, website, location },
    profiles,
    lowConfidence,
  };
};

// --- Skills ----------------------------------------------------------------

const SPLIT_SKILLS = /[,;|•·]|\s{3,}/;

const parseSkills = (lines: string[]): Skill[] => {
  const skills: Skill[] = [];
  const uncategorised: string[] = [];

  for (const raw of lines) {
    const line = raw.replace(/^\s*[•▪‣◦·*\-–—]\s+/, '').trim();
    if (line === '') continue;

    // "Languages: Go, Python, Java" — the shape that maps directly onto
    // ResumeData's {name, keywords[]} skill categories.
    const labelled = line.match(/^([A-Za-z][A-Za-z\s/&+#.-]{1,40}):\s*(.+)$/);
    if (labelled) {
      const keywords = labelled[2]
        .split(SPLIT_SKILLS)
        .map(word => word.trim())
        .filter(word => word.length > 0 && word.length <= 40);

      if (keywords.length > 0) {
        skills.push({
          id: makeId(skills.length),
          name: cap(labelled[1].trim(), CAPS.short),
          keywords,
        });
        continue;
      }
    }

    uncategorised.push(
      ...line.split(SPLIT_SKILLS).map(word => word.trim()).filter(word => word.length > 0 && word.length <= 40)
    );
  }

  if (uncategorised.length > 0) {
    skills.push({ id: makeId(skills.length), name: 'Skills', keywords: uncategorised });
  }

  return skills;
};

// --- Experience ------------------------------------------------------------

const COMPANY_MARKERS = /\b(inc|llc|ltd|limited|corp|corporation|gmbh|plc|pvt|technologies|solutions|systems|labs|studio|group|holdings|partners|consulting|services|software|media|bank|university)\b\.?/i;

const TITLE_WORDS = /\b(engineer|developer|manager|director|analyst|designer|architect|consultant|scientist|specialist|lead|head|officer|president|intern|associate|administrator|coordinator|executive|founder|principal|staff|programmer|researcher|strategist|writer|editor)\b/i;

const DATE_LINE = /(?:\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*'?\d{2,4}|\b\d{1,2}[/\-.]\d{4}\b|\b\d{4}\b)/i;

const CURRENT_MARKER = /\b(present|current|now|ongoing|till date|to date)\b/i;

/** Pull the date range out of a line and return it with the remaining text. */
const extractDates = (line: string): { range: string; rest: string } | null => {
  const hasDate = DATE_LINE.test(line);
  const hasCurrent = CURRENT_MARKER.test(line);
  if (!hasDate && !hasCurrent) return null;

  // Match a range: something date-ish, a separator, then something date-ish
  // or a "present" word.
  const rangePattern =
    /((?:[A-Za-z]{3,9}\.?\s*'?\d{2,4}|\d{1,2}[/\-.]\d{4}|\d{4})\s*(?:–|—|-|to|until|through)\s*(?:present|current|now|ongoing|till date|to date|[A-Za-z]{3,9}\.?\s*'?\d{2,4}|\d{1,2}[/\-.]\d{4}|\d{4}))/i;

  const match = line.match(rangePattern);
  if (match) {
    return { range: match[1], rest: line.replace(match[1], '').trim() };
  }

  // A lone year or month-year still tells us something.
  const single = line.match(/([A-Za-z]{3,9}\.?\s*'?\d{2,4}|\d{1,2}[/\-.]\d{4}|\d{4})/);
  if (single) {
    return { range: single[1], rest: line.replace(single[1], '').trim() };
  }

  return null;
};

/** Trim the leftovers of a date extraction: stray separators and empty segments. */
const tidySegment = (value: string): string =>
  value.replace(/^[\s|,\-–—•·]+|[\s|,\-–—•·]+$/g, '').trim();

interface SplitEntity {
  company: string;
  position: string;
  location: string;
  confident: boolean;
}

/**
 * Decide which part of a heading line is the employer and which is the role.
 *
 * This is the hardest thing in the parser and the reason the AI refinement in
 * Phase 2 exists. Company suffixes and job-title vocabulary carry it most of
 * the way; employers like "Google" or "Stripe" have neither, so anything
 * resolved by position alone is reported as a guess.
 */
/** Work-arrangement words that name a location without naming a place. */
const REMOTE_LOCATION = /^(remote|hybrid|on-?site|work from home)\b[\s(]*[\w\s,)-]*$/i;

/** A comma or the word "at" separating a role from its employer. */
const JOINED_SEPARATOR = /\s+\bat\b\s+|\s*,\s*/;

/**
 * Split "Senior Engineer, Acme Ltd" — one segment carrying both parts.
 *
 * Only acts when exactly one side has job-title vocabulary, so
 * "Acme Ltd, San Francisco" and "Engineer, Backend Systems" are left alone.
 */
const splitJoinedSegment = (segment: string): { company: string; position: string } | null => {
  const parts = segment.split(JOINED_SEPARATOR).map(tidySegment).filter(Boolean);
  if (parts.length !== 2) return null;

  const titled = parts.filter(part => TITLE_WORDS.test(part));
  if (titled.length !== 1) return null;

  const position = titled[0];
  const company = parts.find(part => part !== position) ?? '';
  return company === '' ? null : { company, position };
};

/**
 * Recover a company that was swallowed by the location.
 *
 * "Stripe, San Francisco, CA" has no company marker and no title vocabulary,
 * so it reads as a location and the employer disappears. When nothing else
 * supplied a company, the leading part of a three-part location is it.
 */
const withCompanyRepair = (result: SplitEntity): SplitEntity => {
  if (result.company !== '' || result.location === '') return result;

  const parts = result.location.split(',').map(part => part.trim()).filter(Boolean);
  if (parts.length < 3) return result;

  return {
    ...result,
    company: parts[0],
    location: parts.slice(1).join(', '),
    confident: false,
  };
};

const splitCompanyAndTitle = (segments: string[]): SplitEntity => {
  const cleaned = segments.map(tidySegment).filter(part => part.length > 0);

  if (cleaned.length === 0) {
    return { company: '', position: '', location: '', confident: false };
  }

  // A location segment reads "City, Region" and carries no title vocabulary.
  let location = '';
  const rest: string[] = [];
  for (const segment of cleaned) {
    const isLocation =
      REMOTE_LOCATION.test(segment) ||
      (segment.includes(',') &&
        segment.split(',').length <= 3 &&
        segment.length <= 40 &&
        !TITLE_WORDS.test(segment) &&
        !COMPANY_MARKERS.test(segment));

    if (isLocation && location === '') location = segment;
    else rest.push(segment);
  }

  if (rest.length === 0) {
    return withCompanyRepair({ company: '', position: '', location, confident: false });
  }

  if (rest.length === 1) {
    const only = rest[0];

    // "Senior Engineer, Acme Ltd" or "Senior Engineer at Acme Ltd" — the
    // separator is a comma or the word "at", neither of which SEGMENT_SPLIT
    // touches, because splitting on them globally would wreck "New York, NY"
    // and "Engineer, Backend Systems".
    const paired = splitJoinedSegment(only);
    if (paired) return withCompanyRepair({ ...paired, location, confident: true });

    // Title vocabulary makes it a role, a company marker makes it an employer,
    // otherwise assume employer.
    if (TITLE_WORDS.test(only) && !COMPANY_MARKERS.test(only)) {
      return withCompanyRepair({ company: '', position: only, location, confident: false });
    }
    return withCompanyRepair({
      company: only,
      position: '',
      location,
      confident: COMPANY_MARKERS.test(only),
    });
  }

  const titleIndex = rest.findIndex(part => TITLE_WORDS.test(part));
  const companyIndex = rest.findIndex(part => COMPANY_MARKERS.test(part));

  if (titleIndex >= 0 && companyIndex >= 0 && titleIndex !== companyIndex) {
    return withCompanyRepair({ company: rest[companyIndex], position: rest[titleIndex], location, confident: true });
  }
  if (titleIndex >= 0) {
    const other = rest.find((_, i) => i !== titleIndex) ?? '';
    return withCompanyRepair({ company: other, position: rest[titleIndex], location, confident: true });
  }
  if (companyIndex >= 0) {
    const other = rest.find((_, i) => i !== companyIndex) ?? '';
    return withCompanyRepair({ company: rest[companyIndex], position: other, location, confident: true });
  }

  // No vocabulary to go on — fall back to source order and flag it.
  return withCompanyRepair({ company: rest[0], position: rest[1] ?? '', location, confident: false });
};

const SEGMENT_SPLIT = /\s*[|•·]\s*|\s+[–—]\s+|\s+-\s+|\s{3,}/;

interface ParsedEntry<T> {
  entry: T;
  /** False when the split was a positional guess rather than a vocabulary match. */
  confident: boolean;
  /** The heading lines as they appeared, kept for optional AI refinement. */
  headingText: string;
}

const parseExperienceEntry = (lines: string[], index: number): ParsedEntry<WorkExperience> => {
  const bullets: string[] = [];
  const headingLines: string[] = [];
  const prose: string[] = [];

  for (const line of lines) {
    if (isBulletLine(line)) {
      bullets.push(line);
      continue;
    }

    // A bullet wrapped onto a second line belongs to that bullet. Wrapped text
    // carries on mid-sentence, so a lowercase opening is the reliable tell.
    if (bullets.length > 0 && /^[a-z]/.test(line.trim())) {
      bullets[bullets.length - 1] = `${bullets[bullets.length - 1].trimEnd()} ${line.trim()}`;
      continue;
    }

    // Plenty of resumes describe a role in a sentence rather than bullets.
    // Treating that as another heading segment threw the description away.
    // Five words plus sentence punctuation (or real length) separates it from
    // "Acme Inc." and "San Francisco, CA".
    const trimmed = line.trim();
    const wordCount = trimmed.split(/\s+/).length;
    const isProse =
      headingLines.length > 0 &&
      wordCount >= 5 &&
      (/[.!?]$/.test(trimmed) || trimmed.length > 60) &&
      !DATE_LINE.test(trimmed);

    if (isProse) prose.push(trimmed);
    else headingLines.push(line);
  }

  let range = '';
  const headingSegments: string[] = [];

  for (const line of headingLines) {
    const dates = extractDates(line);
    if (dates && range === '') {
      range = dates.range;
      if (dates.rest.trim() !== '') headingSegments.push(...dates.rest.split(SEGMENT_SPLIT));
    } else {
      headingSegments.push(...line.split(SEGMENT_SPLIT));
    }
  }

  const { company, position, location, confident } = splitCompanyAndTitle(headingSegments);
  const { startDate, endDate, isCurrent } = parseDateRange(range);

  return {
    confident,
    headingText: headingLines.map(line => line.trim()).filter(Boolean).join(' | '),
    entry: {
      id: makeId(index),
      company,
      position,
      location,
      startDate,
      endDate,
      isCurrent,
      summary: bullets.length > 0 ? toBulletFormat(bullets) : prose.join(' '),
    },
  };
};

// --- Education -------------------------------------------------------------

const INSTITUTION_MARKERS = /\b(university|college|institute|school|academy|polytechnic|iit|nit|iiit)\b/i;
const DEGREE_MARKERS = /\b(bachelor|master|b\.?tech|m\.?tech|b\.?sc|m\.?sc|b\.?e|m\.?e|b\.?a|m\.?a|mba|phd|diploma|associate|bs|ms)\b/i;

const parseEducationEntry = (lines: string[], index: number): ParsedEntry<Education> => {
  let range = '';
  const segments: string[] = [];

  for (const line of lines) {
    const dates = extractDates(line);
    if (dates && range === '') {
      range = dates.range;
      if (dates.rest.trim() !== '') segments.push(...dates.rest.split(SEGMENT_SPLIT));
    } else {
      segments.push(...line.split(SEGMENT_SPLIT));
    }
  }

  const cleaned = segments.map(tidySegment).filter(part => part.length > 0);

  const institution = cleaned.find(part => INSTITUTION_MARKERS.test(part)) ?? '';
  const degree = cleaned.find(part => DEGREE_MARKERS.test(part)) ?? '';
  const areaOfStudy = cleaned.find(part => part !== institution && part !== degree) ?? '';

  const { startDate, endDate } = parseDateRange(range);

  return {
    confident: institution !== '' && degree !== '',
    headingText: lines.map(line => line.trim()).filter(Boolean).join(' | '),
    entry: {
      id: makeId(index),
      institution: institution || cleaned[0] || '',
      degree: degree || cleaned[1] || '',
      areaOfStudy,
      startDate,
      endDate,
      summary: '',
    },
  };
};

// --- Simple sections -------------------------------------------------------

const parseCertifications = (entries: string[][]): Certification[] =>
  entries.map((lines, index) => {
    const flat = lines.join(' ').replace(/^\s*[•▪‣◦·*\-–—]\s+/, '').trim();
    const dates = extractDates(flat);
    const withoutDate = dates ? tidySegment(dates.rest) : flat;
    const parts = withoutDate.split(SEGMENT_SPLIT).map(tidySegment).filter(Boolean);

    return {
      id: makeId(index),
      name: cap(parts[0] ?? withoutDate, CAPS.short),
      issuer: cap(parts[1] ?? '', CAPS.short),
      date: dates ? parseDateRange(dates.range).startDate : '',
    };
  });

const parseProjects = (entries: string[][]): Project[] =>
  entries.map((lines, index) => {
    const [first, ...rest] = lines;
    const headline = (first ?? '').replace(/^\s*[•▪‣◦·*\-–—]\s+/, '').trim();
    const parts = headline.split(SEGMENT_SPLIT).map(tidySegment).filter(Boolean);
    const url = headline.match(URL)?.[0] ?? '';

    return {
      id: makeId(index),
      name: cap(parts[0] ?? headline, CAPS.short),
      role: cap(parts[1] ?? '', CAPS.short),
      description: rest.map(line => line.replace(/^\s*[•▪‣◦·*\-–—]\s+/, '').trim()).join(' ').trim(),
      url: url && !url.includes('@') ? url : '',
    };
  });

const parseInterests = (lines: string[]): Interest[] =>
  lines
    .flatMap(line => line.replace(/^\s*[•▪‣◦·*\-–—]\s+/, '').split(SPLIT_SKILLS))
    .map(part => part.trim())
    .filter(part => part.length > 0 && part.length <= 60)
    .map((name, index) => ({ id: makeId(index), name }));

// --- Entry point -----------------------------------------------------------

const sectionLines = (
  sections: Partial<Record<SectionKey, string[]>>,
  key: SectionKey
): string[] => sections[key] ?? [];

/**
 * Parse extracted resume text into builder-shaped content.
 *
 * Always returns a complete {@link ImportedContent}: sections that were not
 * found come back explicitly empty, never absent.
 */
export const parseResumeText = (text: string): ParsedResume => {
  const { contact, sections } = splitSections(text);
  const lowConfidence: string[] = [];

  const contactResult = parseContact(contact);
  lowConfidence.push(...contactResult.lowConfidence);

  // Paths are keyed on the entry's position in the finished array, not on the
  // splitter's index: entries that turn out to be noise are dropped, and a
  // path built before that point points at the wrong row in the review panel.
  const experience: WorkExperience[] = [];
  const experienceHeadings: Record<number, string> = {};

  splitDatedEntries(sectionLines(sections, 'experience')).forEach((lines, index) => {
    const { entry, confident, headingText } = parseExperienceEntry(lines, index);
    let inherited = false;

    // A promotion is written as a bare title under the employer it belongs to,
    // so an entry with a role but no company inherits the one above it.
    if (entry.company === '' && entry.position !== '' && experience.length > 0) {
      const previous = experience[experience.length - 1];
      if (previous.company !== '') {
        entry.company = previous.company;
        inherited = true;
      }
    }

    // An entry with nothing identifying it is noise, not a job.
    if (!entry.company && !entry.position && !entry.summary) return;

    const position = experience.length;
    experience.push(entry);

    if (!confident) {
      lowConfidence.push(`experience.${position}.company`, `experience.${position}.position`);
      if (headingText) experienceHeadings[position] = headingText;
    } else if (inherited) {
      lowConfidence.push(`experience.${position}.company`);
    }
  });

  const education: Education[] = [];
  const educationHeadings: Record<number, string> = {};

  splitDatedEntries(sectionLines(sections, 'education')).forEach((lines, index) => {
    const { entry, confident, headingText } = parseEducationEntry(lines, index);
    if (!entry.institution && !entry.degree) return;

    const position = education.length;
    education.push(entry);

    if (!confident) {
      lowConfidence.push(`education.${position}.institution`, `education.${position}.degree`);
      if (headingText) educationHeadings[position] = headingText;
    }
  });

  const summaryLines = sectionLines(sections, 'summary');
  const referenceLines = sectionLines(sections, 'references');

  const content = finalizeContent({
    basics: contactResult.basics,
    profiles: contactResult.profiles,
    summary: summaryLines.join(' ').replace(/\s+/g, ' ').trim(),
    experience,
    education,
    skills: parseSkills(sectionLines(sections, 'skills')),
    certifications: parseCertifications(splitEntries(sectionLines(sections, 'certifications'))),
    projects: parseProjects(splitEntries(sectionLines(sections, 'projects'))),
    interests: parseInterests(sectionLines(sections, 'interests')),
    references: referenceLines.join(' ').replace(/\s+/g, ' ').trim(),
  });

  return {
    content,
    lowConfidence: [...new Set(lowConfidence)],
    warnings: [],
    rawHeadings: { experience: experienceHeadings, education: educationHeadings },
  };
};
