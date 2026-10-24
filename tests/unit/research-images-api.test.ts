import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ actor: vi.fn(), read: vi.fn(), save: vi.fn() }));
vi.mock('@/features/identity/server/actor', () => ({ getActor: mocks.actor }));
vi.mock('@/features/publications/server/photo-library', () => ({ readSharedLibrary: mocks.read, saveSharedGallery: mocks.save }));
vi.mock('@/server/observability/errors', () => ({ reportServerError: vi.fn() }));
import { GET, PUT } from '@/app/api/home/research/route';
import { defaultResearchImages } from '../fixtures/moments';
const input = { version: 0, photos: defaultResearchImages };
const request = (body: unknown) => new Request('http://localhost/api/home/research', { method: 'PUT', headers: { Origin: 'http://localhost' }, body: JSON.stringify(body) });
beforeEach(() => { vi.clearAllMocks(); mocks.actor.mockResolvedValue(null); mocks.read.mockResolvedValue({ home: input, research: input }); });

it('returns the research gallery independently from moments', async () => {
  const response = await GET();
  const data = await response.json();
  expect(data).toMatchObject({ ...input, isAdmin: false });
  expect(data.library).toBeUndefined();
  expect(response.headers.get('Cache-Control')).toBe('private, no-store');
});
it('rejects non-admins before writing', async () => {
  expect((await PUT(request(input))).status).toBe(403);
  expect(mocks.save).not.toHaveBeenCalled();
});
it('rejects positions outside the three research slots and foreign origins', async () => {
  mocks.actor.mockResolvedValue({ role: 'ADMIN' });
  expect((await PUT(request({ ...input, photos: [{ ...defaultResearchImages[0], slot: 3 }] }))).status).toBe(400);
  const foreign = request(input); foreign.headers.set('Origin', 'https://foreign.test');
  expect((await PUT(foreign)).status).toBe(403);
  expect(mocks.save).not.toHaveBeenCalled();
});
it('saves research and the shared library together and detects conflicts', async () => {
  mocks.actor.mockResolvedValue({ role: 'ADMIN' });
  mocks.save.mockResolvedValue({ success: true, data: { ...input, version: 1 } });
  expect((await PUT(request(input))).status).toBe(200);
  expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({ version: 0 }), 'research', undefined);
  mocks.save.mockResolvedValue({ success: false, code: 'CONFLICT', error: 'Conflict' });
  expect((await PUT(request(input))).status).toBe(409);
});

it('returns the shared library only to admins', async () => {
  mocks.actor.mockResolvedValue({ role: 'ADMIN' });
  expect((await (await GET()).json()).library).toMatchObject(input);
});

it('validates the shared library before writing', async () => {
  mocks.actor.mockResolvedValue({ role: 'ADMIN' });
  expect((await PUT(request({ ...input, library: { version: -1, photos: [] } }))).status).toBe(400);
  expect(mocks.save).not.toHaveBeenCalled();
});
