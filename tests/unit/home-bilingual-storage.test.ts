import { expect, it, vi } from 'vitest';
import { defaultHomeText, defaultEnglishHomeText, homeContentSchema } from '@/features/publications/model/home-content';
import { readHomeContent, saveHomeContent } from '@/features/publications/server/home-content';

vi.mock('server-only', () => ({}));
vi.mock('@/server/db/prisma', () => ({ prisma: {} }));
const database = () => ({ homePageContent: { findUnique: vi.fn(), updateMany: vi.fn(), create: vi.fn() } });
const asDatabase = (db: ReturnType<typeof database>) => db as unknown as Parameters<typeof readHomeContent>[0];

it('preserves legacy Vietnamese copy and supplies a complete independent English default', async () => {
  const db = database();
  db.homePageContent.findUnique.mockResolvedValue({ version: 7, text: { ...defaultHomeText, heroAction: 'Khám phá riêng' } });
  const content = await readHomeContent(asDatabase(db));
  expect(content.text.heroAction).toBe('Khám phá riêng');
  expect(content.englishText).toEqual(defaultEnglishHomeText);
  expect(Object.keys(content.englishText)).toEqual(Object.keys(defaultHomeText));
});

it('saves both versions atomically without translating either version', async () => {
  const db = database();
  db.homePageContent.updateMany.mockResolvedValue({ count: 1 });
  const text = { ...defaultHomeText, heroAction: 'Khám phá', featuredAction: 'Xem tất cả công trình' };
  const englishText = { ...defaultEnglishHomeText, heroAction: 'Explore more' };
  const saved = await saveHomeContent({ version: 2, text, englishText }, asDatabase(db));
  expect(saved).toEqual({ version: 3, text, englishText });
  expect(db.homePageContent.updateMany).toHaveBeenCalledWith({ where: { id: 'home', version: 2 }, data: { text: { vi: text, en: englishText }, version: { increment: 1 } } });
  db.homePageContent.findUnique.mockResolvedValue({ version: 3, text: { vi: text, en: englishText } });
  expect(await readHomeContent(asDatabase(db))).toEqual(saved);
});

it('requires complete nonempty content in both languages on save', () => {
  expect(homeContentSchema.safeParse({ version: 0, text: defaultHomeText }).success).toBe(false);
  expect(homeContentSchema.safeParse({ version: 0, text: defaultHomeText, englishText: { ...defaultEnglishHomeText, heroTitle: ' ' } }).success).toBe(false);
});

it('does not create a new row after a stale bilingual save', async () => {
  const db = database();
  db.homePageContent.updateMany.mockResolvedValue({ count: 0 });
  expect(await saveHomeContent({ version: 4, text: defaultHomeText, englishText: defaultEnglishHomeText }, asDatabase(db))).toBeNull();
  expect(db.homePageContent.create).not.toHaveBeenCalled();
});
