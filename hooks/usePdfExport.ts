import { useCallback, useRef } from 'react';
import { printDocument, type PrintDocumentConfig } from '../utils/printDocument';

interface PdfExportConfig {
  /** Built fresh per action so it sees the current customisation settings. */
  getConfig: () => PrintDocumentConfig;
  /** Surfaced when the export can't start. Defaults to `alert`. */
  onError?: (message: string) => void;
}

interface PdfExport {
  /** Opens the browser's print dialog, where the user chooses "Save as PDF". */
  downloadPdf: () => void;
}

/**
 * PDF export for the résumé and the cover letter.
 *
 * The work is in `utils/printDocument.ts`; this debounces the button and
 * reports the failures worth reporting. Both builders route through here so
 * there is one export path — the desktop header and the cover-letter builder
 * used to carry their own near-identical copies of the old html2pdf logic.
 */
export const usePdfExport = ({ getConfig, onError }: PdfExportConfig): PdfExport => {
  const inFlight = useRef(false);

  const downloadPdf = useCallback(() => {
    if (inFlight.current) return; // ignore a second tap while the dialog opens
    inFlight.current = true;

    try {
      const result = printDocument(getConfig());
      // `blocked` is the quota gate, which owns its own messaging, and `busy`
      // is a double tap. Neither is worth interrupting the user for.
      if (result === 'missing' || result === 'failed') {
        (onError ?? window.alert)(
          'Could not open the print dialog. Please try again, or use your browser’s Print option.'
        );
      }
    } finally {
      inFlight.current = false;
    }
  }, [getConfig, onError]);

  return { downloadPdf };
};
