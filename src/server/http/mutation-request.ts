/** Route handlers do not inherit Server Actions' Origin/Host CSRF check. */
export function isSameOriginMutation(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin || request.headers.get('sec-fetch-site') === 'cross-site') return false;
  try {
    const source = new URL(origin);
    if (!['http:', 'https:'].includes(source.protocol) || source.origin !== origin) return false;
    const configured = process.env.AUTH_URL || process.env.NEXTAUTH_URL;
    const target = new URL(configured || request.url);
    // Pin the public origin when configured. Without it, Next may use an
    // internal hostname in request.url; retain the incoming port/hostname.
    if (!configured) target.host = request.headers.get('host') || target.host;
    return source.origin === target.origin;
  } catch { return false; }
}

export class InvalidMutationRequest extends Error {
  constructor(readonly status: 400 | 413 | 415) {
    super('Invalid mutation request');
  }
}

/** Enforce the byte limit as data arrives, including chunked requests. */
export async function readMutationJson(request: Request, maximumBytes: number): Promise<unknown> {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') ?? '')) throw new InvalidMutationRequest(415);
  if (Number(request.headers.get('content-length')) > maximumBytes) {
    await request.body?.cancel();
    throw new InvalidMutationRequest(413);
  }
  if (!request.body) throw new InvalidMutationRequest(400);
  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let bytes = 0, body = '';
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > maximumBytes) {
        await reader.cancel();
        throw new InvalidMutationRequest(413);
      }
      body += decoder.decode(chunk.value, { stream: true });
    }
    return JSON.parse(body + decoder.decode());
  } catch (error) {
    if (error instanceof InvalidMutationRequest) throw error;
    throw new InvalidMutationRequest(400);
  } finally { reader.releaseLock(); }
}
