'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
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

interface LanguageProviderProps {
  children:     ReactNode;
  initialLang?: Language;  // Vom Server (geo-detected) übergeben
}

export function LanguageProvider({ children, initialLang = 'de' }: LanguageProviderProps) {
  const [lang, setLangState] = useState<Language>(initialLang);

  useEffect(() => {
    // localStorage hat Priorität über geo-detection (User-Wunsch)
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (stored === 'de' || stored === 'en') {
      setLangState(stored);
    }
  }, []);

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  };

  const t = <T extends Record<string, string>>(
    strings: Record<Language, T>
  ): T => strings[lang];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useTranslation = () => useContext(LanguageContext);
