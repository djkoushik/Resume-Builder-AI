import React, { useState } from 'react';
import { Info, TriangleAlert } from 'lucide-react';
import Input from '../ui/Input';
import Accordion from '../ui/Accordion';
import type { ImportedContent, ParsedResume } from '../../utils/resumeImport';

interface ImportReviewPanelProps {
  parsed: ParsedResume;
  onChange: (content: ImportedContent) => void;
  /** True when the current resume still holds nothing the user typed. */
  isPristine: boolean;
  aiUnavailable?: boolean;
}

/** A short "we guessed this" note under a field the parser was unsure about. */
const GuessHint: React.FC<{ children: React.ReactNode; id?: string; className?: string }> = ({
  children,
  id,
  className = '-mt-3 mb-4',
}) => (
  <div className={`flex items-center gap-1.5 ${className}`}>
    <Info className="h-3.5 w-3.5 text-amber-700 dark:text-amber-500 flex-shrink-0" aria-hidden="true" />
    <span id={id} className="text-xs text-amber-700 dark:text-amber-500">
      {children}
    </span>
  </div>
);

const CountBadge: React.FC<{ label: string }> = ({ label }) => (
  <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
);

const CheckBadge: React.FC<{ count: number }> = ({ count }) => (
  <span className="text-xs font-semibold text-amber-700 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full whitespace-nowrap">
    {count} to check
  </span>
);

const ImportReviewPanel: React.FC<ImportReviewPanelProps> = ({
  parsed,
  onChange,
  isPristine,
  aiUnavailable = false,
}) => {
  const [openSection, setOpenSection] = useState<string | null>('basics');
  const { content, lowConfidence } = parsed;

  const toggle = (name: string) => setOpenSection(prev => (prev === name ? null : name));

  const isGuess = (path: string) => lowConfidence.includes(path);

  const updateBasics = (field: keyof ImportedContent['basics'], value: string) =>
    onChange({ ...content, basics: { ...content.basics, [field]: value } });

  const updateExperience = (index: number, field: 'company' | 'position', value: string) =>
    onChange({
      ...content,
      experience: content.experience.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      ),
    });

  const experienceGuesses = content.experience.filter(
    (_, index) => isGuess(`experience.${index}.company`) || isGuess(`experience.${index}.position`)
  ).length;

  const educationGuesses = content.education.filter(
    (_, index) => isGuess(`education.${index}.institution`) || isGuess(`education.${index}.degree`)
  ).length;

  const skillCount = content.skills.reduce((total, group) => total + group.keywords.length, 0);

  return (
    <div className="space-y-4">
      {aiUnavailable && (
        <div
          className="flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
          role="status"
        >
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
              We read your resume without AI assistance this time
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Everything is here, but job titles and company names are worth a closer look.
            </p>
          </div>
        </div>
      )}

      {!isPristine && (
        <div
          className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4"
          role="alert"
        >
          <TriangleAlert className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              This will replace what you have written so far
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Your template, colours and layout settings are kept.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <Accordion title="Basics" isOpen={openSection === 'basics'} onToggle={() => toggle('basics')}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <div>
              <Input
                label="Full Name"
                id="import-name"
                value={content.basics.name}
                highlight={isGuess('basics.name')}
                aria-describedby={isGuess('basics.name') ? 'import-name-hint' : undefined}
                onChange={e => updateBasics('name', e.target.value)}
              />
              {isGuess('basics.name') && (
                <GuessHint id="import-name-hint">We could not read this — please add it</GuessHint>
              )}
            </div>
            <Input
              label="Email"
              id="import-email"
              type="email"
              value={content.basics.email}
              onChange={e => updateBasics('email', e.target.value)}
            />
            <Input
              label="Phone"
              id="import-phone"
              type="tel"
              value={content.basics.phone}
              onChange={e => updateBasics('phone', e.target.value)}
            />
            <div>
              <Input
                label="Location"
                id="import-location"
                value={content.basics.location}
                highlight={isGuess('basics.location')}
                aria-describedby={isGuess('basics.location') ? 'import-location-hint' : undefined}
                onChange={e => updateBasics('location', e.target.value)}
              />
              {isGuess('basics.location') && (
                <GuessHint id="import-location-hint">We could not read this — please add it</GuessHint>
              )}
            </div>
            <div className="sm:col-span-2">
              <Input
                label="Headline / Job Title"
                id="import-headline"
                value={content.basics.headline}
                highlight={isGuess('basics.headline')}
                aria-describedby={isGuess('basics.headline') ? 'import-headline-hint' : undefined}
                onChange={e => updateBasics('headline', e.target.value)}
              />
              {isGuess('basics.headline') && (
                <GuessHint id="import-headline-hint">We guessed this one, worth a check</GuessHint>
              )}
            </div>
          </div>
        </Accordion>

        <Accordion
          title="Work Experience"
          isOpen={openSection === 'experience'}
          onToggle={() => toggle('experience')}
          meta={
            <>
              {experienceGuesses > 0 && <CheckBadge count={experienceGuesses} />}
              <CountBadge label={`${content.experience.length} ${content.experience.length === 1 ? 'role' : 'roles'}`} />
            </>
          }
        >
          {content.experience.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No work experience found. You can add roles after importing.
            </p>
          ) : (
            <div className="space-y-4">
              {content.experience.map((entry, index) => {
                const companyGuess = isGuess(`experience.${index}.company`);
                const positionGuess = isGuess(`experience.${index}.position`);
                const flagged = companyGuess || positionGuess;
                return (
                <div
                  key={entry.id}
                  className={`bg-white dark:bg-gray-700 border rounded-md p-4 ${
                    flagged
                      ? 'border-amber-300 dark:border-amber-500/50'
                      : 'border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                    <Input
                      label="Company"
                      id={`import-company-${entry.id}`}
                      value={entry.company}
                      highlight={companyGuess}
                      aria-describedby={flagged ? `import-exp-hint-${entry.id}` : undefined}
                      onChange={e => updateExperience(index, 'company', e.target.value)}
                    />
                    <Input
                      label="Position"
                      id={`import-position-${entry.id}`}
                      value={entry.position}
                      highlight={positionGuess}
                      aria-describedby={flagged ? `import-exp-hint-${entry.id}` : undefined}
                      onChange={e => updateExperience(index, 'position', e.target.value)}
                    />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {entry.startDate || 'No start date'}
                    {' — '}
                    {entry.isCurrent ? 'Present' : entry.endDate || 'No end date'}
                    {entry.location ? ` · ${entry.location}` : ''}
                  </p>
                  {flagged && (
                    <div className="mt-2">
                      <GuessHint id={`import-exp-hint-${entry.id}`} className="">
                        Company and role were split automatically, please confirm
                      </GuessHint>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </Accordion>

        <Accordion
          title="Education"
          isOpen={openSection === 'education'}
          onToggle={() => toggle('education')}
          meta={
            <>
              {educationGuesses > 0 && <CheckBadge count={educationGuesses} />}
              <CountBadge label={`${content.education.length} ${content.education.length === 1 ? 'degree' : 'degrees'}`} />
            </>
          }
        >
          {content.education.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No education found.</p>
          ) : (
            <ul className="space-y-2">
              {content.education.map((entry, index) => {
                const flagged =
                  isGuess(`education.${index}.institution`) || isGuess(`education.${index}.degree`);
                return (
                  <li
                    key={entry.id}
                    className={`text-sm text-gray-700 dark:text-gray-300 ${
                      flagged ? 'border-l-2 border-amber-400 pl-2' : ''
                    }`}
                  >
                    <span className="font-medium">{entry.institution || 'Unknown institution'}</span>
                    {entry.degree ? ` — ${entry.degree}` : ''}
                    {entry.startDate || entry.endDate ? (
                      <span className="text-gray-500 dark:text-gray-400">
                        {' '}({entry.startDate}{entry.endDate ? ` – ${entry.endDate}` : ''})
                      </span>
                    ) : null}
                    {flagged && (
                      <GuessHint className="mt-1">
                        We split this entry automatically, please confirm it in the builder
                      </GuessHint>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Accordion>

        <Accordion
          title="Skills"
          isOpen={openSection === 'skills'}
          onToggle={() => toggle('skills')}
          meta={<CountBadge label={`${skillCount} skills`} />}
        >
          {content.skills.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No skills found.</p>
          ) : (
            <div className="space-y-3">
              {content.skills.map(group => (
                <div key={group.id}>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{group.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{group.keywords.join(', ')}</p>
                </div>
              ))}
            </div>
          )}
        </Accordion>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        Anything we missed can be added in the builder after importing.
      </p>
    </div>
  );
};

export default ImportReviewPanel;
