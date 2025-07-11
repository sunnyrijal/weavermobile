import React from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';

const themeLabels: Record<string, string> = {
  cozy: 'Cozy',
};

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex gap-2 items-center">
      <button
        onClick={() => setTheme('cozy')}
        className={`px-4 py-1 rounded-full transition-all text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]
          ${theme === 'cozy'
            ? 'bg-[var(--color-primary)] text-[var(--color-surface)] shadow-[var(--shadow)] border-[var(--color-primary)]'
            : 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-primary)] hover:bg-[var(--color-accent)]'}
        `}
      >
        {themeLabels['cozy']}
      </button>
    </div>
  );
} 