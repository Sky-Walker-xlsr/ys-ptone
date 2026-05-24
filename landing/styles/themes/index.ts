import { darkTheme }  from './dark';
import { lightTheme } from './light';
import type { ThemeTokens, ThemeId } from './types';

export const themes: Record<ThemeId, ThemeTokens> = {
  dark:  darkTheme,
  light: lightTheme,
};

export const defaultTheme: ThemeId = 'dark';

export function getTheme(id: string): ThemeTokens {
  return themes[id as ThemeId] ?? themes[defaultTheme];
}

export * from './types';
