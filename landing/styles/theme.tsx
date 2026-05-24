'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { getTheme, defaultTheme } from './themes';
import type { ThemeId, ThemeTokens } from './themes';

const STORAGE_KEY = 'ptone_theme';

type ThemeContextType = {
  theme:    ThemeTokens;
  themeId:  ThemeId;
  setTheme: (id: ThemeId) => void;
  toggle:   () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme:    getTheme(defaultTheme),
  themeId:  defaultTheme,
  setTheme: () => {},
  toggle:   () => {},
});

function applyTheme(t: ThemeTokens) {
  const r = document.documentElement;
  r.setAttribute('data-theme', t.id);
  Object.entries({
    '--bg-page':       t.colors.bgPage,
    '--bg-surface':    t.colors.bgSurface,
    '--bg-card':       t.colors.bgCard,
    '--bg-card-hover': t.colors.bgCardHover,
    '--bg-navbar':     t.colors.bgNavbar,
    '--text-primary':  t.colors.textPrimary,
    '--text-muted':    t.colors.textMuted,
    '--text-subtle':   t.colors.textSubtle,
    '--accent':        t.colors.accent,
    '--accent-hover':  t.colors.accentHover,
    '--accent-muted':  t.colors.accentMuted,
    '--accent-text':   t.colors.accentText,
    '--success':       t.colors.success,
    '--warning':       t.colors.warning,
    '--danger':        t.colors.danger,
    '--border':        t.colors.border,
    '--border-strong': t.colors.borderStrong,
    '--navbar-border': t.colors.navbarBorder,
  }).forEach(([k, v]) => r.style.setProperty(k, v));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>(defaultTheme);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    const active = (stored === 'dark' || stored === 'light') ? stored : defaultTheme;
    setThemeIdState(active);
    applyTheme(getTheme(active));
  }, []);

  useEffect(() => {
    applyTheme(getTheme(themeId));
  }, [themeId]);

  const setTheme = (id: ThemeId) => {
    setThemeIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  const toggle = () => setTheme(themeId === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme: getTheme(themeId), themeId, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
