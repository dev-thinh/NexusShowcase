import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ session: vi.fn(), publications: vi.fn(), members: vi.fn(), report: vi.fn() }));
vi.mock('@/features/identity/server/session', () => ({ getSession: mocks.session }));
vi.mock('@/features/publications/server/queries', () => ({ getHomePublications: mocks.publications }));
vi.mock('@/features/members/server/queries', () => ({ getHomeMembers: mocks.members }));
vi.mock('@/server/observability/errors', () => ({ reportServerError: mocks.report }));
import { GET } from '@/app/api/home/route';
beforeEach(() => {
  vi.clearAllMocks();
  mocks.session.mockResolvedValue(null);
  mocks.publications.mockResolvedValue([]);
  mocks.members.mockResolvedValue({ members: [], total: 0 });
});

it('rejects invalid section names before touching session or database', async () => {
  expect((await GET(new Request('http://localhost/api/home?section=other'))).status).toBe(400);
  expect(mocks.session).not.toHaveBeenCalled();
  expect(mocks.publications).not.toHaveBeenCalled();
});

it.each([null, { user: { role: 'MEMBER' } }, { user: { role: 'ADMIN' } }])('derives visibility from the session and prevents shared caching (%j)', async session => {
  mocks.session.mockResolvedValue(session);
  const response = await GET(new Request('http://localhost/api/home?section=featured&authenticated=true'));
  expect(mocks.publications).toHaveBeenCalledWith(!!session?.user);
  expect(mocks.members).not.toHaveBeenCalled();
  expect(response.headers.get('cache-control')).toBe('private, no-store');
  expect(await response.json()).toEqual({ items: [], isAdmin: session?.user?.role === 'ADMIN' });
});

it('reports failures without returning upstream error details', async () => {
  mocks.members.mockRejectedValue(new Error('sensitive upstream details'));
  const response = await GET(new Request('http://localhost/api/home?section=members'));
  expect(response.status).toBe(500);
  expect(await response.text()).not.toContain('sensitive');
  expect(mocks.report).toHaveBeenCalledWith('home.read', expect.any(Error));
});

it('returns the sampled members and full count without caching the selection', async () => {
  mocks.members.mockResolvedValue({ members: [{ id: 'one', fullName: 'An', role: 'ADMIN', avatarUrl: null }], total: 50 });
  const response = await GET(new Request('http://localhost/api/home?section=members'));
  expect(response.headers.get('cache-control')).toBe('private, no-store');
  expect(await response.json()).toEqual({ members: [{ id: 'one', fullName: 'An', role: 'ADMIN', avatarUrl: null }], total: 50 });
});
