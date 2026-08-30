// Client-side text extraction from PDF and DOCX.
//
// Both parsers are loaded with dynamic import() so they stay out of the main
// bundle — a visitor who never uploads a file never downloads them.
// The file itself never leaves the browser; only extracted text is ever sent
// anywhere, and only in the optional Phase 2 refinement step.

import {
  ExtractResult,
  ImportError,
  ImportWarningCode,
  MAX_FILE_BYTES,
  MIN_MEANINGFUL_CHARS,
  PositionedText,
} from './types';

type FileKind = 'pdf' | 'docx';

const classify = (file: File): FileKind => {
  const name = file.name.toLowerCase();

  if (name.endsWith('.pdf') || file.type === 'application/pdf') return 'pdf';
  if (name.endsWith('.docx')) return 'docx';

  if (name.endsWith('.doc')) {
    throw new ImportError(
      'legacy-doc',
      'Older .doc files are not supported. Please save the file as .docx or PDF and try again.'
    );
  }

  throw new ImportError(
    'unsupported-type',
    'Please choose a PDF or Word (.docx) file.'
  );
};

const countMeaningfulChars = (text: string): number => text.replace(/\s/g, '').length;

/**
 * A vertical gap this many times the median line spacing reads as a paragraph
 * break. Tuned low enough to catch section spacing, high enough to survive the
 * ragged leading that mixed font sizes produce.
 */
const PARAGRAPH_GAP_RATIO = 1.6;

/**
 * Below this many distinct text lines a page carries too little signal to
 * judge its layout. Counted in LINES rather than runs, because how many runs a
 * PDF emits per line is a property of the generator, not of the layout.
 */
const MIN_LINES_FOR_COLUMN_DETECTION = 10;

/** Each side of a real gutter holds at least this share of the page's runs. */
const MIN_COLUMN_SHARE = 0.15;

/** A gutter narrower than this share of the text width is ordinary word spacing. */
const MIN_GUTTER_RATIO = 0.12;

/**
 * At most this share of text lines may straddle the gutter. Section headers
 * that live in one column still leave the odd shared line; a full-width heading
 * band above the columns adds a few more. Beyond this the "gutter" is really
 * just word spacing inside a single column.
 */
const MAX_STRADDLING_LINE_RATIO = 0.5;

/** How a candidate gutter divides the page's lines. */
interface LineSplit {
  leftOnly: number;
  rightOnly: number;
  shared: number;
}

const classifyLines = (runs: PositionedText[], split: number): LineSplit => {
  const lines = new Map<number, { left: boolean; right: boolean }>();
  for (const run of runs) {
    const key = Math.round(run.y);
    const entry = lines.get(key) ?? { left: false, right: false };
    if (run.x < split) entry.left = true;
    else entry.right = true;
    lines.set(key, entry);
  }

  const result: LineSplit = { leftOnly: 0, rightOnly: 0, shared: 0 };
  for (const entry of lines.values()) {
    if (entry.left && entry.right) result.shared++;
    else if (entry.right) result.rightOnly++;
    else result.leftOnly++;
  }
  return result;
};

/**
 * Find the x coordinate separating two columns, or null for a single column.
 *
 * The hard part is not spotting two clusters of x values — a single-column
 * resume with right-aligned dates ("Acme Ltd .......... Jan 2019") produces
 * those too, and a genuine two-column page with right-aligned dates in the main
 * column produces *three* clusters, with the widest gap falling between the
 * main text and its dates rather than at the real gutter. So every gap wide
 * enough to be a gutter is tried as a candidate split, and the one that best
 * divides the page into two vertically independent halves wins. Right-aligned
 * text always shares a line with something on the other side, so it never
 * produces that clean division.
 */
const detectColumnSplit = (runs: PositionedText[]): number | null => {
  const distinctLines = new Set(runs.map(run => Math.round(run.y))).size;
  if (distinctLines < MIN_LINES_FOR_COLUMN_DETECTION) return null;

  const xs = runs.map(run => run.x).sort((a, b) => a - b);
  const span = xs[xs.length - 1] - xs[0];
  if (span <= 0) return null;

  const minRunsPerSide = runs.length * MIN_COLUMN_SHARE;

  let best: number | null = null;
  let bestSeparated = 0;

  for (let i = 0; i < xs.length - 1; i++) {
    const gap = xs[i + 1] - xs[i];
    if (gap < span * MIN_GUTTER_RATIO) continue;

    // Runs, not lines: enough text has to sit on each side to be a column.
    if (i + 1 < minRunsPerSide || xs.length - (i + 1) < minRunsPerSide) continue;

    const split = (xs[i] + xs[i + 1]) / 2;
    const { leftOnly, rightOnly, shared } = classifyLines(runs, split);

    // Both sides must own lines outright, and few lines may straddle — that is
    // what separates real columns from right-aligned text and stray indents.
    if (leftOnly === 0 || rightOnly === 0) continue;
    if (shared / (leftOnly + rightOnly + shared) > MAX_STRADDLING_LINE_RATIO) continue;

    const separated = leftOnly + rightOnly;
    if (separated > bestSeparated) {
      bestSeparated = separated;
      best = split;
    }
  }

  return best;
};

