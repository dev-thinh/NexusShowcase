import { POST } from '@/app/api/review/route';
import { decideSubmissionAction } from '@/features/review/server/actions';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ command: vi.fn(), invalidate: vi.fn(), actor: vi.fn() }));
vi.mock('@/features/identity/server/actor', () => ({ getActor: mocks.actor }));
vi.mock('@/features/review/server/decision-command', () => ({ decideSubmissionCommand: mocks.command }));
vi.mock('@/features/publications/server/invalidation', () => ({ invalidatePublicationChange: mocks.invalidate }));
const input = { itemId: 'cjr012345678901234567890', reviewVersion: 1, action: 'PUBLISH' as const };
const request = (body: unknown = input, headers: Record<string, string> = {}) => new Request('https://nexus.test/api/review', { method: 'POST', headers: { origin: 'https://nexus.test', 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('AUTH_URL', 'https://nexus.test');
  mocks.actor.mockResolvedValue({ id: 'admin', role: 'ADMIN' });
  mocks.command.mockResolvedValue({ success: true, data: { slug: 'paper', memberIds: [] } });
});
afterEach(() => vi.unstubAllEnvs());
it('commits and invalidates before finishing the JSON mutation response', async () => {
  const response = await POST(request());
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ success: true });
  expect(mocks.command.mock.invocationCallOrder[0]).toBeLessThan(mocks.invalidate.mock.invocationCallOrder[0]);
  expect(response.headers.get('cache-control')).toBe('no-store');
});
it('keeps a rejected decision without invalidation', async () => {
  mocks.command.mockResolvedValue({ success: false, code: 'CONFLICT', error: 'Changed' });
  const response = await POST(request());
  expect(response.status).toBe(409);
  expect(await response.json()).toMatchObject({ success: false, code: 'CONFLICT' });
  expect(mocks.invalidate).not.toHaveBeenCalled();
});
it.each(['https://attacker.test', ''])('rejects cross-origin or missing-origin POST %s before mutation', async origin => {
  expect((await POST(request(input, { origin }))).status).toBe(403);
  expect(mocks.command).not.toHaveBeenCalled();
});
it('requires JSON and bounds the actual streamed body before parsing', async () => {
  expect((await POST(request(input, { 'content-type': 'text/plain' }))).status).toBe(415);
  expect((await POST(request({ ...input, reason: 'x'.repeat(20_000) }))).status).toBe(413);
  expect(mocks.command).not.toHaveBeenCalled();
});
it('rejects unknown actor/version fields through the existing strict decision boundary', async () => {
  expect((await POST(request({ ...input, actorId: 'attacker' }))).status).toBe(400);
  expect((await POST(request({ ...input, reviewVersion: '1oops' }))).status).toBe(400);
  expect(mocks.command).not.toHaveBeenCalled();
});
it('requires the current administrator for the HTTP adapter and server action', async () => {
  mocks.actor.mockResolvedValue(null);
  expect((await POST(request())).status).toBe(401);
  expect(await decideSubmissionAction(input)).toMatchObject({ success: false, code: 'UNAUTHORIZED' });
  expect(mocks.command).not.toHaveBeenCalled();
});
