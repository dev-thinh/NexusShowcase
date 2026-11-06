'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createTranslator, LOCALE_COOKIE, parseLocale, type Locale } from './core';

const LocaleContext = createContext<{ locale: Locale; revision: number; setLocale: (locale: Locale) => void }>({ locale: 'vi', revision: 0, setLocale: () => {} });

export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const [locale, updateLocale] = useState(initialLocale);
  const [revision, setRevision] = useState(0);
  const setLocale = useCallback((next: Locale) => {
    const value = parseLocale(next);
    document.cookie = `${LOCALE_COOKIE}=${value}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
    updateLocale(value);
    setRevision(current => current + 1);
  }, []);
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  const context = useMemo(() => ({ locale, revision, setLocale }), [locale, revision, setLocale]);
  return <LocaleContext.Provider value={context}>{children}</LocaleContext.Provider>;
}

export function useI18n() {
  const { locale, revision, setLocale } = useContext(LocaleContext);
  const t = useMemo(() => createTranslator(locale), [locale]);
  return { locale, revision, setLocale, t };
}
