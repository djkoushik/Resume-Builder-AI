import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

interface PreviewViewportProps {
  /** Renders the preview node (must contain the id the PDF export clones). */
  children: React.ReactNode;
  /** Natural paper width in CSS px (A4 ≈ 794, Letter ≈ 816). */
  sheetWidth?: number;
  accent: 'blue' | 'green';
}

const ZOOM_STEPS = [0.75, 1, 1.25, 1.5, 2];
const H_PADDING = 24; // px of breathing room on each side, matches the container padding

/**
 * A document-viewer wrapper for the resume / cover-letter preview on touch
 * devices.
 *
 * The sheet renders at its true paper width and is scaled *down* to fit the
 * screen, so proportions, columns and font sizes match the exported PDF exactly
 * — the opposite of letting a fluid container squeeze the layout.
 *
 * The scale is a CSS `transform` on a wrapper *around* the preview node, never
 * on the node itself: the PDF export clones that node by id, and a transform on it
 * would corrupt the export.
 */
const PreviewViewport: React.FC<PreviewViewportProps> = ({ children, sheetWidth = 794, accent }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const [fitScale, setFitScale] = useState(0.5);
  const [zoom, setZoom] = useState(1); // multiplier over fitScale, driven by the buttons
  const [sheetHeight, setSheetHeight] = useState(0);

  // Measure against the non-scrolling root so an appearing/disappearing
  // scrollbar can't feed back into the scale and loop. Values are rounded and
  // guarded so a stable layout produces no extra renders.
  const measure = useCallback(() => {
    const root = rootRef.current;
    const sheet = sheetRef.current;
    if (!root) return;

    const available = root.clientWidth - H_PADDING * 2;
    // Not measurable (pane is display:none in another mode) — keep the last scale.
    if (available <= 0) return;

    const next = Math.max(0.2, Math.min(1, Math.round((available / sheetWidth) * 1000) / 1000));
    setFitScale(prev => (Math.abs(prev - next) < 0.002 ? prev : next));

    if (sheet) {
      // scrollHeight is the untransformed content height (CSS transforms don't
      // affect layout), so this does not react to the scale change it causes.
      const h = sheet.scrollHeight;
      setSheetHeight(prev => (Math.abs(prev - h) < 1 ? prev : h));
    }
  }, [sheetWidth]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    const root = rootRef.current;
    const sheet = sheetRef.current;
    if (!root) return;
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    if (sheet) ro.observe(sheet);
    return () => ro.disconnect();
  }, [measure]);

  const scale = fitScale * zoom;

  const stepZoom = (dir: 1 | -1) => {
    setZoom(current => {
      const idx = ZOOM_STEPS.findIndex(s => s >= current - 0.001);
      const next = ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, Math.max(0, idx + dir))];
      return next ?? current;
    });
  };

  const accentText = accent === 'green' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400';

  return (
    <div ref={rootRef} className="relative h-full min-w-0 overflow-hidden bg-gray-200 dark:bg-gray-900">
      <div className="h-full overflow-auto overscroll-contain px-3 py-4" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="mx-auto" style={{ width: sheetWidth * scale, height: sheetHeight * scale || undefined }}>
          <div
            ref={sheetRef}
            className="shadow-xl"
            style={{ width: sheetWidth, transform: `scale(${scale})`, transformOrigin: 'top left' }}
          >
            {children}
          </div>
        </div>
      </div>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-white/95 dark:bg-gray-800/95 shadow-lg ring-1 ring-black/5 dark:ring-white/10 px-1 py-1">
        <button
          type="button"
          onClick={() => stepZoom(-1)}
          aria-label="Zoom out"
          className="flex items-center justify-center w-9 h-9 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" d="M5 12h14" /></svg>
        </button>
        <button
          type="button"
          onClick={() => setZoom(1)}
          className={`px-2 min-w-[52px] h-9 text-xs font-semibold tabular-nums ${zoom === 1 ? 'text-gray-500 dark:text-gray-400' : accentText}`}
        >
          {Math.round(scale * 100)}%
        </button>
        <button
          type="button"
          onClick={() => stepZoom(1)}
          aria-label="Zoom in"
          className="flex items-center justify-center w-9 h-9 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" d="M12 5v14M5 12h14" /></svg>
        </button>
      </div>
    </div>
  );
};

export default PreviewViewport;