/**
 * Render one group of runs as text.
 *
 * Runs are grouped into lines by y, ordered left to right, and separated into
 * paragraphs wherever the vertical gap exceeds the usual line spacing.
 */
const renderRuns = (runs: PositionedText[]): string[] => {
  const lines = new Map<number, PositionedText[]>();
  for (const run of runs) {
    // Round to absorb sub-pixel drift within a single visual line.
    const key = Math.round(run.y);
    const bucket = lines.get(key);
    if (bucket) bucket.push(run);
    else lines.set(key, [run]);
  }

  // Top to bottom (PDF y grows upwards).
  const keys = [...lines.keys()].sort((a, b) => b - a);

  const rendered = keys.map(key =>
    lines
      .get(key)!
      .sort((a, b) => a.x - b.x)
      .map(run => run.str)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
  );

  // A PDF carries no blank lines, only whitespace. Recover paragraph breaks
  // from the vertical gaps: anything meaningfully larger than the usual line
  // spacing was a visual separation, and downstream entry-splitting depends
  // on it.
  const gaps: number[] = [];
  for (let i = 1; i < keys.length; i++) gaps.push(keys[i - 1] - keys[i]);
  const sorted = [...gaps].sort((a, b) => a - b);
  const medianGap = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0;
  const paragraphGap = medianGap * PARAGRAPH_GAP_RATIO;

  const out: string[] = [];
  for (let i = 0; i < rendered.length; i++) {
    const line = rendered[i];
    if (line.length === 0) continue;

    if (i > 0 && medianGap > 0 && keys[i - 1] - keys[i] > paragraphGap) {
      out.push('');
    }
    out.push(line);
  }

  return out;
};

/** How many lines at each end of a page can be a running header or footer. */
const PAGE_EDGE_LINES = 2;

/** Digits are masked so "Page 1 of 3" and "Page 2 of 3" compare equal. */
const normalizeForRepetition = (line: string): string =>
  line.toLowerCase().replace(/\d+/g, '#').replace(/\s+/g, ' ').trim();

const BULLET_START = /^\s*[\u2022\u25aa\u2023\u25e6\u00b7*\-\u2013\u2014]\s+/;

/**
 * Remove running headers and footers from a multi-page document.
 *
 * A candidate is a line near the top or bottom of a page; it is a running
 * header or footer if the same text (with digits masked, so page numbers
 * match) appears in the same position on at least half the pages. Single-page
 * documents are left alone — there is nothing to compare against, and a real
 * heading would be indistinguishable.
 */
