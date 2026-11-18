import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { AppLanguage } from '../types/music';
import { getTranslations, type TranslationDictionary } from './i18n';
import { loadAppLanguage, saveAppLanguage } from './storage';

interface I18nContextValue {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: TranslationDictionary;
}

const I18nContext = createContext<I18nContextValue>({
  language: 'tr',
  setLanguage: () => {},
  t: getTranslations('tr'),
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(() => loadAppLanguage());

  const setLanguage = useCallback((lang: AppLanguage) => {
    setLanguageState(lang);
    saveAppLanguage(lang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }, []);

  const t = getTranslations(language);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
