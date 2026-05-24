import type { ThemeTokens } from './types';

export const lightTheme: ThemeTokens = {
  id: 'light', label: 'Light', isDark: false,
  colors: {
    bgPrimary:    '#ffffff',
    bgSecondary:  '#f5f5f7',
    bgTertiary:   '#ebebed',
    bgSidebar:    '#f9f9fa',
    bgCard:       '#ffffff',
    textPrimary:  '#0f0f10',
    textMuted:    '#6b6b72',
    textSubtle:   '#a8a8b0',
    accent:       '#5b4ecc',
    accentMuted:  '#ece9ff',
    success:      '#1a8a5a',
    warning:      '#c47d0a',
    danger:       '#cc2222',
    info:         '#1a6fd4',
    border:       'rgba(0,0,0,0.08)',
    borderStrong: 'rgba(0,0,0,0.16)',
  },
};
