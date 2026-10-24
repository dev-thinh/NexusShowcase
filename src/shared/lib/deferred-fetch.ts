/** Independent reads, outside the App Router's Server Action queue. */
export async function fetchDeferredJson<T>(url: string, signal: AbortSignal, timeoutMs = 15_000): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort(signal.reason);
  if (signal.aborted) abort();
  else signal.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(() => controller.abort(new Error('Request timed out')), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, cache: 'no-store', credentials: 'same-origin' });
    if (!response.ok) throw new Error('Unable to load section');
    return await response.json() as T;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', abort);
  }
}
