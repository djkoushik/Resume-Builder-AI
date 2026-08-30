import { ResumeData, CustomizationSettings } from '../types';

/**
 * html2pdf options for the résumé, shared by the desktop header dropdown and
 * the mobile Preview surface so both export identically.
 */
export const resumePdfOptions = (resumeData: ResumeData, customization: CustomizationSettings) => {
  const isLetter = customization.layout.pageFormat === 'Letter';
  const margins = customization.layout.margins;
  return {
    // cm -> mm
    margin: [margins.top * 10, margins.left * 10, margins.bottom * 10, margins.right * 10] as number[],
    filename: `${resumeData.basics.name || 'Resume'}_Resume.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: isLetter ? 'letter' : 'a4', orientation: 'portrait' },
  };
};

/** The exact CSS width the off-screen clone is printed at. */
export const resumePrintWidth = (customization: CustomizationSettings): string =>
  customization.layout.pageFormat === 'Letter' ? '8.5in' : '210mm';
