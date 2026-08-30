import React, { Suspense, lazy, useState } from 'react';
import type { ResumeData } from '../types';

// Same lazy chunk the header and the /resume-builder page use — importing it
// here does not pull the parser into the main bundle.
const ImportResumeModal = lazy(() => import('../components/import/ImportResumeModal'));

export const prefetchImportModal = () => {
  void import('../components/import/ImportResumeModal');
};

/**
 * Mid-session "Upload Resume" import, for the mobile / tablet builder shells
 * (the desktop header has its own copy). Returns the modal element to render
 * and an opener to wire into a menu action.
 */
export const useResumeImport = (
  currentResume: ResumeData,
  onImport: (data: ResumeData) => void
): { modal: React.ReactNode; openImport: () => void } => {
  const [open, setOpen] = useState(false);

  const modal = open ? (
    <Suspense fallback={null}>
      <ImportResumeModal
        isOpen
        onClose={() => setOpen(false)}
        currentResume={currentResume}
        onImport={data => {
          setOpen(false);
          onImport(data);
        }}
      />
    </Suspense>
  ) : null;

  return { modal, openImport: () => setOpen(true) };
};
