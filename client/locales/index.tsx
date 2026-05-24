'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import type { Language } from './types';

const STORAGE_KEY = 'ptone_language';

type LanguageContextType = {
  lang:    Language;
  setLang: (l: Language) => void;
  t:       <T extends Record<string, string>>(strings: Record<Language, T>) => T;
};

const LanguageContext = createContext<LanguageContextType>({
  lang:    'de',
  setLang: () => {},
  t:       (s) => s.de,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('de');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (stored === 'en' || stored === 'de') setLangState(stored);
  }, []);

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  };

  const t = <T extends Record<string, string>>(strings: Record<Language, T>): T =>
    strings[lang];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useTranslation = () => useContext(LanguageContext);
