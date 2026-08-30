

import React, { useState, useRef } from 'react';
import { CustomizationSettings, ResumeData } from '../../types';
import { mergeResumeData } from '../../utils/resumeData';
import TemplateTab from './TemplateTab';
import ColorTab from './ColorTab';
import TypographyTab from './TypographyTab';
import LayoutTab from './LayoutTab';

interface CustomizationPanelProps {
  settings: CustomizationSettings;
  onUpdate: (settings: CustomizationSettings) => void;
  resumeData: ResumeData;
  onImport: (data: ResumeData) => void;
}

type Tab = 'Templates' | 'Font-Resize' | 'Layout';

const CustomizationPanel: React.FC<CustomizationPanelProps> = ({ settings, onUpdate, resumeData, onImport }) => {
  const [activeTab, setActiveTab] = useState<Tab>('Templates');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tabs: Tab[] = ['Templates', 'Font-Resize', 'Layout'];
  const isSimpleMode = resumeData.resumeMode === 'simple';

  const handleExportJson = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(resumeData, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = "resume.json";
    link.click();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text === 'string') {
          const importedData = JSON.parse(text);

          // Deep merge with defaults to prevent crashes on malformed/partial data.
          // Shared with the PDF/DOCX importer; 'json' keeps this path's original
          // fallback-to-defaults behaviour unchanged.
          const mergedData: ResumeData = mergeResumeData(importedData, { source: 'json' });

          onImport(mergedData);
          alert('Resume data imported successfully!');
        }
      } catch (error) {
        console.error("Failed to parse JSON file:", error);
        alert("Error: Could not import resume data. The file may be invalid.");
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input to allow importing the same file again
  };

  return (
    <div className="flex flex-col h-full">
      {!isSimpleMode && (
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-4 px-4" aria-label="Tabs">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      )}

      <div className="p-4 flex-grow overflow-y-auto">
        {activeTab === 'Templates' && !isSimpleMode && (
          <>
            <TemplateTab settings={settings} onUpdate={onUpdate} />
            <hr className="my-6 border-gray-200 dark:border-gray-700" />
            <ColorTab settings={settings} onUpdate={onUpdate} />
          </>
        )}

        {isSimpleMode && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-500 dark:text-gray-400">
            <svg className="w-12 h-12 mb-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Simple Mode Active</h3>
            <p>We've selected our best "Professional Clean" template for you to focus on your content.</p>
            <p className="mt-4 text-sm">Switch to Custom Mode for more design options.</p>
          </div>
        )}

        {!isSimpleMode && activeTab === 'Font-Resize' && <TypographyTab settings={settings} onUpdate={onUpdate} />}

        {!isSimpleMode && activeTab === 'Layout' && (
          <div className="space-y-6">
            <LayoutTab settings={settings} onUpdate={onUpdate} />

            <hr className="border-gray-200 dark:border-gray-700" />

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Data Management</h3>
              <div className="flex space-x-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="application/json"
                  className="hidden"
                />
                <button
                  onClick={handleImportClick}
                  className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  Import JSON
                </button>
                <button
                  onClick={handleExportJson}
                  className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  Export JSON
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomizationPanel;