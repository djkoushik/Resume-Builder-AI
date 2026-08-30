import React, { useCallback, useRef, useState } from 'react';
import { FileText, Image, ShieldCheck, Upload } from 'lucide-react';
import type { ResumeData } from '../../types';
import { applyImportedContent, isPristineResume } from '../../utils/resumeData';
import {
  ImportError,
  importResumeFile,
  summarizeContent,
  type ImportedContent,
  type ImportProgress,
  type ParsedResume,
} from '../../utils/resumeImport';
import ImportReviewPanel from './ImportReviewPanel';

interface ImportResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Current resume, used for the overwrite check and to keep presentation settings. */
  currentResume: ResumeData;
  onImport: (data: ResumeData) => void;
}

type Phase =
  | { kind: 'idle' }
  | { kind: 'parsing'; progress: ImportProgress }
  | { kind: 'review'; parsed: ParsedResume }
  | { kind: 'error'; code: string; message: string; detail?: string };

const AI_PREFERENCE_KEY = 'buildresumenow:import-ai-refine';

/**
 * The AI opt-out, remembered per browser.
 *
 * Storage can throw outright in private windows and with site data blocked, so
 * both directions are guarded and a failure just means the default applies.
 */
const readAIPreference = (): boolean => {
  try {
    return localStorage.getItem(AI_PREFERENCE_KEY) !== 'off';
  } catch {
    return true;
  }
};

const writeAIPreference = (enabled: boolean) => {
  try {
    localStorage.setItem(AI_PREFERENCE_KEY, enabled ? 'on' : 'off');
  } catch {
    // A preference we cannot remember is not worth failing an import over.
  }
};

const STAGE_LABEL: Record<ImportProgress['stage'], string> = {
  reading: 'Reading your file',
  sections: 'Finding sections',
  structuring: 'Structuring your experience',
  review: 'Preparing your review',
};

