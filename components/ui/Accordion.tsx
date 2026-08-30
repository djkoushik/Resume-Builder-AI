import React, { useState, ReactNode } from 'react';

interface AccordionProps {
  title: string;
  children: ReactNode;
  isOpenDefault?: boolean;
  dragHandle?: ReactNode;
  /** Optional content shown at the trailing edge, before the chevron. */
  meta?: ReactNode;
  isOpen?: boolean;
  onToggle?: () => void;
}

const Accordion: React.FC<AccordionProps> = ({ title, children, isOpenDefault = false, dragHandle, meta, isOpen: controlledIsOpen, onToggle }) => {
  const [internalIsOpen, setInternalIsOpen] = useState(isOpenDefault);

  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const handleToggle = () => {
    if (isControlled) {
      onToggle?.();
    } else {
      setInternalIsOpen(!isOpen);
    }
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <h2>
        <button
          type="button"
          className="flex items-center justify-between w-full p-4 font-medium text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
          onClick={handleToggle}
        >
          <div className="flex items-center">
            {dragHandle}
            <span className={dragHandle ? 'ml-2' : ''}>{title}</span>
          </div>
          <div className="flex items-center gap-3">
            {meta}
            <svg
            className={`w-5 h-5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            ></path>
            </svg>
          </div>
        </button>
      </h2>
      {isOpen && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800">
          {children}
        </div>
      )}
    </div>
  );
};

export default Accordion;