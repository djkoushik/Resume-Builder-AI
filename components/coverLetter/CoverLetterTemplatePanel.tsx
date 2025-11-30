import React from 'react';
import { CoverLetterTemplate, coverLetterTemplates } from '../../types';

interface CoverLetterTemplatePanelProps {
  selectedTemplateId: string;
  onTemplateSelect: (templateId: string) => void;
}

const CoverLetterTemplatePanel: React.FC<CoverLetterTemplatePanelProps> = ({
  selectedTemplateId,
  onTemplateSelect
}) => {
  const renderTemplatePreview = (template: CoverLetterTemplate) => {
    const baseStyles = "bg-white dark:bg-gray-700 h-24 w-full rounded flex overflow-hidden border dark:border-gray-600";

    switch (template.id) {
      case 'professional':
        return (
          <div className={baseStyles}>
            <div className="p-2 w-full flex flex-col">
              <div className="flex items-start mb-2">
                <div className="flex-grow">
                  <div className="h-3 w-2/3 bg-gray-700 dark:bg-gray-300 rounded-sm mb-1"></div> {/* Name */}
                  <div className="h-1.5 w-1/2 bg-gray-500 dark:bg-gray-400 rounded-sm mb-1"></div> {/* Address */}
                  <div className="h-1.5 w-1/3 bg-gray-500 dark:bg-gray-400 rounded-sm"></div> {/* Contact */}
                </div>
                <div className="h-1.5 w-1/4 bg-gray-400 dark:bg-gray-500 rounded-sm"></div> {/* Date */}
              </div>
              <div className="h-1.5 w-1/2 bg-gray-600 dark:bg-gray-400 rounded-sm mb-1"></div> {/* Recipient */}
              <div className="h-1.5 w-1/3 bg-gray-500 dark:bg-gray-400 rounded-sm mb-2"></div> {/* Company */}
              <div className="h-1 w-full bg-gray-400 dark:bg-gray-500 rounded-sm mb-0.5"></div> {/* Body */}
              <div className="h-1 w-5/6 bg-gray-400 dark:bg-gray-500 rounded-sm"></div>
            </div>
          </div>
        );

      case 'modern':
        return (
          <div className={baseStyles}>
            <div className="p-2 w-full flex flex-col">
              <div className="border-b-2 border-blue-500 pb-1 mb-2">
                <div className="h-3 w-2/3 bg-gray-700 dark:bg-gray-300 rounded-sm mb-1"></div> {/* Name */}
                <div className="h-1.5 w-1/2 bg-gray-500 dark:bg-gray-400 rounded-sm"></div> {/* Contact */}
              </div>
              <div className="flex justify-between mb-1">
                <div className="h-1.5 w-1/3 bg-gray-600 dark:bg-gray-400 rounded-sm"></div> {/* Recipient */}
                <div className="h-1.5 w-1/4 bg-gray-400 dark:bg-gray-500 rounded-sm"></div> {/* Date */}
              </div>
              <div className="h-1 w-full bg-gray-400 dark:bg-gray-500 rounded-sm mb-0.5"></div> {/* Body */}
              <div className="h-1 w-4/5 bg-gray-400 dark:bg-gray-500 rounded-sm"></div>
            </div>
          </div>
        );

      case 'creative':
        return (
          <div className={baseStyles}>
            <div className="p-2 w-full flex">
              <div className="w-2/3 flex flex-col">
                <div className="h-3 w-3/4 bg-gray-700 dark:bg-gray-300 rounded-sm mb-1"></div> {/* Name */}
                <div className="h-1.5 w-1/2 bg-gray-500 dark:bg-gray-400 rounded-sm mb-2"></div> {/* Contact */}
                <div className="border-l-2 border-purple-500 pl-1">
                  <div className="h-1 w-full bg-gray-400 dark:bg-gray-500 rounded-sm mb-0.5"></div> {/* Body */}
                  <div className="h-1 w-5/6 bg-gray-400 dark:bg-gray-500 rounded-sm"></div>
                </div>
              </div>
              <div className="w-1/3 pl-2">
                <div className="h-1.5 w-full bg-gray-400 dark:bg-gray-500 rounded-sm mb-1"></div> {/* Date */}
                <div className="h-1.5 w-3/4 bg-gray-600 dark:bg-gray-400 rounded-sm"></div> {/* Recipient */}
              </div>
            </div>
          </div>
        );

      case 'executive':
        return (
          <div className={baseStyles}>
            <div className="p-2 w-full flex flex-col items-center">
              <div className="text-center mb-2 w-full">
                <div className="h-3 w-1/2 bg-gray-700 dark:bg-gray-300 rounded-sm mx-auto mb-1"></div> {/* Name */}
                <div className="h-1 w-3/4 bg-gray-500 dark:bg-gray-400 rounded-sm mx-auto"></div> {/* Contact */}
              </div>
              <div className="w-full">
                <div className="h-1.5 w-1/4 bg-gray-400 dark:bg-gray-500 rounded-sm mb-1 ml-auto"></div> {/* Date */}
                <div className="h-1.5 w-1/2 bg-gray-600 dark:bg-gray-400 rounded-sm mb-1"></div> {/* Recipient */}
                <div className="h-1 w-full bg-gray-400 dark:bg-gray-500 rounded-sm mb-0.5"></div> {/* Body */}
                <div className="h-1 w-4/5 bg-gray-400 dark:bg-gray-500 rounded-sm"></div>
              </div>
            </div>
          </div>
        );

      case 'minimalist':
        return (
          <div className={baseStyles}>
            <div className="p-2 w-full flex flex-col">
              <div className="mb-2">
                <div className="h-2.5 w-1/2 bg-black dark:bg-white rounded-sm mb-1"></div> {/* Name */}
                <div className="h-1 w-1/3 bg-gray-500 dark:bg-gray-400 rounded-sm"></div> {/* Contact */}
              </div>
              <div className="h-1 w-1/4 bg-gray-400 dark:bg-gray-500 rounded-sm mb-1 ml-auto"></div> {/* Date */}
              <div className="h-1.5 w-1/3 bg-gray-600 dark:bg-gray-400 rounded-sm mb-1"></div> {/* Recipient */}
              <div className="space-y-0.5">
                <div className="h-1 w-full bg-gray-400 dark:bg-gray-500 rounded-sm"></div> {/* Body */}
                <div className="h-1 w-5/6 bg-gray-400 dark:bg-gray-500 rounded-sm"></div>
                <div className="h-1 w-4/5 bg-gray-400 dark:bg-gray-500 rounded-sm"></div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className={baseStyles}>
            <div className="p-2 w-full">
              <div className="h-3 w-2/3 bg-gray-700 dark:bg-gray-300 rounded-sm mb-2"></div>
              <div className="h-1 w-full bg-gray-400 dark:bg-gray-500 rounded-sm mb-0.5"></div>
              <div className="h-1 w-5/6 bg-gray-400 dark:bg-gray-500 rounded-sm"></div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          {coverLetterTemplates.map(template => (
            <div
              key={template.id}
              onClick={() => onTemplateSelect(template.id)}
              className={`border-2 rounded-lg p-2 cursor-pointer transition-all hover:shadow-md ${selectedTemplateId === template.id
                  ? 'border-blue-500 shadow-lg bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                }`}
            >
              {renderTemplatePreview(template)}
              <p className="text-center text-sm mt-2 text-gray-800 dark:text-white font-medium">
                {template.name}
              </p>
            </div>
          ))}
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-6 text-center">
          More templates coming soon!
        </p>
      </div>
    </div>
  );
};

export default CoverLetterTemplatePanel;