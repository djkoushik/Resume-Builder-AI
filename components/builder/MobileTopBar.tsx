import React, { useEffect, useRef, useState } from 'react';

export interface MenuAction {
  label: string;
  onClick: () => void;
}

interface MobileTopBarProps {
  title: string;
  onBack: () => void;
  menuActions?: MenuAction[];
  /** Optional element rendered on the trailing edge before the ⋯ menu (e.g. a Download button in Preview mode). */
  trailing?: React.ReactNode;
}

const MobileTopBar: React.FC<MobileTopBarProps> = ({ title, onBack, menuActions = [], trailing }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  return (
    <header className="flex-shrink-0 flex items-center gap-2 h-14 px-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-20">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="flex items-center justify-center w-11 h-11 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>

      <h1 className="flex-1 text-base font-semibold text-gray-800 dark:text-white truncate">{title}</h1>

      {trailing}

      {menuActions.length > 0 && (
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(v => !v)}
            aria-label="More options"
            aria-haspopup="true"
            aria-expanded={menuOpen}
            className="flex items-center justify-center w-11 h-11 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-1 w-56 rounded-lg shadow-xl bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 py-1 z-50 animate-slideIn"
            >
              {menuActions.map(action => (
                <button
                  key={action.label}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    action.onClick();
                  }}
                  className="flex w-full items-center px-4 min-h-[44px] text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default MobileTopBar;