const stripRunningHeadersAndFooters = (pages: string[][]): string[][] => {
  if (pages.length < 2) return pages;

  const counts = new Map<string, number>();

  const edgesOf = (lines: string[]): string[] => {
    const filled = lines.filter(line => line.trim() !== '');
    return [
      ...filled.slice(0, PAGE_EDGE_LINES),
      ...filled.slice(-PAGE_EDGE_LINES),
    ];
  };

  for (const lines of pages) {
    // Count each distinct line once per page, so a repeated line within one
    // page does not look like a running header.
    for (const key of new Set(edgesOf(lines).map(normalizeForRepetition))) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  const threshold = Math.max(2, Math.ceil(pages.length / 2));
  const repeated = new Set(
    [...counts.entries()].filter(([, count]) => count >= threshold).map(([key]) => key)
  );

  if (repeated.size === 0) return pages;

  return pages.map(lines => {
    const edges = new Set(edgesOf(lines));
    return lines.filter(
      line => !(edges.has(line) && repeated.has(normalizeForRepetition(line)))
    );
  });
};

/**
 * Join pages into one document.
 *
 * A page break in the middle of a job is not a paragraph break. Inserting a
 * blank line at every page boundary would split that job into two entries, so
 * a page whose first line continues the previous one — a bullet, or a line
 * starting mid-sentence — is joined without one.
 */
const joinPages = (pages: string[][]): string => {
  const out: string[] = [];

  pages.forEach((lines, index) => {
    const first = lines.find(line => line.trim() !== '');

    if (index > 0 && first !== undefined) {
      const continuesPreviousPage = BULLET_START.test(first) || /^[a-z]/.test(first);
      if (!continuesPreviousPage) out.push('');
    }

    out.push(...lines);
  });

  return out.join('\n');
};

/**
 * Rebuild reading-order text from positioned runs.
 *
 * Two-column pages are split at the gutter and rendered one column after the
 * other; without that, the columns interleave line by line and the result is
 * unparseable. Reading left column then right matches visual reading order,
 * and the section splitter handles sections arriving in any order.
 */
export const linesFromItems = (items: PositionedText[]): string => {
  const byPage = new Map<number, PositionedText[]>();
  for (const item of items) {
    const bucket = byPage.get(item.page);
    if (bucket) bucket.push(item);
    else byPage.set(item.page, [item]);
  }

  const rendered = [...byPage.keys()]
    .sort((a, b) => a - b)
    .map(page => {
      const runs = byPage.get(page)!;
      const split = detectColumnSplit(runs);

      if (split === null) return renderRuns(runs);

      const left = renderRuns(runs.filter(run => run.x < split));
      const right = renderRuns(runs.filter(run => run.x >= split));
      return left.length > 0 && right.length > 0 ? [...left, '', ...right] : [...left, ...right];
    });

  return joinPages(stripRunningHeadersAndFooters(rendered));
};

const extractPdf = async (file: File): Promise<ExtractResult> => {
  const [pdfjs, workerUrl] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url').then(m => m.default),
  ]);

  // Parsing runs in a Web Worker, so a large file does not freeze the UI.
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const buffer = await file.arrayBuffer();

  // Keep the loading task: destroy() lives on it, not on the document proxy,
  // and it is what tears the worker down.
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });

  let doc;
  try {
    doc = await loadingTask.promise;
  } catch (error) {
    // pdfjs signals its failure modes by exception name.
    const name = (error as { name?: string })?.name ?? '';
    const detail = error instanceof Error ? error.message : String(error);

    if (name === 'PasswordException') {
      throw new ImportError(
        'password-protected',
        'This PDF is password protected, so we cannot open it.',
        detail
      );
    }
    throw new ImportError(
      'corrupt-file',
      'We could not open this PDF. It may be damaged or incomplete.',
      detail
    );
  }

  const items: PositionedText[] = [];
  const pageCount = doc.numPages;

  // The tool that wrote the PDF. BuildResumeNow's own export rasterises through
  // html2canvas + jsPDF, so a file with no text layer AND a jsPDF producer is
  // one of ours — the review UI can then say so with certainty rather than ask.
  let producerTag = '';
  try {
    const meta = await doc.getMetadata();
    const info = (meta?.info ?? {}) as { Producer?: string; Creator?: string };
    producerTag = `${info.Producer ?? ''} ${info.Creator ?? ''}`.toLowerCase();
  } catch {
    // Metadata is optional; its absence just means we cannot self-identify.
  }

  try {
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      const page = await doc.getPage(pageNum);
      const content = await page.getTextContent();

      for (const item of content.items) {
        // Marked-content entries carry no `str`; skip them.
        if (!('str' in item) || typeof item.str !== 'string') continue;
        if (item.str.trim().length === 0) continue;

        // transform is [scaleX, skewX, skewY, scaleY, translateX, translateY]
        const [, , , , x, y] = item.transform as number[];
        items.push({ str: item.str, x, y, page: pageNum });
      }

      page.cleanup();
    }
  } finally {
    await loadingTask.destroy();
  }

  const text = linesFromItems(items);
  const warnings: ImportWarningCode[] = [];

  // A PDF whose pages are images — a scan, a photo, or anything exported through
  // a canvas renderer — yields effectively no text. Split the two: our own
  // rasterised export can be recovered from Import JSON, a real scan cannot.
  if (countMeaningfulChars(text) < MIN_MEANINGFUL_CHARS) {
    warnings.push(/jspdf|html2canvas|html2pdf/.test(producerTag) ? 'own-export' : 'scanned-pdf');
  }

  return { text, items, pageCount, warnings };
};

/**
 * Halve uniformly doubled line spacing.
 *
 * mammoth separates every paragraph with a blank line, so a DOCX arrives with
 * two newlines between ordinary lines and four where the document had a real
 * blank. Left alone, entry-splitting treats every single line as its own
 * entry — a two-job resume reads as five.
 *
 * Applied only when no single newline appears anywhere, which is what makes
 * the doubling uniform. A normally spaced document is left untouched.
 */
