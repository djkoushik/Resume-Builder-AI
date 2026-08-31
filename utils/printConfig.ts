import { ResumeData, CoverLetterData, CustomizationSettings } from '../types';
import type { PrintDocumentConfig } from './printDocument';

/**
 * Print configuration for the résumé, shared by the desktop header dropdown
 * and the mobile Preview surface so both export identically.
 *
 * Margins come straight from the user's layout settings (already in cm) and
 * become the `@page` margin. The templates keep their own inner padding on top
 * of that, exactly as they did under the old rasterised export.
 */
export const resumePrintConfig = (
  resumeData: ResumeData,
  customization: CustomizationSettings
): PrintDocumentConfig => {
  const { pageFormat, margins } = customization.layout;
  return {
    elementId: 'resume-preview',
    filename: `${resumeData.basics.name || 'Resume'}_Resume`,
    pageFormat,
    margins: {
      top: margins.top,
      right: margins.right,
      bottom: margins.bottom,
      left: margins.left,
    },
  };
};

/**
 * Cover letters print with zero page margin: each cover-letter template owns
 * its own padding and several bleed a coloured header to the paper edge.
 */
export const coverLetterPrintConfig = (data: CoverLetterData): PrintDocumentConfig => ({
  elementId: 'cover-letter-preview',
  filename: `${data.senderName || 'Cover_Letter'}_${data.companyName || 'Application'}`,
  pageFormat: 'Letter',
  margins: { top: 0, right: 0, bottom: 0, left: 0 },
});
