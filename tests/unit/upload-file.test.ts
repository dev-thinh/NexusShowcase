import { afterEach, expect, it, vi } from 'vitest';
import { uploadFile } from '@/shared/lib/upload-file';

afterEach(() => vi.unstubAllGlobals());
it('uses independent HTTP uploads so one slow request does not serialize the next', async () => {
  let finish!: (response: Response) => void;
  const fetch = vi.fn().mockImplementationOnce(() => new Promise<Response>(resolve => { finish = resolve; }))
    .mockResolvedValueOnce(Response.json({ url: '/uploads/thumbnails/second.png' }));
  vi.stubGlobal('fetch', fetch);
  const first = uploadFile(new FormData());
  const second = await uploadFile(new FormData());
  expect(second).toMatchObject({ success: true, data: { url: '/uploads/thumbnails/second.png' } });
  finish(Response.json({ url: '/uploads/thumbnails/first.png' }));
  expect(await first).toMatchObject({ success: true });
});
it('preserves actionable rate-limit errors', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: 'Upload quota exceeded' }, { status: 429 })));
  expect(await uploadFile(new FormData())).toEqual({ success: false, code: 'RATE_LIMITED', error: 'Upload quota exceeded' });
});
it.each([Response.json({}), new Response('Gateway error', { status: 502 })])('reports malformed upload responses as a retryable failure', async response => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
  expect(await uploadFile(new FormData())).toMatchObject({ success: false, code: 'INTERNAL' });
});
it('turns a rejected upload into an error the file picker can display', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network unavailable')));
  expect(await uploadFile(new FormData())).toMatchObject({ success: false, code: 'INTERNAL' });
});
