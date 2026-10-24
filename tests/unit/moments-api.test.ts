import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ actor: vi.fn(), read: vi.fn(), save: vi.fn(), report: vi.fn() }));
vi.mock('@/features/identity/server/actor', () => ({ getActor: mocks.actor }));
vi.mock('@/features/publications/server/photo-library', () => ({ readSharedLibrary: mocks.read, saveSharedGallery: mocks.save }));
vi.mock('@/server/observability/errors', () => ({ reportServerError: mocks.report }));
import { GET, PUT } from '@/app/api/home/moments/route';
import { defaultMoments } from '../fixtures/moments';
const request = (body: unknown) => new Request('http://localhost/api/home/moments', { method: 'PUT', headers: { 'Content-Type': 'application/json', Origin: 'http://localhost' }, body: JSON.stringify(body) });
beforeEach(() => {
  vi.clearAllMocks();
  mocks.actor.mockResolvedValue(null);
  mocks.read.mockResolvedValue({ home: { photos: [{ ...defaultMoments[0], visible: false }, defaultMoments[1]], version: 1 }, research: { photos: [] } });
});
describe('moments API', () => {
  it('omits hidden photos for public readers and prevents shared caching', async () => {
    const response = await GET();
    expect(await response.json()).toEqual({ photos: [defaultMoments[1]], version: 1, isAdmin: false });
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  });
  it('returns all photos to a verified admin', async () => {
    mocks.actor.mockResolvedValue({ role: 'ADMIN' });
    expect((await (await GET()).json()).photos).toHaveLength(2);
    expect(mocks.actor).toHaveBeenCalledWith(['ADMIN']);
  });
  it('rejects unauthorized writes before mutation', async () => {
    expect((await PUT(request({ version: 0, photos: [] }))).status).toBe(403);
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it('validates edits and rejects cross-origin writes', async () => {
    mocks.actor.mockResolvedValue({ role: 'ADMIN' });
    expect((await PUT(request({ version: -1, photos: [] }))).status).toBe(400);
    const foreign = request({ version: 0, photos: [] });
    foreign.headers.set('Origin', 'https://foreign.test');
    expect((await PUT(foreign)).status).toBe(403);
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it('reports conflicting edits without overwriting', async () => {
    mocks.actor.mockResolvedValue({ role: 'ADMIN' });
    mocks.save.mockResolvedValue({ success: false, code: 'CONFLICT', error: 'Conflict' });
    expect((await PUT(request({ version: 0, photos: [] }))).status).toBe(409);
  });
  it('persists valid edits and returns the new version', async () => {
    mocks.actor.mockResolvedValue({ role: 'ADMIN' });
    mocks.save.mockResolvedValue({ success: true, data: { version: 2, photos: [] } });
    const response = await PUT(request({ version: 1, photos: [] }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ version: 2, photos: [] });
  });
  it('uses the incoming Host header when Next constructs an internal request URL', async () => {
    mocks.actor.mockResolvedValue({ role: 'ADMIN' });
    mocks.save.mockResolvedValue({ success: true, data: { version: 1, photos: [] } });
    const input = request({ version: 0, photos: [] });
    input.headers.set('Host', '127.0.0.1:3456');
    input.headers.set('Origin', 'http://127.0.0.1:3456');
    expect((await PUT(input)).status).toBe(200);
  });
});
