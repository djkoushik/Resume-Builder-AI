/**
 * PDF export via the browser's own print pipeline.
 *
 * Replaces the previous `html2pdf` / `html2canvas` path, which painted the
 * document onto a canvas and embedded it as a JPEG. That produced a PDF with
 * **no text layer** — unselectable, uncopyable, and unreadable by every
 * applicant tracking system, which is the one thing this product promises.
 *
 * Printing the live DOM instead keeps real text, embedded fonts, clickable
 * links and vector output, and lets the browser paginate using the
 * `break-inside: avoid` rules the templates already carry.
 *
 * The node is cloned into a body-level `#print-root` rather than printed in
 * place, for two reasons:
 *   1. the print stylesheet can hide the whole app with a single
 *      `body > *:not(#print-root)` rule instead of fighting the builder grid;
 *   2. on mobile, `PreviewViewport` scales a wrapper *around* the preview with
 *      a CSS transform — cloning to the body escapes that ancestor entirely.
 *
 * Page geometry can't come from a stylesheet: `@page` does not read CSS custom
 * properties in any current browser, so the rule is generated per export and
 * injected into `<head>` for the duration of the print.
 */

export type PageFormat = 'A4' | 'Letter';

/** Page margins, in centimetres — matching `CustomizationSettings.layout.margins`. */
export interface PrintMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface PrintDocumentConfig {
  /** id of the on-screen node to print (e.g. "resume-preview"). */
  elementId: string;
  /** Suggested filename, without extension. Becomes the print dialog's default. */
  filename: string;
  pageFormat: PageFormat;
  /** In cm. Cover letters pass all-zero for full-bleed template backgrounds. */
  margins: PrintMargins;
}

/**
 * Outcome of an export attempt.
 *
 * - `started`  — the print dialog is open.
 * - `blocked`  — the quota gate refused. It owns its own messaging; stay quiet.
 * - `busy`     — a print is already in flight; a double tap, ignore it.
 * - `missing`  — the preview node wasn't in the DOM. A real bug worth surfacing.
 * - `failed`   — the browser refused to print.
 */
export type PrintResult = 'started' | 'blocked' | 'busy' | 'missing' | 'failed';

export const PRINT_ROOT_ID = 'print-root';
export const PRINTING_CLASS = 'printing';
const PAGE_RULE_ID = 'print-page-rule';

/**
 * Browsers use `document.title` as the default filename in the "Save as PDF"
 * dialog, so the title is swapped for the duration of the print. Strip the
 * characters that are illegal in a filename on Windows or macOS.
 */
const safeFilename = (raw: string): string => {
  const cleaned = raw
    .replace(/[\\/:*?"<>|]+/g, '')
    .replace(/\s+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^[._]+|[._]+$/g, '')
    .slice(0, 120);
  return cleaned || 'Resume';
};

/** Guard against a negative or absurd margin reaching the `@page` rule. */
const clampCm = (value: number): number => {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(value, 5);
};

const buildPageRule = (pageFormat: PageFormat, m: PrintMargins): string => {
  const size = pageFormat === 'Letter' ? 'Letter' : 'A4';
  const margin = [m.top, m.right, m.bottom, m.left].map(v => `${clampCm(v)}cm`).join(' ');
  return `@page { size: ${size} portrait; margin: ${margin}; }`;
};

/** A clone must not duplicate the ids already in the document. */
const stripIds = (node: HTMLElement): void => {
  node.removeAttribute('id');
  node.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
};

/**
 * Clone the target into `#print-root`, open the browser's print dialog, and
 * tear everything back down once it closes.
 */
export const printDocument = ({
  elementId,
  filename,
  pageFormat,
  margins,
}: PrintDocumentConfig): PrintResult => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return 'failed';

  // The monetisation seam — see contexts/AuthContext.tsx.
  const checkUserLimit = (window as unknown as { checkUserLimit?: () => boolean }).checkUserLimit;
  if (typeof checkUserLimit === 'function' && !checkUserLimit()) return 'blocked';

  // A second tap while the dialog is open would stack print roots.
  if (document.getElementById(PRINT_ROOT_ID)) return 'busy';

  const source = document.getElementById(elementId);
  if (!source) {
    console.error(`Print export: #${elementId} not found.`);
    return 'missing';
  }

  const clone = source.cloneNode(true) as HTMLElement;
  stripIds(clone);

  const printRoot = document.createElement('div');
  printRoot.id = PRINT_ROOT_ID;
  // The print stylesheet hides this on screen, but the clone duplicates the
  // preview's landmarks and links while it is mounted. Keep it out of the
  // accessibility tree and out of tab order regardless of the CSS.
  printRoot.setAttribute('aria-hidden', 'true');
  printRoot.setAttribute('inert', '');
  printRoot.appendChild(clone);

  const pageRule = document.createElement('style');
  pageRule.id = PAGE_RULE_ID;
  pageRule.textContent = buildPageRule(pageFormat, margins);

  const previousTitle = document.title;

  document.head.appendChild(pageRule);
  document.body.appendChild(printRoot);
  document.documentElement.classList.add(PRINTING_CLASS);
  document.title = safeFilename(filename);

  // Cleanup runs exactly once, from whichever signal arrives first.
  let done = false;
  const mediaQuery = typeof window.matchMedia === 'function' ? window.matchMedia('print') : null;
  let onMediaChange: ((event: MediaQueryListEvent) => void) | null = null;
  let leakGuard = 0;

  const cleanup = () => {
    if (done) return;
    done = true;
    window.clearTimeout(leakGuard);
    window.removeEventListener('afterprint', cleanup);
    if (mediaQuery && onMediaChange) mediaQuery.removeEventListener('change', onMediaChange);
    document.documentElement.classList.remove(PRINTING_CLASS);
    printRoot.remove();
    pageRule.remove();
    document.title = previousTitle;
  };

  window.addEventListener('afterprint', cleanup);

  // Safari and some mobile browsers don't fire `afterprint` when the sheet is
  // dismissed, but they do flip the print media query back to false.
  if (mediaQuery) {
    onMediaChange = (event: MediaQueryListEvent) => {
      if (!event.matches) cleanup();
    };
    mediaQuery.addEventListener('change', onMediaChange);
  }

  try {
    window.print();
  } catch (err) {
    console.error('Print export failed:', err);
    cleanup();
    return 'failed';
  }

  // In Chrome `print()` blocks until the dialog closes, so `afterprint` has
  // already run by now. Where it doesn't block, the listeners above do the
  // work — this only stops a dropped event from leaving the clone in the DOM.
  leakGuard = window.setTimeout(cleanup, 60_000);

  return 'started';
};
