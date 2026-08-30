import React, { useState } from 'react';
import { ResumeData, ReorderableSectionKey } from '../../types';
import Accordion from '../ui/Accordion';
import BasicsSection from './BasicsSection';
import SummarySection from './SummarySection';
import ExperienceSection from './ExperienceSection';
import EducationSection from './EducationSection';
import SkillsSection from './SkillsSection';
import ProfilesSection from './ProfilesSection';
import LanguagesSection from './LanguagesSection';
import CertificationsSection from './CertificationsSection';
import ProjectsSection from './ProjectsSection';
import InterestsSection from './InterestsSection';
import ReferencesSection from './ReferencesSection';

interface EditorPanelProps {
  resumeData: ResumeData;
  onUpdate: (data: ResumeData) => void;
  template: string;
  /** Controlled active section. When omitted the panel manages its own. */
  activeSection?: string | null;
  onSectionChange?: (key: string) => void;
  /** `accordion` = the desktop list; `single` = one section, no accordion chrome. */
  display?: 'accordion' | 'single';
}

const SECTION_TITLES: Record<'basics' | ReorderableSectionKey, string> = {
  basics: 'Basics',
  summary: 'Summary',
  profiles: 'Social Profiles',
  experience: 'Work Experience',
  projects: 'Projects',
  education: 'Education',
  certifications: 'Certifications',
  skills: 'Skills',
  languages: 'Languages',
  interests: 'Interests',
  references: 'References',
};

/** Ordered [basics, ...sectionOrder] with display titles — drives the mobile section nav. */
export const getResumeSections = (resumeData: ResumeData): { key: string; label: string }[] => [
  { key: 'basics', label: SECTION_TITLES.basics },
  ...resumeData.sectionOrder.map(key => ({ key, label: SECTION_TITLES[key] })),
];

const DragHandle: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 cursor-grab group-hover:text-gray-600">
    <circle cx="9" cy="6" r="1.5" />
    <circle cx="15" cy="6" r="1.5" />
    <circle cx="9" cy="12" r="1.5" />
    <circle cx="15" cy="12" r="1.5" />
    <circle cx="9" cy="18" r="1.5" />
    <circle cx="15" cy="18" r="1.5" />
  </svg>
);

