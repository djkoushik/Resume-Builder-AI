import React from 'react';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  onEnhance?: () => Promise<void>;
  isEnhancing?: boolean;
};

const Spinner = (
  <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const Textarea: React.FC<TextareaProps> = ({ label, id, onEnhance, isEnhancing, ...props }) => {
  const enhanceButton = onEnhance && (
    <button
      type="button"
      onClick={onEnhance}
      disabled={isEnhancing}
      className="inline-flex items-center justify-center gap-1.5 px-3 min-h-[36px] text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isEnhancing ? <>{Spinner}<span>Enhancing…</span></> : <span>Enhance with AI</span>}
    </button>
  );

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center gap-2 mb-1">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        {/* Inline on wider screens; a full-width action below the field on phones. */}
        {onEnhance && <div className="hidden sm:block">{enhanceButton}</div>}
      </div>
      <textarea
        id={id}
        rows={4}
        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        {...props}
      />
      {onEnhance && <div className="sm:hidden mt-2 [&>button]:w-full">{enhanceButton}</div>}
    </div>
  );
};

export default Textarea;
