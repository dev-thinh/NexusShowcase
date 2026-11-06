import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ actor: vi.fn(), read: vi.fn(), save: vi.fn(), report: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/features/identity/server/actor', () => ({ getActor: mocks.actor }));
vi.mock('@/features/publications/server/home-content', () => ({ readHomeContent: mocks.read, saveHomeContent: mocks.save }));
vi.mock('@/server/observability/errors', () => ({ reportServerError: mocks.report }));
import { defaultHomeText, defaultEnglishHomeText, homeContentSchema } from '@/features/publications/model/home-content';
import { GET, PUT } from '@/app/api/home/content/route';
const request = (body: unknown, origin = 'http://localhost') => new Request('http://localhost/api/home/content', { method: 'PUT', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(body) });
beforeEach(() => {
  vi.clearAllMocks();
  mocks.actor.mockResolvedValue(null);
  mocks.read.mockResolvedValue({ version: 0, englishText: defaultEnglishHomeText, text: defaultHomeText });
  mocks.save.mockResolvedValue({ version: 1, englishText: defaultEnglishHomeText, text: defaultHomeText });
});
it('validates the complete plain-text document and bounded version', () => {
  expect(homeContentSchema.safeParse({ version: 0, englishText: defaultEnglishHomeText, text: defaultHomeText }).success).toBe(true);
  for (const text of [{}, { ...defaultHomeText, heroTitle: ' ' }, { ...defaultHomeText, heroTitle: 'x'.repeat(201) }]) {
    expect(homeContentSchema.safeParse({ version: 0, englishText: defaultEnglishHomeText, text }).success).toBe(false);
  }
  expect(homeContentSchema.safeParse({ version: -1, englishText: defaultEnglishHomeText, text: defaultHomeText }).success).toBe(false);
});
it('allows visitors to read copy but does not expose admin controls', async () => {
  const response = await GET();
  expect(response.headers.get('cache-control')).toBe('private, no-store');
  expect(await response.json()).toEqual({ version: 0, englishText: defaultEnglishHomeText, text: defaultHomeText, isAdmin: false });
});
it('derives edit permission from the active admin actor', async () => {
  mocks.actor.mockResolvedValue({ id: 'admin', role: 'ADMIN' });
  expect((await (await GET()).json()).isAdmin).toBe(true);
});
it('rejects unauthorized and cross-origin mutations before persisting', async () => {
  expect((await PUT(request({ version: 0, englishText: defaultEnglishHomeText, text: defaultHomeText }))).status).toBe(403);
  mocks.actor.mockResolvedValue({ id: 'admin', role: 'ADMIN' });
  expect((await PUT(request({ version: 0, englishText: defaultEnglishHomeText, text: defaultHomeText }, 'https://other.example'))).status).toBe(403);
  expect(mocks.save).not.toHaveBeenCalled();
});
it('rejects invalid content and preserves optimistic concurrency', async () => {
  mocks.actor.mockResolvedValue({ id: 'admin', role: 'ADMIN' });
  expect((await PUT(request({ version: 0, text: {} }))).status).toBe(400);
  expect(mocks.save).not.toHaveBeenCalled();
  mocks.save.mockResolvedValue(null);
  expect((await PUT(request({ version: 0, englishText: defaultEnglishHomeText, text: defaultHomeText }))).status).toBe(409);
});
it('saves validated copy and reports database errors without leaking details', async () => {
  mocks.actor.mockResolvedValue({ id: 'admin', role: 'ADMIN' });
  expect((await PUT(request({ version: 0, englishText: defaultEnglishHomeText, text: defaultHomeText }))).status).toBe(200);
  expect(mocks.save).toHaveBeenCalledWith({ version: 0, englishText: defaultEnglishHomeText, text: defaultHomeText });
  mocks.save.mockRejectedValue(new Error('private database secret'));
  const response = await PUT(request({ version: 0, englishText: defaultEnglishHomeText, text: defaultHomeText }));
  expect(response.status).toBe(500);
  expect(await response.text()).not.toContain('private database secret');
});

it('merges the first research title and removes retired copy when reading saved legacy text', async () => {
  const { normalizeHomeText } = await import('@/features/publications/model/home-content');
  const normalized = normalizeHomeText({ ...defaultHomeText, researchOneTitle: 'AI mới', researchOneSubtitle: 'Thị giác mới', membersDescription: 'Dòng cũ' });
  expect(normalized.researchOneTitle).toBe('AI mới & Thị giác mới');
  expect(normalized).not.toHaveProperty('researchOneSubtitle');
  expect(normalized).not.toHaveProperty('membersDescription');
});

it('preserves both remaining research titles when joining their legacy lines', async () => {
  const { normalizeHomeText } = await import('@/features/publications/model/home-content');
  const text = normalizeHomeText({ ...defaultHomeText, researchTwoTitle: 'Robot mới', researchTwoSubtitle: 'Điều khiển mới', researchThreeTitle: 'IoT mới', researchThreeSubtitle: 'Nhúng mới' });
  expect(text.researchTwoTitle).toBe('Robot mới & Điều khiển mới');
  expect(text.researchThreeTitle).toBe('IoT mới & Nhúng mới');
  expect(text).not.toHaveProperty('researchTwoSubtitle');
  expect(text).not.toHaveProperty('researchThreeSubtitle');
});
