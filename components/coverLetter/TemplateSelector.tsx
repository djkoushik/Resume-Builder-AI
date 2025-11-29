import React, { useState } from 'react';
import { CoverLetterTemplate, coverLetterTemplates } from '../../types';

interface TemplateSelectorProps {
  selectedTemplateId: string;
  onTemplateSelect: (templateId: string) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ selectedTemplateId, onTemplateSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedTemplate = coverLetterTemplates.find(t => t.id === selectedTemplateId) || coverLetterTemplates[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center space-x-2"
      >
        <span>Templates</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Template Selection Modal */}
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Choose Template
              </h3>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {coverLetterTemplates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => {
                      onTemplateSelect(template.id);
                      setIsOpen(false);
                    }}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedTemplateId === template.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 dark:text-white">
                          {template.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {template.description}
                        </p>
                        
                        {/* Template Preview */}
                        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
                          <div 
                            className="font-medium mb-1"
                            style={{ 
                              fontFamily: template.styles.fonts.heading,
                              color: template.styles.colors.primary 
                            }}
                          >
                            {template.name} Style
                          </div>
                          <div 
                            style={{ 
                              fontFamily: template.styles.fonts.body,
                              color: template.styles.colors.text 
                            }}
                          >
                            Sample body text in {template.styles.fonts.body}
                          </div>
                          {template.styles.colors.accent && (
                            <div 
                              className="w-4 h-1 mt-1 rounded"
                              style={{ backgroundColor: template.styles.colors.accent }}
                            />
                          )}
                        </div>
                      </div>
                      
                      {selectedTemplateId === template.id && (
                        <div className="ml-2">
                          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Current: <span className="font-medium">{selectedTemplate.name}</span>
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TemplateSelector;