import React, { useState } from 'react';
import { useViewport } from '../../hooks/useViewport';
import ModeSwitch, { BuilderMode } from './ModeSwitch';
import MobileTopBar, { MenuAction } from './MobileTopBar';
import SectionNav, { SectionNavItem } from './SectionNav';
import PreviewViewport from './PreviewViewport';

interface BuilderShellProps {
  title: string;
  accent: 'blue' | 'green';
  onBack: () => void;
  menuActions?: MenuAction[];

  /** The three surfaces. Rendered in place on every viewport (a remount at the
   *  1024px boundary is accepted — see useViewport). */
  editor: React.ReactNode;
  preview: React.ReactNode;
  design?: React.ReactNode;

  /** Edit-mode section nav (resume). Omit for a single-form editor. */
  sections?: SectionNavItem[];
  activeSection?: string;
  onSectionChange?: (key: string) => void;

  /** Paper width in px for the mobile/tablet preview viewport. */
  sheetWidth?: number;
  /** Primary action on the Preview surface. */
  onDownloadPdf: () => void;
}

const DownloadIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

const DownloadButton: React.FC<{ onClick: () => void; accent: 'blue' | 'green' }> = ({ onClick, accent }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 min-h-[40px] rounded-md text-sm font-medium text-white transition-colors ${
      accent === 'green' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
    }`}
  >
    {DownloadIcon}
    Download
  </button>
);

const BuilderShell: React.FC<BuilderShellProps> = ({
  title,
  accent,
  onBack,
  menuActions = [],
  editor,
  preview,
  design,
  sections,
  activeSection,
  onSectionChange,
  sheetWidth = 794,
  onDownloadPdf,
}) => {
  const viewport = useViewport();
  const [mode, setMode] = useState<BuilderMode>('edit');
  const [designOpen, setDesignOpen] = useState(false);

  // If the design surface goes away (Simple mode has none) while it was open,
  // fall back to Edit rather than showing a blank pane.
  const activeMode: BuilderMode = mode === 'design' && !design ? 'edit' : mode;

  // The builder gates on viewport before rendering this shell; `desktop` never
  // reaches here. Guard anyway so a resize mid-render can't blank the screen.
  if (viewport === 'desktop') return null;

  const previewSurface = <PreviewViewport sheetWidth={sheetWidth} accent={accent}>{preview}</PreviewViewport>;

  if (viewport === 'tablet') {
    return (
      <div className="flex flex-col h-screen [height:100dvh] bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 overflow-hidden">
        <MobileTopBar
          title={title}
          onBack={onBack}
          /* On tablet the secondary actions are visible buttons (below), not a menu. */
          menuActions={[]}
          trailing={
            <div className="flex items-center gap-2">
              {menuActions.map(action => (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                  className="flex-shrink-0 hidden md:inline-flex items-center px-2.5 min-h-[40px] rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
                >
                  {action.label}
                </button>
              ))}
              {design && (
                <button
                  type="button"
                  onClick={() => setDesignOpen(true)}
                  className="flex-shrink-0 inline-flex items-center px-2.5 min-h-[40px] rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Design
                </button>
              )}
              <DownloadButton onClick={onDownloadPdf} accent={accent} />
            </div>
          }
        />
        <main className="flex-1 flex min-h-0">
          <div className="w-[55%] min-w-0 flex min-h-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            {sections && activeSection && onSectionChange && (
              <div className="w-36 flex-shrink-0 border-r border-gray-200 dark:border-gray-700">
                <SectionNav sections={sections} active={activeSection} onChange={onSectionChange} accent={accent} layout="rail" />
              </div>
            )}
            <div className="flex-1 min-w-0 overflow-y-auto">{editor}</div>
          </div>
          <div className="flex-1 min-w-0 min-h-0">{previewSurface}</div>
        </main>

        {design && designOpen && (
          <>
            <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setDesignOpen(false)} />
            <div className="fixed right-0 top-0 bottom-0 w-[380px] max-w-[85vw] bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col animate-slideIn">
              <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200 dark:border-gray-700">
                <span className="font-semibold text-gray-800 dark:text-white">Design</span>
                <button
                  type="button"
                  onClick={() => setDesignOpen(false)}
                  aria-label="Close design panel"
                  className="flex items-center justify-center w-10 h-10 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">{design}</div>
            </div>
          </>
        )}
      </div>
    );
  }

  // mobile
  return (
    <div className="flex flex-col h-screen [height:100dvh] bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 overflow-hidden">
      <MobileTopBar
        title={title}
        onBack={onBack}
        menuActions={menuActions}
        trailing={<DownloadButton onClick={onDownloadPdf} accent={accent} />}
      />

      {activeMode === 'edit' && sections && activeSection && onSectionChange && (
        <SectionNav sections={sections} active={activeSection} onChange={onSectionChange} accent={accent} />
      )}

      <main className="flex-1 min-h-0 relative">
        <div className={`absolute inset-0 overflow-y-auto overscroll-contain ${activeMode === 'edit' ? '' : 'hidden'}`}>
          {editor}
        </div>
        <div className={`absolute inset-0 ${activeMode === 'preview' ? '' : 'hidden'}`}>
          {previewSurface}
        </div>
        {design && (
          <div className={`absolute inset-0 overflow-y-auto overscroll-contain bg-white dark:bg-gray-800 ${activeMode === 'design' ? '' : 'hidden'}`}>
            {design}
          </div>
        )}
      </main>

      <ModeSwitch mode={activeMode} onChange={setMode} accent={accent} showDesign={!!design} />
    </div>
  );
};

export default BuilderShell;
