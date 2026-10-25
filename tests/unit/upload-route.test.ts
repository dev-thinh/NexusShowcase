import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({ actor: vi.fn(), upload: vi.fn(), rate: vi.fn() }));
vi.mock('@/features/identity/server/actor', () => ({ getActor: mocks.actor }));
vi.mock('@/features/assets/server/actions', () => ({ uploadFileAction: mocks.upload }));
vi.mock('@/features/identity/server/rate-limit', () => ({ consumeRateLimit: mocks.rate }));
import { POST } from '@/app/api/upload/route';
beforeEach(() => { vi.clearAllMocks(); mocks.rate.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 }); mocks.actor.mockResolvedValue({ id: 'admin', role: 'ADMIN' }); mocks.upload.mockResolvedValue({ success: true, data: { url: '/uploads/resources/file.txt' } }); });

it('rejects excessive uploads before parsing and provides Retry-After', async () => {
  mocks.rate.mockResolvedValue({ allowed: false, retryAfterSeconds: 30 });
  const parse = vi.fn();
  const response = await POST({ formData: parse } as never);
  expect(response.status).toBe(429);
  expect(response.headers.get('Retry-After')).toBe('30');
  expect(parse).not.toHaveBeenCalled();
});

it('rejects anonymous requests before reading multipart data', async () => {
  mocks.actor.mockResolvedValue(null);
  const parse = vi.fn(async () => new FormData());
  const response = await POST({ formData: parse } as never);
  expect(response.status).toBe(403);
  expect(parse).not.toHaveBeenCalled();
  expect(mocks.upload).not.toHaveBeenCalled();
});

it('rejects an oversized declared body before parsing', async () => {
  const request = new NextRequest('http://localhost/api/upload', { method: 'POST', headers: { Origin: 'http://localhost', 'Content-Length': String(27 * 1024 * 1024) } });
  expect((await POST(request)).status).toBe(413);
  expect(mocks.upload).not.toHaveBeenCalled();
});

it('enforces the body limit even when Content-Length is absent', async () => {
  const cancel = vi.fn();
  const body = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(27 * 1024 * 1024)); }, cancel });
  const request = new NextRequest('http://localhost/api/upload', { method: 'POST', body, headers: { Origin: 'http://localhost', 'Content-Type': 'multipart/form-data; boundary=test' } });
  expect((await POST(request)).status).toBe(413);
  expect(mocks.upload).not.toHaveBeenCalled();
  await vi.waitFor(() => expect(cancel).toHaveBeenCalled());
});

it('accepts valid authenticated multipart uploads through the existing validation action', async () => {
  const data = new FormData(); data.set('type', 'resource'); data.set('file', new File(['file'], 'file.txt'));
  const request = new NextRequest('http://localhost/api/upload', { method: 'POST', body: data, headers: { Origin: 'http://localhost' } });
  const response = await POST(request);
  expect(response.status).toBe(200);
  expect(mocks.upload).toHaveBeenCalledOnce();
  expect(mocks.upload.mock.calls[0][0].get('file').size).toBe(4);
});
