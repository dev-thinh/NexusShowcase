'use client';

import { useI18n } from './provider';

export function LanguageSwitch() {
  const { locale, setLocale } = useI18n();
  const english = locale === 'en';
  return <button type="button" role="switch" aria-checked={english} aria-label="Chuyển ngôn ngữ / Switch language" title={english ? 'Switch to Vietnamese' : 'Chuyển sang tiếng Anh'} data-language-switch data-locale={locale} onClick={() => setLocale(english ? 'vi' : 'en')} className="site-language-switch inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-[#153D67] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67] focus-visible:ring-offset-2">
    <span className="w-4 uppercase" aria-hidden="true">{locale}</span>
    <span aria-hidden="true" className={`relative h-5 w-8 rounded-full transition-colors motion-reduce:transition-none ${english ? 'bg-[#153D67]' : 'bg-slate-300'}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform motion-reduce:transition-none ${english ? 'translate-x-3.5' : 'translate-x-0.5'} left-0`} /></span>
  </button>;
}
