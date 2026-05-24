export type ThemeId = 'dark' | 'light';

export type ThemeTokens = {
  id:     ThemeId;
  label:  string;
  isDark: boolean;
  colors: {
    bgPrimary:    string;
    bgSecondary:  string;
    bgTertiary:   string;
    bgSidebar:    string;
    bgCard:       string;
    textPrimary:  string;
    textMuted:    string;
    textSubtle:   string;
    accent:       string;
    accentMuted:  string;
    success:      string;
    warning:      string;
    danger:       string;
    info:         string;
    border:       string;
    borderStrong: string;
  };
};
