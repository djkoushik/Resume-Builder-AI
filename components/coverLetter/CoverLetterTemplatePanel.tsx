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
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <h3 className="font-semibold text-gray-800 dark:text-white">Templates</h3>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {coverLetterTemplates.map(template => (
            <div 
              key={template.id} 
              onClick={() => onTemplateSelect(template.id)}
              className={`border-2 rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
                selectedTemplateId === template.id 
                  ? 'border-blue-500 shadow-lg bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
              }`}
            >
              {renderTemplatePreview(template)}
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-800 dark:text-white">
                  {template.name}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {template.description}
                </p>
              </div>
              
              {selectedTemplateId === template.id && (
                <div className="mt-2 flex items-center text-blue-600 dark:text-blue-400">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs font-medium">Selected</span>
                </div>
              )}
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