import React, { useState } from 'react';
import { CoverLetterData, ResumeData, initialCoverLetterData, CustomizationSettings, initialCustomizationSettings } from '../../types';
import CoverLetterEditor from './CoverLetterEditor';
import CoverLetterPreview from './CoverLetterPreview';
import CoverLetterTemplatePanel from './CoverLetterTemplatePanel';
import TypographyTab from '../customization/TypographyTab';

interface CoverLetterBuilderProps {
  coverLetterData: CoverLetterData;
  onUpdate: (data: CoverLetterData) => void;
  resumeData: ResumeData;
  onBack: () => void;
  onGoToResume: () => void;
}

type Tab = 'Templates' | 'Font-Resize';

const CoverLetterBuilder: React.FC<CoverLetterBuilderProps> = ({
  coverLetterData,
  onUpdate,
  resumeData,
  onBack,
  onGoToResume
}) => {
  const [customization, setCustomization] = useState<CustomizationSettings>(initialCustomizationSettings);
  const [activeTab, setActiveTab] = useState<Tab>('Templates');

  const handleTemplateSelect = (templateId: string) => {
    onUpdate({
      ...coverLetterData,
      templateId
    });
  };

  const handleCustomizationUpdate = (newSettings: CustomizationSettings) => {
    setCustomization(newSettings);
  };

  // Declare html2pdf for TypeScript since it's loaded from a script tag
  declare var html2pdf: any;

  const getPdfOptions = () => {
    return {
      margin: [10, 10, 10, 10], // 10mm margins
      filename: `${coverLetterData.senderName || 'Cover_Letter'}_${coverLetterData.companyName || 'Application'}.pdf`.replace(/[^a-zA-Z0-9_-]/g, '_'),
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
    };
  };

  const performPdfAction = (action: 'save' | 'preview') => {
    const originalElement = document.getElementById('cover-letter-preview');
    if (!originalElement) {
      console.error("Cover letter preview element not found.");
      alert("Could not find the cover letter preview to download.");
      return;
    }

    // Create a clone to render for PDF generation
    const elementToPrint = originalElement.cloneNode(true) as HTMLElement;

    // A container for the clone, positioned off-screen
    const printContainer = document.createElement('div');
    printContainer.style.position = 'absolute';
    printContainer.style.left = '-9999px';
    printContainer.style.top = '0';

    // Set clone's dimensions to match paper size for 1:1 scaling
    elementToPrint.style.width = '8.5in';
    elementToPrint.style.height = 'auto';

    printContainer.appendChild(elementToPrint);
    document.body.appendChild(printContainer);

    const opt = getPdfOptions();
    // Increase scale for better quality
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

    // Ensure the off-screen element is removed after the PDF operation is complete
    promise.catch((err: any) => {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
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


  return (
    <div className="flex flex-col min-h-screen font-sans bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* Header */}
      <header
        className="bg-white dark:bg-gray-800 shadow-md p-4 z-10"
        role="banner"
      >
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
              <span className="text-green-500">AI</span> Cover Letter Builder
            </h1>
          </div>

          <nav aria-label="Cover letter actions">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={onGoToResume}
                aria-label="Switch to resume builder"
                className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md shadow-sm hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-800 transition-colors"
              >
                Build Resume now
              </button>
              <button
                onClick={handlePreviewPdf}
                aria-label="Preview cover letter as PDF"
                className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors"
              >
                Preview
              </button>
              <button
                onClick={handlePrintPdf}
                aria-label="Download cover letter as PDF"
                className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                Download PDF
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex" role="main">
        <div className="w-full grid grid-cols-1 lg:grid-cols-10 xl:grid-cols-4 gap-4 p-4 items-start">
          {/* Left Panel: Editor */}
          <div className="lg:col-span-3 xl:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md p-1">
            <div className="p-4">
              <h2
                id="editor-heading"
                className="text-lg font-semibold text-gray-800 dark:text-white mb-4"
              >
                Cover Letter Details
              </h2>

              <div role="form" aria-labelledby="editor-heading">
                <CoverLetterEditor
                  data={coverLetterData}
                  onUpdate={onUpdate}
                  resumeData={resumeData}
                />
              </div>
            </div>
          </div>

          {/* Center Panel: Preview */}
          <div className="lg:col-span-4 xl:col-span-2 flex items-start justify-center bg-gray-200 dark:bg-gray-700 rounded-lg shadow-inner">
            <div className="w-full p-4">
              <div
                role="region"
                aria-label="Cover Letter Preview"
                aria-live="polite"
                className="overflow-auto"
              >
                <CoverLetterPreview data={coverLetterData} customization={customization} />
              </div>
            </div>
          </div>

          {/* Right Panel: Templates & Customization */}
          <div className="lg:col-span-3 xl:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-4 px-4" aria-label="Tabs">
                {(['Templates', 'Font-Resize'] as Tab[]).map((tab) => (
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

            <div className="p-4">
              {activeTab === 'Templates' && (
                <CoverLetterTemplatePanel
                  selectedTemplateId={coverLetterData.templateId}
                  onTemplateSelect={handleTemplateSelect}
                />
              )}
              {activeTab === 'Font-Resize' && (
                <TypographyTab
                  settings={customization}
                  onUpdate={handleCustomizationUpdate}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CoverLetterBuilder;