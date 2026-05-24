import type { ThemeTokens } from './types';

export const lightTheme: ThemeTokens = {
  id:     'light',
  label:  'Light',
  isDark: false,
  colors: {
    bgPage:       '#f5f5f8',
    bgSurface:    '#ffffff',
    bgCard:       '#ffffff',
    bgCardHover:  '#f8f8fc',
    bgNavbar:     'rgba(245,245,248,0.90)',
    textPrimary:  '#0d0d1a',
    textMuted:    '#5a5a78',
    textSubtle:   '#9898b0',
    accent:       '#5b4ecc',
    accentHover:  '#6b5ee0',
    accentMuted:  'rgba(91,78,204,0.10)',
    accentText:   '#5b4ecc',
    success:      '#1a8a5a',
    warning:      '#c47d0a',
    danger:       '#cc2222',
    border:       'rgba(0,0,0,0.07)',
    borderStrong: 'rgba(0,0,0,0.14)',
    navbarBorder: 'rgba(0,0,0,0.08)',
  },
};
