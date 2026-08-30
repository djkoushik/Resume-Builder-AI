import { useCallback, useRef } from 'react';

// html2pdf is loaded from a CDN <script> in index.html, not bundled.
declare var html2pdf: any;

type Html2PdfOptions = {
  margin: number | number[];
  filename: string;
  image: { type: string; quality: number };
  html2canvas: { scale: number; useCORS: boolean };
  jsPDF: { unit: string; format: string; orientation: string };
};

interface PdfExportConfig {
  /** id of the on-screen node to rasterise (e.g. "resume-preview"). */
  elementId: string;
  /** Options builder — called fresh per action so it sees current settings. */
  getOptions: () => Html2PdfOptions;
  /** Exact CSS width the clone is printed at (e.g. "210mm" / "8.5in"). */
  printWidth: string;
  /** Optional minimum height for the clone (cover letter uses "11in"). */
  printMinHeight?: string;
}

interface PdfExport {
  downloadPdf: () => void;
  previewPdf: () => void;
}

/**
 * Client-side PDF export via html2pdf, shared by the desktop header and the
 * mobile Preview surface.
 *
 * Lifted verbatim from the logic that used to live in `Header.tsx` and
 * `CoverLetterBuilder.tsx`. It clones the preview node off-screen at exact
 * paper width so the output is 1:1 regardless of how the preview is scaled on
 * screen — which is what lets the mobile viewport shrink the *view* without
 * touching the exported document.
 */
export const usePdfExport = ({
  elementId,
  getOptions,
  printWidth,
  printMinHeight,
}: PdfExportConfig): PdfExport => {
  const inFlight = useRef(false);

  const run = useCallback(
    (action: 'save' | 'preview') => {
      if (inFlight.current) return; // ignore a second tap while a PDF is generating
      if (typeof (window as any).checkUserLimit === 'function' && !(window as any).checkUserLimit()) {
        return;
      }

      const original = document.getElementById(elementId);
      if (!original) {
        console.error(`PDF export: #${elementId} not found.`);
        alert('Could not find the preview to download.');
        return;
      }

      const clone = original.cloneNode(true) as HTMLElement;

      const printContainer = document.createElement('div');
      printContainer.style.position = 'absolute';
      printContainer.style.left = '-9999px';
      printContainer.style.top = '0';

      clone.style.width = printWidth;
      clone.style.height = 'auto';
      if (printMinHeight) {
        clone.style.minHeight = printMinHeight;
        clone.style.maxHeight = 'none';
        clone.style.overflow = 'visible';
      }
      clone.classList.remove('overflow-auto');

      printContainer.appendChild(clone);
      document.body.appendChild(printContainer);
      inFlight.current = true;

      const opt = getOptions();
      opt.html2canvas.scale = 3;

      const worker = html2pdf().from(clone).set(opt);

      const promise =
        action === 'save'
          ? worker.save()
          : worker.toPdf().get('pdf').then((pdf: any) => {
              window.open(pdf.output('bloburl'), '_blank');
            });

      promise
        .catch((err: any) => {
          console.error('PDF generation failed:', err);
        })
        .finally(() => {
          document.body.removeChild(printContainer);
          inFlight.current = false;
        });
    },
    [elementId, getOptions, printWidth, printMinHeight]
  );

  return {
    downloadPdf: useCallback(() => run('save'), [run]),
    previewPdf: useCallback(() => run('preview'), [run]),
  };
};
