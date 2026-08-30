// Orchestrates the import pipeline: file in, reviewable resume content out.

import { refineWithAI } from './aiRefine';
import { extractText } from './extractText';
import { parseResumeText } from './heuristicParser';
import { ImportError, type ParsedResume } from './types';

export { ImportError, MAX_FILE_BYTES } from './types';
export type { ImportWarningCode, ImportedContent, ParsedResume } from './types';

export type ImportStage = 'reading' | 'sections' | 'structuring' | 'review';

export interface ImportOptions {
  /**
   * Send the entries the parser guessed at to `/api/parse-resume` for a second
   * opinion. The user can decline; declining costs accuracy on ambiguous
   * headings and nothing else.
   */
  useAI?: boolean;
}

export interface ImportProgress {
  stage: ImportStage;
  /** Populated once the file has been read. */
  pageCount?: number;
  sectionCount?: number;
}

/**
 * Read a resume file and turn it into reviewable content.
 *
 * The file itself never leaves the browser. When AI refinement is enabled and
 * the parser had to guess at an entry, that entry's heading text — and nothing
 * else — is sent to `/api/parse-resume`. A failure there is absorbed: the
 * heuristic result stands and the review screen says so.
 */
export const importResumeFile = async (
  file: File,
  onProgress?: (progress: ImportProgress) => void,
  options: ImportOptions = {}
): Promise<ParsedResume> => {
  onProgress?.({ stage: 'reading' });

  const extracted = await extractText(file);

  // A file we could open but could not read text from cannot be parsed. The UI
  // turns this into specific guidance rather than a generic failure.
  if (extracted.warnings.includes('own-export')) {
    throw new ImportError(
      'own-export',
      'This is a resume you exported from BuildResumeNow. Our PDFs are saved as images, so there is no text to read back.'
    );
  }
  if (extracted.warnings.includes('scanned-pdf')) {
    throw new ImportError(
      'scanned-pdf',
      'This PDF looks like a scan or photo — the pages are images, with no text layer for us to read.'
    );
  }
  if (extracted.warnings.includes('empty') || extracted.text.trim() === '') {
    throw new ImportError('empty', 'We could not find any text in that file.');
  }

  onProgress?.({ stage: 'sections', pageCount: extracted.pageCount });

  onProgress?.({ stage: 'structuring', pageCount: extracted.pageCount });

  const parsed = parseResumeText(extracted.text);

  const { content } = parsed;
  const foundAnything =
    content.basics.name !== '' ||
    content.basics.email !== '' ||
    content.experience.length > 0 ||
    content.education.length > 0 ||
    content.skills.length > 0;

  if (!foundAnything) {
    throw new ImportError(
      'empty',
      'We read the file but could not recognise any resume content in it.'
    );
  }

  const combined: ParsedResume = {
    ...parsed,
    warnings: [...parsed.warnings, ...extracted.warnings],
  };

  // Refinement stays inside the `structuring` stage: it is more structuring,
  // and a stage that sometimes does not happen would flicker in the progress
  // list. `refineWithAI` resolves with the input on every failure path, so
  // nothing here needs a catch.
  const refined = options.useAI === false ? combined : await refineWithAI(combined);

  onProgress?.({ stage: 'review' });

  return refined;
};

/** Human-readable counts for the review screen header. */
export const summarizeContent = (parsed: ParsedResume): string => {
  const { content } = parsed;
  const parts: string[] = [];

  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

  if (content.experience.length) parts.push(plural(content.experience.length, 'role', 'roles'));
  if (content.education.length) parts.push(plural(content.education.length, 'degree', 'degrees'));

  const skillCount = content.skills.reduce((total, group) => total + group.keywords.length, 0);
  if (skillCount) parts.push(plural(skillCount, 'skill', 'skills'));

  if (content.certifications.length) {
    parts.push(plural(content.certifications.length, 'certification', 'certifications'));
  }

  if (parts.length === 0) return 'No sections found';
  if (parts.length === 1) return `Found ${parts[0]}`;

  return `Found ${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
};
