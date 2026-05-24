export type ThemeId = 'dark' | 'light';

export type ThemeTokens = {
  id:     ThemeId;
  label:  string;
  isDark: boolean;
  colors: {
    bgPage:       string;
    bgSurface:    string;
    bgCard:       string;
    bgCardHover:  string;
    bgNavbar:     string;
    textPrimary:  string;
    textMuted:    string;
    textSubtle:   string;
    accent:       string;
    accentHover:  string;
    accentMuted:  string;
    accentText:   string;
    success:      string;
    warning:      string;
    danger:       string;
    border:       string;
    borderStrong: string;
    navbarBorder: string;
  };
};
