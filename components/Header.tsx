import React, { Suspense, lazy } from 'react';
import { ResumeData, CustomizationSettings } from '../types';
// import AuthButton from './AuthButton';

interface HeaderProps {
  resumeData: ResumeData;
  customization: CustomizationSettings;
  onBack: () => void;
  onBuildCoverLetter: () => void;
  onImport: (data: ResumeData) => void;
}

import { useState } from 'react';

// Lazy so the ATS dashboard + the import parser stay out of the main bundle.
const ATSModal = lazy(() => import('./ats/ATSModal'));
const ImportResumeModal = lazy(() => import('./import/ImportResumeModal'));
const prefetchImportModal = () => { void import('./import/ImportResumeModal'); };

import { usePdfExport } from '../hooks/usePdfExport';
import { resumePrintConfig } from '../utils/printConfig';

import { ChevronDown, Download, FileText, CheckCircle } from 'lucide-react';

const Header: React.FC<HeaderProps> = ({ resumeData, customization, onBack, onBuildCoverLetter, onImport }) => {
  const [isATSOpen, setIsATSOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);


  // Export goes through the shared hook: it clones the preview into a
  // body-level #print-root and opens the browser's print dialog, so the PDF
  // carries a real text layer instead of a rasterised image.
  const { downloadPdf } = usePdfExport({
    getConfig: () => resumePrintConfig(resumeData, customization),
  });

  const handleAddSkill = (skill: string) => {
    // Basic logic: Find the first section named "Skills" or similar, add the keyword.
    // If no such section, create one? For now assume one exists or we append to the first one with type 'skills'.
    // Better: Standard ResumeData usually has a 'skills' array.

    // Check if skill already exists to avoid duplicates
    const skillsSection = resumeData.skills || [];
    const existingSkill = skillsSection.find(s => s.keywords.includes(skill));

    if (existingSkill) {
      alert(`Skill "${skill}" is already in your resume!`);
      return;
    }

    // Clone resumeData deep enough
    const newResumeData = JSON.parse(JSON.stringify(resumeData));

    if (newResumeData.skills && newResumeData.skills.length > 0) {
      // Add to the first skill category (usually "Technical" or "Core")
      newResumeData.skills[0].keywords.push(skill);
    } else {
      // Create new skills section
      newResumeData.skills = [{
        id: `skill-${Date.now()}`,
        name: "Key Skills",
        keywords: [skill]
      }];
    }

    // Update state via onImport (which is actually handleResumeChange in App.tsx)
    // We cast onImport as the updater
    if (typeof (onImport as any) === 'function') {
      const onImportFunc = onImport as any as (data: ResumeData) => void;
      onImportFunc(newResumeData);
    }

    // Alert or toast
    // alert(`Added "${skill}" to your resume!`); 
  };

  return (
    <>
      <header className="bg-white dark:bg-gray-800 shadow-md p-4 z-10 relative" role="banner">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
            <span className="text-blue-500">AI</span> Resume Builder
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsImportOpen(true)}
            onMouseEnter={prefetchImportModal}
            onFocus={prefetchImportModal}
            className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-md shadow-sm hover:bg-teal-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 dark:bg-gray-700 dark:text-teal-300 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors"
          >
            Upload Resume
          </button>

          <button
            onClick={onBuildCoverLetter}
            className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md shadow-sm hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-gray-700 dark:text-green-300 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors"
          >
            Build Cover Letter
          </button>

          <div className="relative inline-block text-left">
            <div>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="inline-flex justify-center w-full px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 items-center transition-colors"
                id="options-menu"
                aria-expanded="true"
                aria-haspopup="true"
              >
                Download PDF
                <ChevronDown className="-mr-1 ml-1 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              </button>
            </div>

            {isDropdownOpen && (
              <div
                className="origin-top-right absolute right-0 mt-2 w-72 rounded-lg shadow-xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden animate-slideIn"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="options-menu"
              >
                <div className="p-1" role="none">
                  <button
                    onClick={() => {
                      setIsATSOpen(true);
                      setIsDropdownOpen(false);
                    }}
                    className="group flex w-full items-center p-3 text-sm text-gray-700 dark:text-gray-200 rounded-lg transition-colors duration-150 recommendation-border"
                    role="menuitem"
                  >
                    <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors z-10 relative">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="ml-3 text-left z-10 relative flex-grow">
                      <div className="flex justify-between items-center w-full">
                        <p className="font-medium text-gray-900 dark:text-white group-hover:text-gray-900 dark:group-hover:text-white">Resume Score</p>
                        <span className="recommended-badge">Recommended</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">Check compatibility with ATS</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      downloadPdf();
                      setIsDropdownOpen(false);
                    }}
                    className="group flex w-full items-center p-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors duration-150 mt-1"
                    role="menuitem"
                  >
                    <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 group-hover:text-blue-700 dark:group-hover:text-purple-300 transition-colors">
                      <Download className="h-5 w-5" />
                    </div>
                    <div className="ml-3 text-left">
                      <p className="font-medium text-gray-900 dark:text-white group-hover:text-gray-900 dark:group-hover:text-white">Download PDF</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">Opens your browser's print dialog — choose "Save as PDF"</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* <AuthButton /> */}
        </div>
        </div>
      </header>
      {isATSOpen && (
        <Suspense fallback={null}>
          <ATSModal
            isOpen
            onClose={() => setIsATSOpen(false)}
            resumeData={resumeData}
            onAddSkill={handleAddSkill}
          />
        </Suspense>
      )}
      {isImportOpen && (
        <Suspense fallback={null}>
          <ImportResumeModal
            isOpen
            onClose={() => setIsImportOpen(false)}
            currentResume={resumeData}
            onImport={data => {
              setIsImportOpen(false);
              onImport(data);
            }}
          />
        </Suspense>
      )}
    </>
  );
};

export default Header;
