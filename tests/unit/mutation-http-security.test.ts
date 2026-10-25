import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ actor: vi.fn(), read: vi.fn(), save: vi.fn(), upload: vi.fn(), rate: vi.fn() }));
vi.mock('@/features/identity/server/actor', () => ({ getActor: mocks.actor }));
vi.mock('@/features/identity/server/rate-limit', () => ({ consumeRateLimit: mocks.rate }));
vi.mock('@/features/publications/server/photo-library', () => ({ readSharedLibrary: mocks.read, saveSharedGallery: mocks.save }));
vi.mock('@/features/assets/server/actions', () => ({ uploadFileAction: mocks.upload }));
vi.mock('@/server/observability/errors', () => ({ reportServerError: vi.fn() }));
import { PUT as moments } from '@/app/api/home/moments/route';
import { PUT as research } from '@/app/api/home/research/route';
import { POST as upload } from '@/app/api/upload/route';

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('AUTH_URL', '');
  vi.stubEnv('NEXTAUTH_URL', '');
  mocks.actor.mockResolvedValue({ id: 'admin', role: 'ADMIN' });
  mocks.rate.mockResolvedValue({ allowed: true });
  mocks.save.mockResolvedValue({ success: true, data: { version: 1, photos: [] } });
  mocks.upload.mockResolvedValue({ success: true, data: { url: '/uploads/resources/test.pdf' } });
});
afterEach(() => vi.unstubAllEnvs());

describe.each([['moments', moments], ['research', research]] as const)('%s mutation boundary', (_name, handler) => {
  const make = (headers: Record<string, string> = {}) => new Request('https://nexus.test/api/home/photos', {
    method: 'PUT', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ version: 0, photos: [] }),
  });
  it.each([undefined, 'null', 'https://attacker.test', 'http://nexus.test'])('rejects an untrusted origin %s before reading or saving', async origin => {
    const request = make(origin === undefined ? {} : { Origin: origin });
    const read = vi.spyOn(request, 'text');
    expect((await handler(request)).status).toBe(403);
    expect(read).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it('pins the configured origin rather than trusting a forged Host', async () => {
    vi.stubEnv('AUTH_URL', 'https://nexus.test');
    expect((await handler(make({ Host: 'attacker.test', Origin: 'https://attacker.test' }))).status).toBe(403);
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it('requires JSON even for a same-origin authenticated request', async () => {
    expect((await handler(make({ Origin: 'https://nexus.test', 'Content-Type': 'text/plain' }))).status).toBe(415);
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it('cancels an oversized chunked request before buffering the rest', async () => {
    const cancel = vi.fn();
    const body = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(new Uint8Array(65_000)); }, cancel });
    const request = new Request('https://nexus.test/api/home/photos', { method: 'PUT', headers: { Origin: 'https://nexus.test', 'Content-Type': 'application/json' }, body, duplex: 'half' } as RequestInit);
    // The previous implementation reads to the end before enforcing its limit.
    // Closing would hide that bug; fail promptly if the reader asks for more data.
    const text = vi.spyOn(request, 'text').mockRejectedValue(new Error('Unbounded body read'));
    expect((await handler(request)).status).toBe(413);
    expect(text).not.toHaveBeenCalled();
    expect(cancel).toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
  });
});

it.each([undefined, 'null', 'https://attacker.test', 'http://nexus.test'])('upload rejects missing or foreign origin %s before writing', async origin => {
  const data = new FormData(); data.set('file', new File(['data'], 'test.pdf')); data.set('type', 'resource');
  const request = new NextRequest('https://nexus.test/api/upload', { method: 'POST', headers: origin === undefined ? {} : { Origin: origin }, body: data });
  expect((await upload(request)).status).toBe(403);
  expect(mocks.upload).not.toHaveBeenCalled();
});
