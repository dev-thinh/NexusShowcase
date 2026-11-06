import common from './messages/common.en.json';
import identity from './messages/identity.en.json';
import publications from './messages/publications.en.json';
import submissions from './messages/submissions.en.json';

export type Locale = 'vi' | 'en';
export const LOCALE_COOKIE = 'nexus-locale';
const english: Record<string, string> = { ...identity, ...publications, ...submissions, ...common };
const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();
const templates = Object.entries(english).filter(([key]) => /\{\d+\}/.test(key)).sort(([a], [b]) => b.length - a.length).map(([key, value]) => {
  const order: string[] = [];
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{(\d+)\\\}/g, (_, index: string) => { order.push(index); return '(.+?)'; });
  return { pattern: new RegExp(`^${escaped}$`, 'u'), value, order };
});

export function parseLocale(value?: string | null): Locale { return value === 'en' ? 'en' : 'vi'; }

export function createTranslator(locale: Locale) {
  return (source: string, ...values: unknown[]): string => {
    if (!source) return source;
    const key = normalize(source);
    let result = locale === 'en' ? english[key] ?? source : source;
    if (locale === 'en' && !english[key] && !values.length) {
      for (const template of templates) {
        const match = template.pattern.exec(key);
        if (!match) continue;
        const captures = Object.fromEntries(template.order.map((index, i) => [index, match[i + 1]]));
        return template.value.replace(/\{(\d+)\}/g, (token, index: string) => captures[index] ?? token);
      }
    }
    if (locale === 'en' && english[key]) {
      result = `${source.match(/^\s*/)?.[0] ?? ''}${result}${source.match(/\s*$/)?.[0] ?? ''}`;
    }
    return result.replace(/\{(\d+)\}/g, (token, index: string) => Number(index) < values.length ? String(values[Number(index)]) : token);
  };
}
