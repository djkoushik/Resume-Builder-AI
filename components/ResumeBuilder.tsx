import React, { useState } from 'react';
import { ResumeData, CustomizationSettings } from '../types';
import Header from './Header';
import EditorPanel, { getResumeSections } from './editor/EditorPanel';
import PreviewPanel from './preview/PreviewPanel';
import CustomizationPanel from './customization/CustomizationPanel';
import BuilderShell from './builder/BuilderShell';
import { ScoreIcon, UploadIcon, MailIcon } from './builder/menuIcons';
import Footer from './layout/Footer';
import { useViewport } from '../hooks/useViewport';
import { usePdfExport } from '../hooks/usePdfExport';
import { useResumeImport } from '../hooks/useResumeImport';
import { useAtsModal } from '../hooks/useAtsModal';
import { resumePrintConfig } from '../utils/printConfig';

interface ResumeBuilderProps {
  resumeData: ResumeData;
  customization: CustomizationSettings;
  onResumeChange: (data: ResumeData) => void;
  onCustomizationChange: (settings: CustomizationSettings) => void;
  onBack: () => void;
  onBuildCoverLetter: () => void;
}

const ResumeBuilder: React.FC<ResumeBuilderProps> = ({
  resumeData,
  customization,
  onResumeChange,
  onCustomizationChange,
  onBack,
  onBuildCoverLetter,
}) => {
  const viewport = useViewport();
  const isSimple = resumeData.resumeMode === 'simple';
  const [activeSection, setActiveSection] = useState<string>('basics');

  const { downloadPdf } = usePdfExport({
    getConfig: () => resumePrintConfig(resumeData, customization),
  });

  const { modal: importModal, openImport } = useResumeImport(resumeData, onResumeChange);
  const { modal: atsModal, openAts } = useAtsModal(resumeData, onResumeChange);

  // ---- Desktop: the original three-panel layout, untouched ----
  const desktop = (
    <div className="flex flex-col min-h-screen font-sans bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <Header
        resumeData={resumeData}
        customization={customization}
        onImport={onResumeChange}
        onBack={onBack}
        onBuildCoverLetter={onBuildCoverLetter}
      />
      <main className="flex-grow flex">
        <div className="w-full grid grid-cols-1 lg:grid-cols-10 xl:grid-cols-4 gap-4 p-4 items-start">
          <div className="lg:col-span-3 xl:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md p-1">
            <EditorPanel
              resumeData={resumeData}
              onUpdate={onResumeChange}
              template={customization.template}
              activeSection={activeSection || null}
              onSectionChange={setActiveSection}
            />
          </div>
          <div
            className={`${isSimple ? 'lg:col-span-7 xl:col-span-3' : 'lg:col-span-4 xl:col-span-2'} flex items-start justify-center bg-gray-200 dark:bg-gray-700 rounded-lg shadow-inner`}
          >
            <PreviewPanel resumeData={resumeData} customization={customization} />
          </div>
          {!isSimple && (
            <div className="lg:col-span-3 xl:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md p-1">
              <CustomizationPanel
                settings={customization}
                onUpdate={onCustomizationChange}
                resumeData={resumeData}
                onImport={onResumeChange}
              />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );

  if (viewport === 'desktop') return desktop;

  // ---- Mobile / tablet: mode-switched shell ----
  return (
    <>
    <BuilderShell
      title="Resume"
      accent="blue"
      onBack={onBack}
      menuActions={[
        { label: 'Resume Score', onClick: openAts, icon: ScoreIcon },
        { label: 'Upload Resume', onClick: openImport, icon: UploadIcon },
        { label: 'Build Cover Letter', onClick: onBuildCoverLetter, icon: MailIcon },
      ]}
      sheetWidth={customization.layout.pageFormat === 'Letter' ? 816 : 794}
      onDownloadPdf={downloadPdf}
      sections={getResumeSections(resumeData)}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      editor={
        <EditorPanel
          resumeData={resumeData}
          onUpdate={onResumeChange}
          template={customization.template}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          display="single"
        />
      }
      preview={<PreviewPanel resumeData={resumeData} customization={customization} variant="bare" />}
      design={
        isSimple ? undefined : (
          <CustomizationPanel
            settings={customization}
            onUpdate={onCustomizationChange}
            resumeData={resumeData}
            onImport={onResumeChange}
          />
        )
      }
    />
    {importModal}
    {atsModal}
    </>
  );
};

export default ResumeBuilder;
