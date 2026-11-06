import 'server-only';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { createTranslator, LOCALE_COOKIE, parseLocale } from './core';

export const getServerI18n = cache(async () => {
  const locale = parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  return { locale, t: createTranslator(locale) };
});
