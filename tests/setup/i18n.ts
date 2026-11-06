import { vi } from 'vitest';
import { createTranslator } from '../../src/shared/i18n/core';
vi.mock('server-only', () => ({}));

// Existing hook-isolation tests call component functions with mocked React.
// Keep their established default locale explicit; localization suites unmock
// these adapters to exercise real context and server cookie behavior.
vi.mock('@/shared/i18n/provider', () => ({
  LocaleProvider: ({ children }: { children: unknown }) => children,
  useI18n: () => ({ locale: 'vi' as const, revision: 0, t: createTranslator('vi'), setLocale: vi.fn() }),
}));
vi.mock('@/shared/i18n/server', () => ({ getServerI18n: async () => ({ locale: 'vi' as const, t: createTranslator('vi') }) }));
