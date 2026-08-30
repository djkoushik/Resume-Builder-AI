// Shared types for the resume import pipeline.

import type {
  Basics, Certification, Education, Interest, Language, Profile, Project, Skill, WorkExperience,
} from '../../types';

/** Machine-readable reasons an import could not proceed, or proceeded with caveats. */
export type ImportWarningCode =
  | 'scanned-pdf'         // PDF has no text layer (a scan or photo)
  | 'own-export'          // no text layer, and the metadata says we made it (rasterised export)
  | 'legacy-doc'          // .doc binary format — not supported
  | 'unsupported-type'    // anything that is not .pdf or .docx
  | 'too-large'           // over MAX_FILE_BYTES
  | 'empty'               // parsed fine but yielded nothing usable
  | 'password-protected'  // PDF needs a password to open
  | 'corrupt-file'        // the file could not be opened at all
  | 'ai-unavailable';     // Phase 2 refinement failed; heuristic results stand

export class ImportError extends Error {
  constructor(
    public readonly code: ImportWarningCode,
    message: string,
    /** The underlying failure, kept so the UI can show something diagnosable. */
    public readonly detail?: string
  ) {
    super(message);
    this.name = 'ImportError';
  }
}

/** One run of text from a PDF, with the page and position we need for column detection. */
export interface PositionedText {
  str: string;
  /** Horizontal offset in PDF user-space units, origin at the left edge. */
  x: number;
  /** Vertical offset in PDF user-space units, origin at the BOTTOM of the page. */
  y: number;
  page: number;
}

export interface ExtractResult {
  /** Plain text in reading order, sections separated by blank lines. */
  text: string;
  /** Positioned runs — populated for PDFs only; DOCX has no geometry to report. */
  items: PositionedText[];
  pageCount: number;
  warnings: ImportWarningCode[];
}

export const MAX_FILE_BYTES = 10 * 1024 * 1024;

/** Below this many non-whitespace characters, a PDF is treated as having no text layer. */
export const MIN_MEANINGFUL_CHARS = 100;


/**
 * The content half of ResumeData — everything an imported file can supply.
 *
 * Deliberately excludes `sectionOrder`, `layout` and `resumeMode`: those are
 * presentation state owned by the app, and letting a parser set them would
 * break the builder's column layout.
 *
 * Every key is required. That is the whole point: a section the parser did not
 * find must arrive as an explicit empty value, because anything merged as
 * `undefined` falls through to the John Doe seed data.
 */
export interface ImportedContent {
  basics: Basics;
  summary: string;
  profiles: Profile[];
  experience: WorkExperience[];
  education: Education[];
  skills: Skill[];
  languages: Language[];
  certifications: Certification[];
  projects: Project[];
  interests: Interest[];
  references: string;
}

/** Entry heading text as it appeared in the file, keyed by array position. */
export interface RawHeadings {
  experience: Record<number, string>;
  education: Record<number, string>;
}

export interface ParsedResume {
  content: ImportedContent;
  /** Dotted paths the parser had to guess, e.g. `basics.headline`, `experience.0.company`. */
  lowConfidence: string[];
  warnings: ImportWarningCode[];
  /**
   * Source text for the entries the heuristics had to guess at, kept so the
   * optional refinement pass has something to re-read. Only the guessed
   * entries appear here — a confident split is not worth a network call.
   */
  rawHeadings?: RawHeadings;
}
