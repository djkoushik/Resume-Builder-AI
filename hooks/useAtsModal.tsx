import React, { Suspense, lazy, useCallback, useState } from 'react';
import type { ResumeData } from '../types';

const ATSModal = lazy(() => import('../components/ats/ATSModal'));

/**
 * The ATS "Resume Score" modal, for the mobile / tablet builder shells (the
 * desktop header has its own copy). Returns the modal element and an opener to
 * wire into a menu action.
 */
export const useAtsModal = (
  resumeData: ResumeData,
  onResumeChange: (data: ResumeData) => void
): { modal: React.ReactNode; openAts: () => void } => {
  const [open, setOpen] = useState(false);

  const handleAddSkill = useCallback(
    (skill: string) => {
      const already = resumeData.skills.some(group => group.keywords.includes(skill));
      if (already) return;

      const next: ResumeData = JSON.parse(JSON.stringify(resumeData));
      if (next.skills.length > 0) {
        next.skills[0].keywords.push(skill);
      } else {
        next.skills = [{ id: `skill-${Date.now()}`, name: 'Key Skills', keywords: [skill] }];
      }
      onResumeChange(next);
    },
    [resumeData, onResumeChange]
  );

  const modal = open ? (
    <Suspense fallback={null}>
      <ATSModal
        isOpen
        onClose={() => setOpen(false)}
        resumeData={resumeData}
        onAddSkill={handleAddSkill}
      />
    </Suspense>
  ) : null;

  return { modal, openAts: () => setOpen(true) };
};
