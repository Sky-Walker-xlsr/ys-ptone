import type { ThemeTokens } from './types';

export const darkTheme: ThemeTokens = {
  id: 'dark', label: 'Dark', isDark: true,
  colors: {
    bgPrimary:    '#0f0f10',
    bgSecondary:  '#1a1a1c',
    bgTertiary:   '#242427',
    bgSidebar:    '#141416',
    bgCard:       '#1e1e21',
    textPrimary:  '#f0f0f1',
    textMuted:    '#a0a0a8',
    textSubtle:   '#606068',
    accent:       '#7c6aff',
    accentMuted:  '#3d3580',
    success:      '#3ecf8e',
    warning:      '#f5a623',
    danger:       '#f04444',
    info:         '#4b9eff',
    border:       'rgba(255,255,255,0.08)',
    borderStrong: 'rgba(255,255,255,0.16)',
  },
};
