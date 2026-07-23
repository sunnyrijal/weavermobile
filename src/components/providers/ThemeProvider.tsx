import React, { createContext, useContext, useState, useEffect } from 'react';

const themes = {
  cozy: {
    name: 'Cozy',
    variables: {
      '--color-primary': '#FF914D',
      '--color-accent': '#FFB199',
      '--color-background': '#FFF8F3',
      '--color-surface': '#FFFFFF',
      '--color-text': '#4B2E05',
      '--shadow': '0 4px 24px rgba(255, 145, 77, 0.10)',
      '--radius': '1.25rem',
      '--spacing': '1.5rem',
      '--font-family': 'Inter, Segoe UI, sans-serif',
    },
  },
  serene: {
    name: 'Serene',
    variables: {
      '--color-primary': '#A3C4F3',
      '--color-accent': '#D1C4E9',
      '--color-background': '#F7FAFC',
      '--color-surface': '#F0F4FA',
      '--color-text': '#3A3A4A',
      '--shadow': '0 2px 16px rgba(163, 196, 243, 0.10)',
      '--radius': '1.5rem',
      '--spacing': '2rem',
      '--font-family': 'Nunito, Segoe UI, sans-serif',
    },
  },
  vibrant: {
    name: 'Vibrant',
    variables: {
      '--color-primary': '#00C2B2',
      '--color-accent': '#FFD600',
      '--color-background': '#FFFDF7',
      '--color-surface': '#FFFFFF',
      '--color-text': '#22223B',
      '--shadow': '0 6px 24px rgba(0, 194, 178, 0.12)',
      '--radius': '1rem',
      '--spacing': '1rem',
      '--font-family': 'Quicksand, Segoe UI, sans-serif',
    },
  },
};

const ThemeContext = createContext({
  theme: 'cozy',
  setTheme: (theme: string) => {},
  themes: Object.keys(themes),
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState('cozy');

  useEffect(() => {
    const vars = (themes as any)[theme].variables;
    for (const key in vars) {
      document.documentElement.style.setProperty(key, (vars as any)[key]);
    }
    document.documentElement.style.fontFamily = vars['--font-family'];
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: Object.keys(themes) }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
} 