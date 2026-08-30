import React from 'react';

export type BuilderMode = 'edit' | 'preview' | 'design';

interface ModeSwitchProps {
  mode: BuilderMode;
  onChange: (mode: BuilderMode) => void;
  accent: 'blue' | 'green';
  /** Hide the Design tab when the builder has no design surface. */
  showDesign?: boolean;
}

const EditIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
  </svg>
);
const PreviewIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const DesignIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
  </svg>
);

const ModeSwitch: React.FC<ModeSwitchProps> = ({ mode, onChange, accent, showDesign = true }) => {
  const activeText = accent === 'green' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400';

  const items: { key: BuilderMode; label: string; icon: React.ReactNode }[] = [
    { key: 'edit', label: 'Edit', icon: EditIcon },
    { key: 'preview', label: 'Preview', icon: PreviewIcon },
    ...(showDesign ? [{ key: 'design' as const, label: 'Design', icon: DesignIcon }] : []),
  ];

  return (
    <nav
      className="flex-shrink-0 grid border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pb-[env(safe-area-inset-bottom)]"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      aria-label="Builder view"
    >
      {items.map(item => {
        const isActive = mode === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            aria-current={isActive ? 'true' : undefined}
            className={`flex flex-col items-center justify-center gap-1 min-h-[56px] py-2 text-xs font-medium transition-colors ${
              isActive ? activeText : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </nav>
  );
};

export default ModeSwitch;
