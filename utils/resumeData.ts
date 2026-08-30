// Shared, shape-safe merging of incoming resume data.
//
// Used by both the JSON import in CustomizationPanel and the file import.
// The two need different defaults, which is what `source` selects:
//
//   'json' — an exported file always carries every key, so a missing one means
//            a hand-edited or truncated file. Falls back to the seed data,
//            exactly as this logic behaved before it moved here.
//
//   'file' — a parsed PDF or DOCX routinely lacks whole sections. Missing means
//            "the resume does not have this", so it must default to EMPTY.
//            Falling back to the seed would put John Doe's projects and phone
//            number into a real user's exported PDF.

import { initialResumeData, type ResumeData } from '../types';
import type { ImportedContent } from './resumeImport/types';

export type MergeSource = 'json' | 'file';

export interface MergeOptions {
  source: MergeSource;
  /** Existing state, used to carry presentation settings across a file import. */
  current?: ResumeData;
}

/** Content keys only — everything a resume actually says, minus how it looks. */
const CONTENT_KEYS = [
  'basics', 'summary', 'profiles', 'experience', 'education', 'skills',
  'languages', 'certifications', 'projects', 'interests', 'references',
] as const;

/**
 * Has the user actually put anything into this resume?
 *
 * Deliberately ignores `resumeMode`, `sectionOrder` and `layout`: navigating to
 * /build-custom-resume sets `resumeMode: 'custom'`, so a naive whole-object
 * comparison marks every Custom-mode visitor as having unsaved work and shows
 * them a data-loss warning they have not earned.
 */
export const isPristineResume = (data: ResumeData): boolean =>
  CONTENT_KEYS.every(
    key => JSON.stringify(data[key]) === JSON.stringify(initialResumeData[key])
  );

const asArray = <T,>(value: unknown, fallback: T[]): T[] =>
  Array.isArray(value) ? (value as T[]) : fallback;

const asString = (value: unknown, fallback: string): string =>
  typeof value === 'string' ? value : fallback;

/**
 * Merge incoming resume data over a safe baseline.
 *
 * Always returns a complete, renderable {@link ResumeData}; never throws on
 * malformed input.
 */
export const mergeResumeData = (incoming: unknown, options: MergeOptions): ResumeData => {
  const data = (incoming ?? {}) as Partial<ResumeData>;
  const current = options.current ?? initialResumeData;

  if (options.source === 'json') {
    // Preserved verbatim from CustomizationPanel.handleFileChange so the
    // existing JSON import behaves exactly as it always has.
    return {
      ...initialResumeData,
      ...data,
      basics: { ...initialResumeData.basics, ...(data.basics ?? {}) },
      layout: { ...initialResumeData.layout, ...(data.layout ?? {}) },
      profiles: data.profiles ?? initialResumeData.profiles,
      experience: data.experience ?? initialResumeData.experience,
      education: data.education ?? initialResumeData.education,
      skills: data.skills ?? initialResumeData.skills,
      languages: data.languages ?? initialResumeData.languages,
      certifications: data.certifications ?? initialResumeData.certifications,
      projects: data.projects ?? initialResumeData.projects,
      sectionOrder: data.sectionOrder ?? initialResumeData.sectionOrder,
    };
  }

  // source === 'file': empty defaults throughout, presentation from `current`.
  const basics = (data.basics ?? {}) as Partial<ResumeData['basics']>;

  return {
    basics: {
      name: asString(basics.name, ''),
      headline: asString(basics.headline, ''),
      // No resume file carries a photo, so keep whatever the user already had
      // rather than silently clearing it on a mid-session import.
      photo: asString(basics.photo, '') || current.basics.photo,
      email: asString(basics.email, ''),
      phone: asString(basics.phone, ''),
      website: asString(basics.website, ''),
      location: asString(basics.location, ''),
    },
    summary: asString(data.summary, ''),
    profiles: asArray(data.profiles, []),
    experience: asArray(data.experience, []),
    education: asArray(data.education, []),
    skills: asArray(data.skills, []),
    languages: asArray(data.languages, []),
    certifications: asArray(data.certifications, []),
    projects: asArray(data.projects, []),
    interests: asArray(data.interests, []),
    references: asString(data.references, ''),

    // Presentation is the app's, never the imported file's.
    sectionOrder: current.sectionOrder,
    layout: current.layout,
    resumeMode: current.resumeMode,
  };
};

/**
 * Apply parsed file content onto the current resume.
 *
 * Content is replaced wholesale — merging two different resumes section by
 * section produces confusing hybrids — while template, column layout and mode
 * carry over untouched.
 */
export const applyImportedContent = (
  current: ResumeData,
  content: ImportedContent
): ResumeData => mergeResumeData(content, { source: 'file', current });