const ImportResumeModal: React.FC<ImportResumeModalProps> = ({
  isOpen,
  onClose,
  currentResume,
  onImport,
}) => {
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const [isDragging, setIsDragging] = useState(false);
  const [useAI, setUseAI] = useState(readAIPreference);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isParsingRef = useRef(false);

  const reset = useCallback(() => {
    setPhase({ kind: 'idle' });
    setIsDragging(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const handleFile = useCallback(async (file: File) => {
    // Ignore a second file dropped while the first is still parsing —
    // otherwise both pipelines run and the later one wins, which may not be
    // the file the user chose last.
    if (isParsingRef.current) return;
    isParsingRef.current = true;

    setPhase({ kind: 'parsing', progress: { stage: 'reading' } });

    try {
      const parsed = await importResumeFile(
        file,
        progress => setPhase({ kind: 'parsing', progress }),
        { useAI }
      );
      setPhase({ kind: 'review', parsed });
    } catch (error) {
      console.error('Resume import failed:', error);

      if (error instanceof ImportError) {
        setPhase({ kind: 'error', code: error.code, message: error.message, detail: error.detail });
      } else {
        // Nothing we anticipated. Surface the underlying message rather than
        // swallowing it — an unexplained failure is unreportable, and the user
        // is the only one who can see it.
        setPhase({
          kind: 'error',
          code: 'unknown',
          message: 'Something went wrong while reading that file.',
          detail: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
        });
      }
    } finally {
      isParsingRef.current = false;
    }
  }, [useAI]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset so choosing the same file twice still fires a change event.
    event.target.value = '';
    if (file) void handleFile(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const handleConfirm = () => {
    if (phase.kind !== 'review') return;
    // The parent unmounts the modal in response to onImport, so there is no
    // state left to reset afterwards.
    onImport(applyImportedContent(currentResume, phase.parsed.content));
  };

  const handleReviewChange = (content: ImportedContent) => {
    setPhase(prev => (prev.kind === 'review' ? { kind: 'review', parsed: { ...prev.parsed, content } } : prev));
  };

  if (!isOpen) return null;

  const pristine = isPristineResume(currentResume);

  const title =
    phase.kind === 'review'
      ? 'Review Your Imported Resume'
      : phase.kind === 'parsing'
        ? 'Reading Your Resume'
        : phase.kind === 'error'
          ? 'We Could Not Read This File'
          : 'Upload Your Resume';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="import-modal-title" role="dialog" aria-modal="true">
      <div
        className="flex items-end justify-center min-h-screen pt-4 px-4 pb-4 text-center sm:block sm:p-0"
        onClick={handleClose}
      >
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/*
          Follows the ATSModal shell, with two of its mobile defects fixed:
          `w-full` below sm: so the panel fills the gutters rather than
          shrink-wrapping, and no pb-20 eating the bottom of a phone screen.
        */}
        <div
          className="inline-block align-bottom w-full bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full"
          onClick={e => e.stopPropagation()}
        >
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b dark:border-gray-700 flex justify-between items-start gap-3">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="import-modal-title">
                {title}
              </h3>
              {phase.kind === 'review' && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{summarizeContent(phase.parsed)}</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="bg-white dark:bg-gray-800 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4 bg-gray-50 dark:bg-gray-900 max-h-[70vh] sm:max-h-[80vh] overflow-y-auto">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleInputChange}
              className="hidden"
            />

            {phase.kind === 'idle' && (
              <>
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg bg-white dark:bg-gray-800 p-6 sm:p-12 text-center transition-colors ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <div className="w-14 h-14 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-5">
                    <Upload className="h-7 w-7 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                  </div>
                  <p className="text-base font-medium text-gray-900 dark:text-white mb-1">
                    <span className="hidden sm:inline">Drop your resume here</span>
                    <span className="sm:hidden">Choose your resume file</span>
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 sm:mb-5">
                    PDF or Word document, up to 10&nbsp;MB
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto px-4 py-3 sm:py-2 text-base sm:text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Choose File
                  </button>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mt-5">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        Your file stays on your device
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        We read it in your browser. The file is never uploaded to our servers.
                      </p>
                    </div>
                  </div>

                  <label className="flex items-start gap-3 mt-4 pt-4 border-t border-blue-200 dark:border-blue-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useAI}
                      onChange={event => {
                        setUseAI(event.target.checked);
                        writeAIPreference(event.target.checked);
                      }}
                      className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span>
                      <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                        Use AI to sort out unclear job titles
                      </span>
                      <span className="block text-sm text-gray-600 dark:text-gray-300">
                        If a heading is ambiguous, we send just that line to an AI service to
                        split it up. Never your name, email, phone or address. Turn this off and
                        everything is worked out on your device alone.
                      </span>
                    </span>
                  </label>
                </div>
              </>
            )}

            {phase.kind === 'parsing' && (
              <div className="space-y-3" role="status" aria-live="polite">
                {(['reading', 'sections', 'structuring', 'review'] as const).map(stage => {
                  const order = ['reading', 'sections', 'structuring', 'review'];
                  const currentIndex = order.indexOf(phase.progress.stage);
                  const stageIndex = order.indexOf(stage);
                  const done = stageIndex < currentIndex;
                  const active = stageIndex === currentIndex;

                  return (
                    <div
                      key={stage}
                      className={`flex items-center gap-3 bg-white dark:bg-gray-800 border rounded-lg px-4 py-3.5 ${
                        active
                          ? 'border-blue-200 dark:border-blue-800'
                          : 'border-gray-200 dark:border-gray-700'
                      } ${!done && !active ? 'opacity-50' : ''}`}
                    >
                      {done ? (
                        <svg className="h-5 w-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
                        </svg>
                      ) : active ? (
                        <svg className="animate-spin h-5 w-5 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <circle cx="12" cy="12" r="10" />
                        </svg>
                      )}
                      <span className={`text-sm flex-grow ${active ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                        {STAGE_LABEL[stage]}
                      </span>
                      {stage === 'reading' && phase.progress.pageCount ? (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {phase.progress.pageCount} {phase.progress.pageCount === 1 ? 'page' : 'pages'}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center pt-3">
                  This usually takes a few seconds.
                </p>
              </div>
            )}

            {phase.kind === 'error' && (
              <>
                <div className="flex items-start gap-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
                  <div className="w-11 h-11 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    {phase.code === 'scanned-pdf' ? (
                      <Image className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                    ) : (
                      <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                    )}
                  </div>
                  <div className="flex-grow">
                    <p className="text-base font-medium text-gray-900 dark:text-white mb-1.5">{phase.message}</p>

                    {phase.detail && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono break-words mt-1">
                        {phase.detail}
                      </p>
                    )}

                    {phase.code === 'own-export' && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-4 mt-3">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                          Bring it back with Import JSON
                        </p>
                        {/*
                          A button, not a link: App.tsx intercepts every
                          same-origin <a> and would navigate away from here.
                        */}
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          If you also saved the <span className="font-medium">.json</span> file when you
                          downloaded, close this and use{' '}
                          <button
                            type="button"
                            onClick={handleClose}
                            className="text-blue-600 dark:text-blue-400 font-medium underline hover:text-blue-800 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                          >
                            Import JSON
                          </button>{' '}
                          on the Custom builder&rsquo;s Layout tab to restore everything exactly.
                        </p>
                      </div>
                    )}

                    {phase.code === 'scanned-pdf' && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-4 mt-3">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                          Turn the scan into text first
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Open the PDF in Google&nbsp;Drive (right-click &rarr; Open with Google&nbsp;Docs),
                          Adobe&nbsp;Acrobat, or macOS&nbsp;Preview to run OCR, then save a new PDF and
                          upload that. Better still, upload the original document if you can find it.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2.5">What you can try</p>
                  <ul className="space-y-2">
                    {(phase.code === 'password-protected'
                      ? [
                          'Open the PDF, remove its password, and save a copy',
                          'Upload the Word (.docx) version if you have one',
                          'Start from a blank resume and paste your content in',
                        ]
                      : phase.code === 'corrupt-file'
                        ? [
                            'Check the file opens normally on your computer',
                            'Re-save or re-export it from the app that created it',
                            'If it was renamed, save it properly as .docx or PDF',
                          ]
                        : phase.code === 'own-export'
                          ? [
                              'Import the .json file you downloaded alongside the PDF',
                              'Upload the Word (.docx) version if you kept one',
                              'Start from a blank resume and paste your content in',
                            ]
                          : phase.code === 'scanned-pdf'
                            ? [
                                'Run OCR on it (Google Docs, Acrobat, or Preview) and upload the result',
                                'Upload the original Word (.docx) or text-based PDF instead',
                                'Start from a blank resume and type your content in',
                              ]
                            : [
                                'Upload the Word (.docx) version if you have one',
                                'Re-export the PDF from the app that created it',
                                'Start from a blank resume and paste your content in',
                              ]
                    ).map(tip => (
                      <li key={tip} className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                        <svg className="h-4 w-4 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
                        </svg>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {phase.kind === 'review' && (
              <ImportReviewPanel
                parsed={phase.parsed}
                onChange={handleReviewChange}
                isPristine={pristine}
                aiUnavailable={phase.parsed.warnings.includes('ai-unavailable')}
              />
            )}
          </div>

          {(phase.kind === 'review' || phase.kind === 'error') && (
            <div className="bg-white dark:bg-gray-800 px-4 py-4 sm:px-6 border-t dark:border-gray-700 flex gap-3 sm:justify-end">
              <button
                type="button"
                onClick={phase.kind === 'review' ? handleClose : reset}
                className="flex-1 sm:flex-none px-4 py-3 sm:py-2 text-base sm:text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {phase.kind === 'review' ? 'Cancel' : 'Start From Blank'}
              </button>
              <button
                type="button"
                onClick={phase.kind === 'review' ? handleConfirm : () => fileInputRef.current?.click()}
                className="flex-1 sm:flex-none px-4 py-3 sm:py-2 text-base sm:text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {phase.kind === 'review' ? (
                  <>
                    <span className="sm:hidden">Use This</span>
                    <span className="hidden sm:inline">Use This Resume</span>
                  </>
                ) : (
                  <>
                    <span className="sm:hidden">Try Another</span>
                    <span className="hidden sm:inline">Try Another File</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportResumeModal;
