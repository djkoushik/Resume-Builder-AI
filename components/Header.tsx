import React from 'react';
import { ResumeData, CustomizationSettings } from '../types';

interface HeaderProps {
  resumeData: ResumeData;
  customization: CustomizationSettings;
  onBack: () => void;
  onBuildCoverLetter: () => void;
  onImport: (data: ResumeData) => void;
}

import ATSModal from './ats/ATSModal';
import { useState } from 'react';

// Declare html2pdf for TypeScript since it's loaded from a script tag
declare var html2pdf: any;

import { ChevronDown, Download, Eye, FileText, CheckCircle } from 'lucide-react';

const Header: React.FC<HeaderProps> = ({ resumeData, customization, onBack, onBuildCoverLetter, onImport }) => {
  const [isATSOpen, setIsATSOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);


  const getPdfOptions = () => {
    const isLetter = customization.layout.pageFormat === 'Letter';
    const paperSize = isLetter ? 'letter' : 'a4';

    const margins = customization.layout.margins;
    // Convert margins from cm to mm for jsPDF
    const margin_mm = [margins.top * 10, margins.left * 10, margins.bottom * 10, margins.right * 10];

    return {
      margin: margin_mm,
      filename: `${resumeData.basics.name}_Resume.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: paperSize, orientation: 'portrait' }
    };
  };

  const performPdfAction = (action: 'save' | 'preview') => {
    const originalElement = document.getElementById('resume-preview');
    if (!originalElement) {
      console.error("Resume preview element not found.");
      alert("Could not find the resume preview to download.");
      return;
    }

    // Create a clone to render for PDF generation. This ensures the PDF is
    // generated from an element with dimensions matching the paper size,
    // providing a true WYSIWYG result regardless of screen size.
    const elementToPrint = originalElement.cloneNode(true) as HTMLElement;

    // A container for the clone, positioned off-screen.
    const printContainer = document.createElement('div');
    printContainer.style.position = 'absolute';
    printContainer.style.left = '-9999px';
    printContainer.style.top = '0';

    // Set clone's dimensions to match paper size for 1:1 scaling.
    const isLetter = customization.layout.pageFormat === 'Letter';
    const paperWidth = isLetter ? '8.5in' : '210mm';
    elementToPrint.style.width = paperWidth;
    elementToPrint.style.height = 'auto';

    printContainer.appendChild(elementToPrint);
    document.body.appendChild(printContainer);

    const opt = getPdfOptions();
    // With a fixed-width source element, the 'scale' option now primarily
    // affects the resolution (quality) of the PDF. Increasing it results
    // in sharper text and images.
    opt.html2canvas.scale = 3;

    const worker = html2pdf().from(elementToPrint).set(opt);

    let promise;
    if (action === 'save') {
      promise = worker.save();
    } else {
      promise = worker.toPdf().get('pdf').then((pdf: any) => {
        window.open(pdf.output('bloburl'), '_blank');
      });
    }

    // Ensure the off-screen element is removed after the PDF operation is complete.
    promise.catch((err: any) => {
      console.error("PDF generation failed:", err);
    }).finally(() => {
      document.body.removeChild(printContainer);
    });
  };

  const handlePrintPdf = () => {
    performPdfAction('save');
  };

  const handlePreviewPdf = () => {
    performPdfAction('preview');
  };

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
        name: "Key Skills",
        level: "",
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
      <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center z-10 relative">
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
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">
            <span className="text-blue-500">AI</span> Resume Builder
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={onBuildCoverLetter}
            className="px-3 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md shadow-sm hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-gray-700 dark:text-green-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Build Cover Letter
          </button>

          <div className="relative inline-block text-left">
            <div>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 items-center"
                id="options-menu"
                aria-expanded="true"
                aria-haspopup="true"
              >
                Download PDF
                <ChevronDown className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
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
                      handlePreviewPdf();
                      setIsDropdownOpen(false);
                    }}
                    className="group flex w-full items-center p-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors duration-150 mt-1"
                    role="menuitem"
                  >
                    <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-lg bg-gray-50 dark:bg-gray-700/30 text-gray-600 dark:text-gray-400 group-hover:bg-gray-100 dark:group-hover:bg-gray-700/50 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                      <Eye className="h-5 w-5" />
                    </div>
                    <div className="ml-3 text-left">
                      <p className="font-medium text-gray-900 dark:text-white group-hover:text-gray-900 dark:group-hover:text-white">Preview</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">View how your resume looks</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      handlePrintPdf();
                      setIsDropdownOpen(false);
                    }}
                    className="group flex w-full items-center p-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors duration-150 mt-1"
                    role="menuitem"
                  >
                    <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                      <Download className="h-5 w-5" />
                    </div>
                    <div className="ml-3 text-left">
                      <p className="font-medium text-gray-900 dark:text-white group-hover:text-gray-900 dark:group-hover:text-white">Download PDF</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">Save your resume as a PDF file</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      <ATSModal
        isOpen={isATSOpen}
        onClose={() => setIsATSOpen(false)}
        resumeData={resumeData}
        onAddSkill={handleAddSkill}
      />
    </>
  );
};

export default Header;
