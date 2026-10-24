import { afterEach, expect, it, vi } from 'vitest';
import { fetchDeferredJson } from '@/shared/lib/deferred-fetch';

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

it('starts independent reads without waiting for another response', async () => {
  let release!: (value: Response) => void;
  const fetch = vi.fn().mockImplementationOnce(() => new Promise<Response>(resolve => { release = resolve; }))
    .mockResolvedValueOnce(Response.json({ name: 'members' }));
  vi.stubGlobal('fetch', fetch);
  const first = fetchDeferredJson('/featured', new AbortController().signal);
  await expect(fetchDeferredJson('/members', new AbortController().signal)).resolves.toEqual({ name: 'members' });
  expect(fetch).toHaveBeenCalledTimes(2);
  release(Response.json({ name: 'featured' }));
  await first;
});

it('aborts a stalled read at its deadline', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('fetch', vi.fn((_url, { signal }: RequestInit) => new Promise((_resolve, reject) => {
    signal!.addEventListener('abort', () => reject(signal!.reason));
  })));
  const result = fetchDeferredJson('/featured', new AbortController().signal, 100);
  const rejected = expect(result).rejects.toBeDefined();
  await vi.advanceTimersByTimeAsync(100);
  await rejected;
});

it('cancels transport when the section unmounts and rejects HTTP errors', async () => {
  const controller = new AbortController();
  let transport!: AbortSignal;
  vi.stubGlobal('fetch', vi.fn((_url, { signal }: RequestInit) => {
    transport = signal!;
    return new Promise((_resolve, reject) => signal!.addEventListener('abort', () => reject(signal!.reason)));
  }));
  const result = fetchDeferredJson('/members', controller.signal);
  const rejected = expect(result).rejects.toBeDefined();
  controller.abort();
  await rejected;
  expect(transport.aborted).toBe(true);
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })));
  await expect(fetchDeferredJson('/members', new AbortController().signal)).rejects.toThrow();
});