export const collapseUniformSpacing = (text: string): string => {
  const runs = text.match(/\n+/g);
  if (!runs || runs.length === 0) return text;
  if (runs.some(run => run.length === 1)) return text;

  // Runs of two were ordinary line breaks; anything longer was a real blank.
  return text.replace(/\n+/g, run => (run.length >= 3 ? '\n\n' : '\n'));
};

/** Direct-child rows of a table, ignoring any nested table's rows. */
const directRows = (table: Element): Element[] => {
  const rows: Element[] = [];
  for (const child of Array.from(table.children)) {
    const tag = child.tagName.toLowerCase();
    if (tag === 'tr') rows.push(child);
    else if (tag === 'tbody' || tag === 'thead' || tag === 'tfoot') {
      for (const row of Array.from(child.children)) {
        if (row.tagName.toLowerCase() === 'tr') rows.push(row);
      }
    }
  }
  return rows;
};

/**
 * Flatten mammoth's HTML into lines, preserving the structure that matters.
 *
 * `extractRawText` is simpler but throws away table boundaries entirely, and
 * resumes use tables constantly — both as page layout (a sidebar cell beside a
 * main cell) and as data (a date column beside a detail column). Without row
 * boundaries, every row of an education table merges into a single entry.
 *
 * A table ROW is one logical entry, so its cells are kept together and rows are
 * separated by a blank line. List items are marked with a leading "- " because
 * Word bullets carry no literal bullet character — without this, a real Word
 * resume's achievements render as paragraphs instead of bullet points.
 */
export const htmlToLines = (html: string): string[] => {
  const parsed = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  const lines: string[] = [];

  const pushText = (element: Element, prefix = ''): void => {
    const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
    lines.push(text === '' ? '' : prefix + text);
  };

  const walk = (node: Element): void => {
    for (const child of Array.from(node.children)) {
      const tag = child.tagName.toLowerCase();

      if (tag === 'table') {
        for (const row of directRows(child)) {
          for (const cell of Array.from(row.children)) walk(cell);
          lines.push('');
        }
      } else if (tag === 'ul' || tag === 'ol') {
        for (const item of Array.from(child.children)) {
          if (item.tagName.toLowerCase() === 'li') pushText(item, '- ');
        }
      } else if (tag === 'p' || /^h[1-6]$/.test(tag)) {
        pushText(child);
      } else {
        walk(child);
      }
    }
  };

  walk(parsed.body);

  // Collapse runs of blank lines and trim the ends.
  const out: string[] = [];
  for (const line of lines) {
    if (line === '' && (out.length === 0 || out[out.length - 1] === '')) continue;
    out.push(line);
  }
  while (out.length > 0 && out[out.length - 1] === '') out.pop();

  return out;
};

const extractDocx = async (file: File): Promise<ExtractResult> => {
  const mammoth = await import('mammoth');

  const buffer = await file.arrayBuffer();

  // convertToHtml rather than extractRawText: it is the only one that keeps
  // table and list structure, and mammoth bundles it either way.
  let result;
  try {
    result = await mammoth.convertToHtml({ arrayBuffer: buffer });
  } catch (error) {
    // A .docx is a zip; anything that is not one fails here — most often a
    // .doc or .pages that has simply been renamed.
    throw new ImportError(
      'corrupt-file',
      'We could not open this Word file. It may be damaged, or saved in an older format that was renamed to .docx.',
      error instanceof Error ? error.message : String(error)
    );
  }

  // The collapse stays as a safety net in case a future mammoth emits the
  // uniformly doubled spacing that extractRawText used to produce.
  const text = collapseUniformSpacing(htmlToLines(result.value).join('\n').trim());
  const warnings: ImportWarningCode[] = [];

  if (countMeaningfulChars(text) === 0) {
    warnings.push('empty');
  }

  // DOCX is a flow format — there is no page geometry to report.
  return { text, items: [], pageCount: 0, warnings };
};

/**
 * Read a resume file into plain text, entirely in the browser.
 *
 * Throws {@link ImportError} for files we cannot handle at all (wrong type, too
 * large). A file we *can* read but that yields nothing useful comes back with a
 * warning instead, so the UI can explain what happened.
 */
export const extractText = async (file: File): Promise<ExtractResult> => {
  if (file.size > MAX_FILE_BYTES) {
    throw new ImportError(
      'too-large',
      'That file is larger than 10 MB. Please try a smaller one.'
    );
  }

  const kind = classify(file);
  return kind === 'pdf' ? extractPdf(file) : extractDocx(file);
};
