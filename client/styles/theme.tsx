'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { getTheme, defaultTheme } from '@/styles/themes';
import type { ThemeId, ThemeTokens } from '@/styles/themes';

const STORAGE_KEY = 'ptone_theme';

type ThemeContextType = {
  theme:    ThemeTokens;
  themeId:  ThemeId;
  toggle:   () => void;
  setTheme: (id: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme:    getTheme(defaultTheme),
  themeId:  defaultTheme,
  toggle:   () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>(defaultTheme);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    if (stored && getTheme(stored).id === stored) setThemeIdState(stored);
  }, []);

  useEffect(() => {
    const t = getTheme(themeId);
    const r = document.documentElement;
    r.setAttribute('data-theme', themeId);
    r.style.setProperty('--bg-primary',    t.colors.bgPrimary);
    r.style.setProperty('--bg-secondary',  t.colors.bgSecondary);
    r.style.setProperty('--bg-tertiary',   t.colors.bgTertiary);
    r.style.setProperty('--bg-sidebar',    t.colors.bgSidebar);
    r.style.setProperty('--bg-card',       t.colors.bgCard);
    r.style.setProperty('--bg-page',       t.colors.bgPrimary);
    r.style.setProperty('--bg-surface',    t.colors.bgSecondary);
    r.style.setProperty('--text-primary',  t.colors.textPrimary);
    r.style.setProperty('--text-muted',    t.colors.textMuted);
    r.style.setProperty('--text-subtle',   t.colors.textSubtle);
    r.style.setProperty('--accent',        t.colors.accent);
    r.style.setProperty('--accent-muted',  t.colors.accentMuted);
    r.style.setProperty('--success',       t.colors.success);
    r.style.setProperty('--warning',       t.colors.warning);
    r.style.setProperty('--danger',        t.colors.danger);
    r.style.setProperty('--info',          t.colors.info);
    r.style.setProperty('--border',        t.colors.border);
    r.style.setProperty('--border-strong', t.colors.borderStrong);
  }, [themeId]);

  const setTheme = (id: ThemeId) => {
    setThemeIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  const toggle = () => setTheme(themeId === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme: getTheme(themeId), themeId, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