const EditorPanel: React.FC<EditorPanelProps> = ({
  resumeData,
  onUpdate,
  template,
  activeSection: controlledSection,
  onSectionChange,
  display = 'accordion',
}) => {
  const [draggedItem, setDraggedItem] = useState<{ key: ReorderableSectionKey, column: number } | null>(null);
  const [internalSection, setInternalSection] = useState<string | null>('basics');

  const isControlled = controlledSection !== undefined;
  const activeSection = isControlled ? controlledSection : internalSection;

  const handleAccordionToggle = (sectionName: string) => {
    if (isControlled) {
      onSectionChange?.(activeSection === sectionName ? '' : sectionName);
    } else {
      setInternalSection(prev => prev === sectionName ? null : sectionName);
    }
  };

  const sectionConfig: Record<ReorderableSectionKey, { title: string; component: React.ReactNode }> = {
    summary: { title: 'Summary', component: <SummarySection summary={resumeData.summary} onUpdate={summary => onUpdate({ ...resumeData, summary })} /> },
    profiles: { title: 'Social Profiles', component: <ProfilesSection profiles={resumeData.profiles} onUpdate={profiles => onUpdate({ ...resumeData, profiles })} /> },
    experience: { title: 'Work Experience', component: <ExperienceSection experience={resumeData.experience} onUpdate={experience => onUpdate({ ...resumeData, experience })} /> },
    projects: { title: 'Projects', component: <ProjectsSection projects={resumeData.projects} onUpdate={projects => onUpdate({ ...resumeData, projects })} /> },
    education: { title: 'Education', component: <EducationSection education={resumeData.education} onUpdate={education => onUpdate({ ...resumeData, education })} /> },
    certifications: { title: 'Certifications', component: <CertificationsSection certifications={resumeData.certifications} onUpdate={certifications => onUpdate({ ...resumeData, certifications })} /> },
    skills: { title: 'Skills', component: <SkillsSection skills={resumeData.skills} onUpdate={skills => onUpdate({ ...resumeData, skills })} /> },
    languages: { title: 'Languages', component: <LanguagesSection languages={resumeData.languages} onUpdate={languages => onUpdate({ ...resumeData, languages })} /> },
    interests: { title: 'Interests', component: <InterestsSection interests={resumeData.interests} onUpdate={interests => onUpdate({ ...resumeData, interests })} /> },
    references: { title: 'References', component: <ReferencesSection references={resumeData.references} onUpdate={references => onUpdate({ ...resumeData, references })} /> },
  };

  /**
   * Mobile up/down reorder. For a multi-column template the preview reads from
   * `layout[template]`, not `sectionOrder`, so the swap has to happen inside the
   * section's own column there; `sectionOrder` is then rebuilt to match.
   */
  const moveSection = (key: ReorderableSectionKey, dir: -1 | 1) => {
    const templateLayout = resumeData.layout[template];

    if (templateLayout) {
      const cols: ('column1' | 'column2')[] = ['column1', 'column2'];
      const colKey = cols.find(c => templateLayout[c].includes(key));
      if (!colKey) return;
      const col = [...templateLayout[colKey]];
      const i = col.indexOf(key);
      const j = i + dir;
      if (j < 0 || j >= col.length) return;
      [col[i], col[j]] = [col[j], col[i]];
      const newTemplateLayout = { ...templateLayout, [colKey]: col };
      onUpdate({
        ...resumeData,
        layout: { ...resumeData.layout, [template]: newTemplateLayout },
        sectionOrder: [...newTemplateLayout.column1, ...newTemplateLayout.column2],
      });
      return;
    }

    const order = [...resumeData.sectionOrder];
    const i = order.indexOf(key);
    const j = i + dir;
    if (i === -1 || j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    onUpdate({ ...resumeData, sectionOrder: order });
  };

  /** Bounds for the mobile up/down buttons in the section's effective column. */
  const reorderBounds = (key: ReorderableSectionKey): { index: number; length: number } => {
    const templateLayout = resumeData.layout[template];
    if (templateLayout) {
      const col = templateLayout.column1.includes(key) ? templateLayout.column1 : templateLayout.column2;
      return { index: col.indexOf(key), length: col.length };
    }
    return { index: resumeData.sectionOrder.indexOf(key), length: resumeData.sectionOrder.length };
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, key: ReorderableSectionKey, column: number) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItem({ key, column });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, targetKey: ReorderableSectionKey, targetColumn: number) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.key === targetKey) return;

    const { key: draggedKey, column: sourceColumn } = draggedItem;

    const newLayout = { ...resumeData.layout };
    const templateLayout = { ...(newLayout[template] || { column1: [], column2: [] }) };

    const sourceColKey = `column${sourceColumn}` as const;
    const targetColKey = `column${targetColumn}` as const;

    let sourceColItems = [...templateLayout[sourceColKey]];
    let targetColItems = sourceColumn === targetColumn ? sourceColItems : [...templateLayout[targetColKey]];

    const draggedIndex = sourceColItems.indexOf(draggedKey);
    if (draggedIndex === -1) return;

    const [removed] = sourceColItems.splice(draggedIndex, 1);

    const targetIndex = targetColItems.indexOf(targetKey);
    targetColItems.splice(targetIndex, 0, removed);

    templateLayout[sourceColKey] = sourceColItems;
    templateLayout[targetColKey] = targetColItems;
    newLayout[template] = templateLayout;

    const newSectionOrder = [...templateLayout.column1, ...templateLayout.column2];

    onUpdate({ ...resumeData, layout: newLayout, sectionOrder: newSectionOrder });
  };

  const handleDropInColumn = (e: React.DragEvent<HTMLDivElement>, targetColumn: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    const { key: draggedKey, column: sourceColumn } = draggedItem;

    const templateLayout = resumeData.layout[template];
    if (!templateLayout || sourceColumn === targetColumn || templateLayout[`column${targetColumn}` as const].length > 0) return;

    const newLayout = { ...resumeData.layout };
    const sourceColKey = `column${sourceColumn}` as const;
    const targetColKey = `column${targetColumn}` as const;

    const newSourceCol = templateLayout[sourceColKey].filter(k => k !== draggedKey);
    const newTargetCol = [...templateLayout[targetColKey], draggedKey];

    newLayout[template] = {
      ...templateLayout,
      [sourceColKey]: newSourceCol,
      [targetColKey]: newTargetCol
    };

    const newSectionOrder = [...newLayout[template].column1, ...newLayout[template].column2];
    onUpdate({ ...resumeData, layout: newLayout, sectionOrder: newSectionOrder });
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const renderSectionsForColumn = (columnKeys: ReorderableSectionKey[], column: number) => {
    return columnKeys.map(key => (
      <div
        key={key}
        draggable
        onDragStart={(e) => handleDragStart(e, key, column)}
        onDragOver={(e) => handleDragOver(e, key, column)}
        onDragEnd={handleDragEnd}
        className={`transition-opacity ${draggedItem?.key === key ? 'opacity-50' : 'opacity-100'}`}
      >
        <Accordion
          title={sectionConfig[key].title}
          dragHandle={<DragHandle />}
          isOpen={activeSection === key}
          onToggle={() => handleAccordionToggle(key)}
        >
          {sectionConfig[key].component}
        </Accordion>
      </div>
    ));
  }

  const templateLayout = resumeData.layout[template];
  const isMultiColumn = !!templateLayout;

  const getColumnTitles = () => {
    if (template === 'Default') return { col1: 'Main Column (Left)', col2: 'Sidebar (Right)' };
    if (template === 'Modern') return { col1: 'Main Column (Right)', col2: 'Sidebar (Left)' };
    if (template === 'Creative') return { col1: 'Sidebar (Left)', col2: 'Main Column (Right)' };
    if (template === 'Elegant') return { col1: 'Sidebar (Left)', col2: 'Main Column (Right)' };
    if (template === 'Corporate') return { col1: 'Sidebar (Left)', col2: 'Main Column (Right)' };
    return { col1: 'Main Column', col2: 'Sidebar Column' };
  }
  const columnTitles = getColumnTitles();

  // ---- Single-section (mobile) ----
  if (display === 'single') {
    const key = (activeSection || 'basics') as string;
    const isReorderable = key !== 'basics';

    // Guard against an unrecognised section key (e.g. a hand-edited JSON import).
    if (key !== 'basics' && !sectionConfig[key as ReorderableSectionKey]) {
      return (
        <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
          This section could not be loaded. Pick another from the list above.
        </div>
      );
    }

    const { index: reIndex, length: reLength } = isReorderable
      ? reorderBounds(key as ReorderableSectionKey)
      : { index: -1, length: 0 };

    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {SECTION_TITLES[key as 'basics' | ReorderableSectionKey]}
          </h2>
          {isReorderable && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => moveSection(key as ReorderableSectionKey, -1)}
                disabled={reIndex <= 0}
                aria-label="Move section up"
                className="flex items-center justify-center w-11 h-11 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
              </button>
              <button
                type="button"
                onClick={() => moveSection(key as ReorderableSectionKey, 1)}
                disabled={reIndex === -1 || reIndex >= reLength - 1}
                aria-label="Move section down"
                className="flex items-center justify-center w-11 h-11 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
              </button>
            </div>
          )}
        </div>
        {key === 'basics'
          ? <BasicsSection basics={resumeData.basics} onUpdate={basics => onUpdate({ ...resumeData, basics })} />
          : sectionConfig[key as ReorderableSectionKey].component}
      </div>
    );
  }

  // ---- Accordion list (desktop) ----
  return (
    <div className="space-y-1">
      <Accordion
        title="Basics"
        isOpen={activeSection === 'basics'}
        onToggle={() => handleAccordionToggle('basics')}
      >
        <BasicsSection basics={resumeData.basics} onUpdate={basics => onUpdate({ ...resumeData, basics })} />
      </Accordion>

      {isMultiColumn ? (
        <>
          <div>
            <h4 className="p-3 font-semibold text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50">{columnTitles.col1}</h4>
            <div
              className="min-h-[4rem]"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDropInColumn(e, 1)}
            >
              {renderSectionsForColumn(templateLayout.column1, 1)}
            </div>
          </div>
          <div>
            <h4 className="p-3 font-semibold text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50">{columnTitles.col2}</h4>
            <div
              className="min-h-[4rem]"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDropInColumn(e, 2)}
            >
              {renderSectionsForColumn(templateLayout.column2, 2)}
            </div>
          </div>
        </>
      ) : (
        resumeData.sectionOrder.map((key) => (
          <div
            key={key}
            draggable
            onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setDraggedItem({ key, column: 0 }); }}
            onDragOver={(e) => {
              e.preventDefault();
              if (!draggedItem || draggedItem.key === key) return;

              const currentOrder = resumeData.sectionOrder;
              const draggedIndex = currentOrder.indexOf(draggedItem.key);
              const targetIndex = currentOrder.indexOf(key);

              if (draggedIndex === -1 || targetIndex === -1) return;

              const newOrder = [...currentOrder];
              const [removed] = newOrder.splice(draggedIndex, 1);
              newOrder.splice(targetIndex, 0, removed);

              onUpdate({ ...resumeData, sectionOrder: newOrder });
            }}
            onDragEnd={handleDragEnd}
            className={`transition-opacity ${draggedItem?.key === key ? 'opacity-50' : 'opacity-100'}`}
          >
            <Accordion
              title={sectionConfig[key].title}
              dragHandle={<DragHandle />}
              isOpen={activeSection === key}
              onToggle={() => handleAccordionToggle(key)}
            >
              {sectionConfig[key].component}
            </Accordion>
          </div>
        ))
      )}
    </div>
  );
};

export default EditorPanel;
