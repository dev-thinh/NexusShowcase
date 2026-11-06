import { beforeEach, expect, it, vi } from 'vitest';
import { getServerI18n } from '@/shared/i18n/server';
import { localizedMetadata } from '@/shared/i18n/metadata';

vi.unmock('@/shared/i18n/server');
vi.mock('server-only', () => ({}));
const cookie = vi.hoisted(() => ({ value: 'en' }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: (name: string) => name === 'nexus-locale' ? cookie : undefined }) }));
beforeEach(() => { cookie.value = 'en'; });

it('uses the incoming cookie for server-rendered interface text', async () => {
  const { locale, t } = await getServerI18n();
  expect(locale).toBe('en');
  expect(t('Đăng nhập')).toBe('Sign in');
  cookie.value = 'unsupported';
  expect((await getServerI18n()).locale).toBe('vi');
});

it('localizes interface metadata without altering unrelated metadata fields', async () => {
  const generate = localizedMetadata({ title: 'Nghiên cứu khoa học', description: 'Chưa có công trình nào.', robots: { index: true } });
  expect(await generate()).toEqual({ title: 'Research', description: 'No works yet.', robots: { index: true } });
});
