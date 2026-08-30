import React, { useEffect, useRef } from 'react';

export interface SectionNavItem {
  key: string;
  label: string;
  /** Optional count / status shown after the label (e.g. "2"). */
  badge?: string;
}

interface SectionNavProps {
  sections: SectionNavItem[];
  active: string;
  onChange: (key: string) => void;
  accent: 'blue' | 'green';
  /** 'chips' scrolls horizontally (mobile); 'rail' stacks vertically (tablet). */
  layout?: 'chips' | 'rail';
}

const SectionNav: React.FC<SectionNavProps> = ({ sections, active, onChange, accent, layout = 'chips' }) => {
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [active]);

  const activeChip =
    accent === 'green'
      ? 'bg-green-600 text-white border-green-600'
      : 'bg-blue-600 text-white border-blue-600';
  const idleChip =
    'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600';

  if (layout === 'rail') {
    return (
      <nav className="flex flex-col gap-1 p-2 overflow-y-auto" aria-label="Resume sections">
        {sections.map(s => (
          <button
            key={s.key}
            type="button"
            onClick={() => onChange(s.key)}
            aria-current={active === s.key ? 'true' : undefined}
            className={`flex items-center justify-between px-3 min-h-[44px] rounded-md text-sm font-medium text-left transition-colors ${
              active === s.key
                ? accent === 'green'
                  ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span className="truncate">{s.label}</span>
            {s.badge && <span className="ml-2 text-xs opacity-70">{s.badge}</span>}
          </button>
        ))}
      </nav>
    );
  }

  return (
    <nav
      className="flex-shrink-0 flex gap-2 px-3 py-2 overflow-x-auto bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Resume sections"
    >
      {sections.map(s => (
        <button
          key={s.key}
          ref={active === s.key ? activeRef : undefined}
          type="button"
          aria-current={active === s.key ? 'true' : undefined}
          onClick={() => onChange(s.key)}
          className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 min-h-[36px] rounded-full border text-sm font-medium whitespace-nowrap transition-colors ${
            active === s.key ? activeChip : idleChip
          }`}
        >
          {s.label}
          {s.badge && (
            <span
              className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[11px] ${
                active === s.key ? 'bg-white/25' : 'bg-gray-200 dark:bg-gray-600'
              }`}
            >
              {s.badge}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
};

export default SectionNav;
