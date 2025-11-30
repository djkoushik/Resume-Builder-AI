import React from 'react';
import { CoverLetterTemplate, coverLetterTemplates } from '../../types';
import { ModernThumbnail } from './templates/ModernTemplate';
import { CreativeThumbnail } from './templates/CreativeTemplate';
import { ExecutiveThumbnail } from './templates/ExecutiveTemplate';
import { MinimalistThumbnail } from './templates/MinimalistTemplate';
import { GeometricThumbnail } from './templates/GeometricTemplate';
import { NavyThumbnail } from './templates/NavyTemplate';
import { SquareThumbnail } from './templates/SquareTemplate';
import { ProfessionalThumbnail } from './templates/ProfessionalTemplate';

interface CoverLetterTemplatePanelProps {
  selectedTemplateId: string;
  onTemplateSelect: (templateId: string) => void;
}

const THUMBNAIL_COMPONENTS: Record<string, React.FC<{ template: CoverLetterTemplate }>> = {
  modern: ModernThumbnail,
  creative: CreativeThumbnail,
  executive: ExecutiveThumbnail,
  minimalist: MinimalistThumbnail,
  geometric: GeometricThumbnail,
  navy: NavyThumbnail,
  square: SquareThumbnail,
  professional: ProfessionalThumbnail,
};

const CoverLetterTemplatePanel: React.FC<CoverLetterTemplatePanelProps> = ({
  selectedTemplateId,
  onTemplateSelect
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          {coverLetterTemplates.map(template => {
            const ThumbnailComponent = THUMBNAIL_COMPONENTS[template.id] || ProfessionalThumbnail;
            return (
              <div
                key={template.id}
                onClick={() => onTemplateSelect(template.id)}
                className={`border-2 rounded-lg p-2 cursor-pointer transition-all hover:shadow-md ${selectedTemplateId === template.id
                  ? 'border-blue-500 shadow-lg bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                  }`}
              >
                <ThumbnailComponent template={template} />
                <p className="text-center text-sm mt-2 text-gray-800 dark:text-white font-medium">
                  {template.name}
                </p>
              </div>
            );
          })}
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-6 text-center">
          More templates coming soon!
        </p>
      </div>
    </div>
  );
};

export default CoverLetterTemplatePanel;