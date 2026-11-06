import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ session: vi.fn(), list: vi.fn(), report: vi.fn() }));
vi.mock('@/features/identity/server/session', () => ({ getSession: mocks.session }));
vi.mock('@/features/members/server/queries', () => ({ listDirectory: mocks.list }));
vi.mock('@/server/observability/errors', () => ({ reportServerError: mocks.report }));
import { GET } from '@/app/api/members/route';
beforeEach(() => { vi.resetAllMocks(); mocks.session.mockResolvedValue(null); mocks.list.mockResolvedValue({ items: [], page: 1, pageSize: 12, total: 0, totalPages: 1 }); });
it('bounds pages and derives visibility from the server session', async () => {
  const response = await GET(new Request('http://localhost/api/members?role=MEMBER&page=2'));
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toBe('private, no-store');
  expect(mocks.list).toHaveBeenCalledWith({ role: 'MEMBER', page: 2, pageSize: 12, authenticated: false });
  mocks.session.mockResolvedValue({ user: { id: 'user' } });
  await GET(new Request('http://localhost/api/members?role=ADMIN'));
  expect(mocks.list).toHaveBeenLastCalledWith({ role: 'ADMIN', page: 1, pageSize: 12, authenticated: true });
});
it.each(['role=INVALID', 'role=MEMBER&page=0', 'role=MEMBER&pageSize=all', 'role=MEMBER&authenticated=true'])('rejects invalid or unbounded input: %s', async query => {
  expect((await GET(new Request(`http://localhost/api/members?${query}`))).status).toBe(400);
  expect(mocks.list).not.toHaveBeenCalled();
});
it('reports errors without exposing server details', async () => {
  mocks.list.mockRejectedValue(new Error('secret database details'));
  const response = await GET(new Request('http://localhost/api/members?role=MEMBER'));
  expect(response.status).toBe(500);
  expect(await response.text()).not.toContain('secret');
  expect(mocks.report).toHaveBeenCalled();
});
