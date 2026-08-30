
import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  /** Draw the field in an "unsure — worth checking" amber state (import review). */
  highlight?: boolean;
};

const Input: React.FC<InputProps> = ({ label, id, highlight = false, className, ...props }) => {
  const tone = highlight
    ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-400 dark:border-amber-500/70 focus:ring-amber-500 focus:border-amber-500'
    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500';

  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <input
        id={id}
        className={`w-full min-h-[44px] px-3 py-2 border rounded-md shadow-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 sm:min-h-0 sm:text-sm ${tone}${className ? ` ${className}` : ''}`}
        {...props}
      />
    </div>
  );
};

export default Input;
