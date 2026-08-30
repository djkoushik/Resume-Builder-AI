import React from 'react';
import { ResumeData, CustomizationSettings } from '../../types';
import ResumeTemplate from './ResumeTemplate';

interface PreviewPanelProps {
  resumeData: ResumeData;
  customization: CustomizationSettings;
  /** `panel` = the desktop centre column (padded, gutter). `bare` = the sheet
   *  only, for the mobile PreviewViewport which owns sizing. */
  variant?: 'panel' | 'bare';
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ resumeData, customization, variant = 'panel' }) => {
  const sheet = (
    <div id="resume-preview" className="bg-white shadow-lg w-full transform origin-top-left">
      <ResumeTemplate data={resumeData} settings={customization} />
    </div>
  );

  if (variant === 'bare') {
    // PreviewViewport sets the width and scale on an ancestor; render the sheet flush.
    return <div id="resume-preview-container" className="w-full">{sheet}</div>;
  }

  return (
    <div className="w-full p-8 flex items-start justify-center">
      <div id="resume-preview-container" className="w-full max-w-4xl">
        {sheet}
      </div>
    </div>
  );
};

export default PreviewPanel;
