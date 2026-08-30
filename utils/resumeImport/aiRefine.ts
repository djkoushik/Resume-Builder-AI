// Optional AI refinement of the entries the heuristics had to guess at.
//
// This module is strictly additive. Every failure — offline, slow, rate
// limited, malformed reply, wrong counts — returns the heuristic result
// unchanged with an `ai-unavailable` warning attached. Nothing downstream may
// treat a refined import as different from an unrefined one.

import type { ParsedResume } from './types';

/** Client-side ceiling. The server enforces its own, lower where it disagrees. */
const MAX_BLOCK_CHARS = 4000;
const MAX_BLOCKS = 25;
/** Longer than the server's own provider timeout, so the server answers first. */
const REQUEST_TIMEOUT_MS = 15_000;

interface RefinedExperience {
  company?: string;
  position?: string;
  location?: string;
}

interface RefinedEducation {
  institution?: string;
  degree?: string;
  areaOfStudy?: string;
}

interface RefineResponse {
  success?: boolean;
  data?: { experience?: RefinedExperience[]; education?: RefinedEducation[] };
}

/** Positions with a stored heading, in ascending order — the order we send. */
const flaggedPositions = (headings: Record<number, string>): number[] =>
  Object.keys(headings)
    .map(Number)
    .filter(position => Number.isInteger(position) && headings[position].trim() !== '')
    .sort((a, b) => a - b)
    .slice(0, MAX_BLOCKS);

/** Prefer the model's answer, but never let it blank a value we already have. */
const preferred = (refined: string | undefined, current: string): string => {
  const trimmed = (refined ?? '').trim();
  return trimmed === '' ? current : trimmed;
};

const withWarning = (parsed: ParsedResume): ParsedResume =>
  parsed.warnings.includes('ai-unavailable')
    ? parsed
    : { ...parsed, warnings: [...parsed.warnings, 'ai-unavailable'] };

/**
 * Ask the server to re-split the headings the parser was unsure about.
 *
 * Only the flagged entries are sent, so a cleanly parsed resume makes no
 * network call at all. Contact details are never included: name, email, phone
 * and address are resolved deterministically in the browser and stay there.
 */
export const refineWithAI = async (parsed: ParsedResume): Promise<ParsedResume> => {
  const headings = parsed.rawHeadings;
  if (!headings) return parsed;

  const experiencePositions = flaggedPositions(headings.experience);
  const educationPositions = flaggedPositions(headings.education);

  // Nothing was guessed. There is nothing to improve and no reason to send
  // anyone's resume anywhere.
  if (experiencePositions.length === 0 && educationPositions.length === 0) return parsed;

  const body = {
    blocks: {
      experience: experiencePositions.map(p => headings.experience[p].slice(0, MAX_BLOCK_CHARS)),
      education: educationPositions.map(p => headings.education[p].slice(0, MAX_BLOCK_CHARS)),
    },
  };

  let payload: RefineResponse;

  try {
    const response = await fetch('/api/parse-resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) return withWarning(parsed);

    payload = (await response.json()) as RefineResponse;
  } catch {
    return withWarning(parsed);
  }

  if (payload?.success !== true || !payload.data) return withWarning(parsed);

  const refinedExperience = payload.data.experience ?? [];
  const refinedEducation = payload.data.education ?? [];

  // The server validates counts too. Re-checking here costs nothing and means
  // a future server change cannot silently misalign the merge.
  if (
    refinedExperience.length !== experiencePositions.length ||
    refinedEducation.length !== educationPositions.length
  ) {
    return withWarning(parsed);
  }

  const experience = [...parsed.content.experience];
  const education = [...parsed.content.education];
  const resolved = new Set<string>();

  experiencePositions.forEach((position, index) => {
    const entry = experience[position];
    const refined = refinedExperience[index];
    if (!entry || !refined) return;

    experience[position] = {
      ...entry,
      company: preferred(refined.company, entry.company),
      position: preferred(refined.position, entry.position),
      location: preferred(refined.location, entry.location),
    };

    resolved.add(`experience.${position}.company`);
    resolved.add(`experience.${position}.position`);
  });

  educationPositions.forEach((position, index) => {
    const entry = education[position];
    const refined = refinedEducation[index];
    if (!entry || !refined) return;

    education[position] = {
      ...entry,
      institution: preferred(refined.institution, entry.institution),
      degree: preferred(refined.degree, entry.degree),
      areaOfStudy: preferred(refined.areaOfStudy, entry.areaOfStudy),
    };

    resolved.add(`education.${position}.institution`);
    resolved.add(`education.${position}.degree`);
  });

  return {
    ...parsed,
    content: { ...parsed.content, experience, education },
    // These are no longer guesses, so the review panel stops flagging them.
    lowConfidence: parsed.lowConfidence.filter(path => !resolved.has(path)),
  };
};
