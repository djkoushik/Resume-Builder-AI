import React from 'react';
import { CoverLetterData, CustomizationSettings } from '../../types';
import CoverLetterTemplateRenderer from './CoverLetterTemplateRenderer';

interface CoverLetterPreviewProps {
  data: CoverLetterData;
  customization?: CustomizationSettings;
  /** `panel` = desktop scroll box. `bare` = full sheet for the mobile PreviewViewport. */
  variant?: 'panel' | 'bare';
}

const CoverLetterPreview: React.FC<CoverLetterPreviewProps> = ({ data, customization, variant = 'panel' }) => {
  const bodyFont = customization?.typography.fontSizes.body;
  const isBare = variant === 'bare';

  return (
    <div
      id="cover-letter-preview"
      className={isBare ? 'bg-white shadow-lg mx-auto' : 'bg-white rounded-lg shadow-sm min-h-96 overflow-auto mx-auto'}
      style={{
        width: isBare ? '8.5in' : '100%',
        maxWidth: '8.5in',
        minHeight: '11in',
        maxHeight: isBare ? 'none' : '600px',
        fontSize: bodyFont ? `${bodyFont}pt` : '14px',
      }}
      role="document"
      aria-label="Cover letter preview"
    >
      <CoverLetterTemplateRenderer
        data={data}
        customization={customization}
        templateId={data.templateId || 'professional'}
      />
    </div>
  );
};

export default CoverLetterPreview;
