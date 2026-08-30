import React from 'react';

interface RemoveButtonProps {
  onClick: () => void;
  label?: string;
}

/**
 * The "remove this entry" control for editor cards. Replaces a bare 12×24px
 * `✕` glyph with a proper 40px touch target.
 */
const RemoveButton: React.FC<RemoveButtonProps> = ({ onClick, label = 'Remove entry' }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    className="absolute top-1.5 right-1.5 flex items-center justify-center w-10 h-10 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
  >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
);

export default RemoveButton;
