import type { ThemeTokens } from './types';

export const darkTheme: ThemeTokens = {
  id:     'dark',
  label:  'Dark',
  isDark: true,
  colors: {
    bgPage:       '#07070f',
    bgSurface:    '#0f0f1a',
    bgCard:       '#13131f',
    bgCardHover:  '#181828',
    bgNavbar:     'rgba(7,7,15,0.85)',
    textPrimary:  '#eeeeff',
    textMuted:    '#8888aa',
    textSubtle:   '#55556a',
    accent:       '#7c6aff',
    accentHover:  '#9580ff',
    accentMuted:  'rgba(124,106,255,0.12)',
    accentText:   '#bdb0ff',
    success:      '#3ecf8e',
    warning:      '#f5a623',
    danger:       '#f04444',
    border:       'rgba(255,255,255,0.06)',
    borderStrong: 'rgba(255,255,255,0.12)',
    navbarBorder: 'rgba(124,106,255,0.15)',
  },
};
