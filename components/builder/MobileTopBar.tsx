import React, { useEffect, useRef, useState } from 'react';

export interface MenuAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

interface MobileTopBarProps {
  title: string;
  onBack: () => void;
  menuActions?: MenuAction[];
  /** Label on the menu trigger. */
  menuLabel?: string;
  /** Rendered on the trailing edge before the menu (e.g. a Download button). */
  trailing?: React.ReactNode;
}

const MobileTopBar: React.FC<MobileTopBarProps> = ({
  title,
  onBack,
  menuActions = [],
  menuLabel = 'More',
  trailing,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: Event) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', onKey);
    };
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

      <h1 className="flex-1 min-w-0 text-base font-semibold text-gray-800 dark:text-white truncate">{title}</h1>

      {trailing}

      {menuActions.length > 0 && (
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(v => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="inline-flex items-center gap-1 pl-2.5 pr-2 min-h-[40px] rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {menuLabel}
            <svg className={`w-4 h-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-1 w-60 rounded-lg shadow-xl bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 py-1 z-50 animate-slideIn"
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
                  className="flex w-full items-center gap-3 px-4 min-h-[48px] text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {action.icon && (
                    <span className="flex-shrink-0 w-5 h-5 text-gray-500 dark:text-gray-400">{action.icon}</span>
                  )}
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
