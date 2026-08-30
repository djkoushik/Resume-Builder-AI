import React, { useState } from 'react';
import { CoverLetterData, ResumeData, CustomizationSettings } from '../../types';
import CoverLetterEditor from './CoverLetterEditor';
import CoverLetterPreview from './CoverLetterPreview';
import CoverLetterTemplatePanel from './CoverLetterTemplatePanel';
import TypographyTab from '../customization/TypographyTab';
import ColorTab from '../customization/ColorTab';
import BuilderShell from '../builder/BuilderShell';
import Footer from '../layout/Footer';
import { useViewport } from '../../hooks/useViewport';
import { usePdfExport } from '../../hooks/usePdfExport';
// import AuthButton from '../AuthButton';
import { ChevronDown, Download, Eye } from 'lucide-react';

// Declare html2pdf for TypeScript since it's loaded from a script tag
declare var html2pdf: any;

interface CoverLetterBuilderProps {
  coverLetterData: CoverLetterData;
  onUpdate: (data: CoverLetterData) => void;
  resumeData: ResumeData;
  customization: CustomizationSettings;
  onCustomizationChange: (settings: CustomizationSettings) => void;
  onBack: () => void;
  onGoToResume: () => void;
}

type Tab = 'Templates' | 'Font-Resize' | 'Colors';

const CoverLetterBuilder: React.FC<CoverLetterBuilderProps> = ({
  coverLetterData,
  onUpdate,
  resumeData,
  customization,
  onCustomizationChange,
  onBack,
  onGoToResume
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('Templates');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const viewport = useViewport();

  const { downloadPdf: shellDownloadPdf } = usePdfExport({
    elementId: 'cover-letter-preview',
    getOptions: () => getPdfOptions(),
    printWidth: '8.5in',
    printMinHeight: '11in',
  });

  const handleTemplateSelect = (templateId: string) => {
    onUpdate({
      ...coverLetterData,
      templateId
    });
  };

  const handleCustomizationUpdate = (newSettings: CustomizationSettings) => {
    onCustomizationChange(newSettings);
  };

  const getPdfOptions = () => {
    return {
      margin: 0, // No margins to allow full-bleed backgrounds and prevent overflow
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
    elementToPrint.style.minHeight = '11in';
    elementToPrint.style.height = 'auto';
    elementToPrint.style.maxHeight = 'none';
    elementToPrint.style.overflow = 'visible';
    elementToPrint.classList.remove('overflow-auto'); // Remove tailwind overflow class if present

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
    if (typeof (window as any).checkUserLimit === 'function' && !(window as any).checkUserLimit()) {
      return;
    }
    performPdfAction('save');
  };

  const handlePreviewPdf = () => {
    if (typeof (window as any).checkUserLimit === 'function' && !(window as any).checkUserLimit()) {
      return;
    }
    performPdfAction('preview');
  };

  const mobileDesign = (
    <div className="p-4 space-y-8">
      <section>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Template</h3>
        <CoverLetterTemplatePanel selectedTemplateId={coverLetterData.templateId} onTemplateSelect={handleTemplateSelect} />
      </section>
      <section>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Text</h3>
        <TypographyTab settings={customization} onUpdate={handleCustomizationUpdate} isCoverLetter />
      </section>
      <section>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Colours</h3>
        <ColorTab settings={customization} onUpdate={handleCustomizationUpdate} isCoverLetter />
      </section>
    </div>
  );

  const desktop = (
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

              <div className="relative inline-block text-left">
                <div>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="inline-flex justify-center w-full px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 items-center transition-colors"
                    id="options-menu"
                    aria-expanded="true"
                    aria-haspopup="true"
                  >
                    Download PDF
                    <ChevronDown className="-mr-1 ml-1 sm:ml-2 h-4 w-4 sm:h-5 w-5" aria-hidden="true" />
                  </button>
                </div>

                {isDropdownOpen && (
                  <div
                    className="origin-top-right absolute right-0 mt-2 w-56 sm:w-72 rounded-lg shadow-xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden animate-slideIn"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="options-menu"
                  >
                    <div className="p-1" role="none">
                      <button
                        onClick={() => {
                          handlePreviewPdf();
                          setIsDropdownOpen(false);
                        }}
                        aria-label="Preview cover letter as PDF"
                        className="group flex w-full items-center p-2 sm:p-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors duration-150"
                        role="menuitem"
                      >
                        <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gray-50 dark:bg-gray-700/30 text-gray-600 dark:text-gray-400 group-hover:bg-gray-100 dark:group-hover:bg-gray-700/50 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                          <Eye className="h-4 w-4 sm:h-5 w-5" />
                        </div>
                        <div className="ml-2 sm:ml-3 text-left">
                          <p className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm group-hover:text-gray-900 dark:group-hover:text-white">Preview</p>
                          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">View how your cover letter looks</p>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          handlePrintPdf();
                          setIsDropdownOpen(false);
                        }}
                        aria-label="Download cover letter as PDF"
                        className="group flex w-full items-center p-2 sm:p-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors duration-150 mt-1"
                        role="menuitem"
                      >
                        <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 group-hover:bg-green-100 dark:group-hover:bg-green-900/50 group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors">
                          <Download className="h-4 w-4 sm:h-5 w-5" />
                        </div>
                        <div className="ml-2 sm:ml-3 text-left">
                          <p className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm group-hover:text-gray-900 dark:group-hover:text-white">Download PDF</p>
                          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">Save your cover letter as a PDF file</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* <AuthButton /> */}
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
                {(['Templates', 'Font-Resize', 'Colors'] as Tab[]).map((tab) => (
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
                  isCoverLetter={true}
                />
              )}
              {activeTab === 'Colors' && (
                <ColorTab
                  settings={customization}
                  onUpdate={handleCustomizationUpdate}
                  isCoverLetter={true}
                />
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );

  if (viewport === 'desktop') return desktop;

  return (
    <BuilderShell
      title="Cover letter"
      accent="green"
      onBack={onBack}
      menuActions={[{ label: 'Switch to the résumé builder', onClick: onGoToResume }]}
      sheetWidth={816}
      onDownloadPdf={shellDownloadPdf}
      editor={
        <div className="p-4">
          <div role="form" aria-label="Cover letter details">
            <CoverLetterEditor data={coverLetterData} onUpdate={onUpdate} resumeData={resumeData} />
          </div>
        </div>
      }
      preview={<CoverLetterPreview data={coverLetterData} customization={customization} variant="bare" />}
      design={mobileDesign}
    />
  );
};

export default CoverLetterBuilder;