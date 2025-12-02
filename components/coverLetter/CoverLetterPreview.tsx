import React from 'react';
import { CoverLetterData, CustomizationSettings } from '../../types';
import CoverLetterTemplateRenderer from './CoverLetterTemplateRenderer';

interface CoverLetterPreviewProps {
  data: CoverLetterData;
  customization?: CustomizationSettings;
}

const CoverLetterPreview: React.FC<CoverLetterPreviewProps> = ({ data, customization }) => {
  return (
    <div
      id="cover-letter-preview"
      className="bg-white rounded-lg shadow-sm min-h-96 overflow-auto mx-auto"
      style={{
        width: '100%',
        maxWidth: '8.5in',
        minHeight: '11in',
        maxHeight: '600px',
        fontSize: customization?.typography.fontSizes.body ? `${customization.typography.fontSizes.body}pt` : '14px'
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