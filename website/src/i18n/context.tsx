import { createContext, useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { en } from './en';
import { ptBR } from './pt-BR';
import type { Copy, Language } from './types';

const DICTIONARIES: Record<Language, Copy> = { en, 'pt-BR': ptBR };
const KEY = 'nodeless-lang';

export const I18nContext = createContext<{
  lang: Language;
  copy: Copy;
  setLang: (lang: Language) => void;
}>({ lang: 'en', copy: en, setLang: () => undefined });

/** The document already carries a language by the time React mounts; this keeps it in sync. */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() =>
    document.documentElement.lang === 'pt-BR' ? 'pt-BR' : 'en',
  );

  const setLang = useCallback((next: Language) => {
    document.documentElement.lang = next;
    localStorage.setItem(KEY, next);
    setLangState(next);
  }, []);

  const value = useMemo(
    () => ({ lang, copy: DICTIONARIES[lang], setLang }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
