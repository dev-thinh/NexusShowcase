import sharp from 'sharp';
import { readStoredAsset } from './delivery';

const originals = new Map<string, { bytes: Uint8Array; expires: number }>();
const originalRequests = new Map<string, Promise<Uint8Array>>();
let originalBytes = 0;
const maxOriginalBytes = 64 * 1024 * 1024;
const maxOriginalEntries = 128;
const originalTtlMs = 15 * 60_000;

function evictExpiredOriginals(now: number) {
  for (const [key, entry] of originals) {
    if (entry.expires <= now) {
      originals.delete(key);
      originalBytes -= entry.bytes.byteLength;
    }
  }
}

export function warmOriginalAsset(url: string, bytes: Uint8Array) {
  const now = Date.now();
  evictExpiredOriginals(now);
  const existing = originals.get(url);
  if (existing) {
    originals.delete(url);
    originalBytes -= existing.bytes.byteLength;
  }
  if (bytes.byteLength > maxOriginalBytes) return;
  while (originals.size && (originalBytes + bytes.byteLength > maxOriginalBytes || originals.size >= maxOriginalEntries)) {
    const oldest = originals.keys().next().value!;
    originalBytes -= originals.get(oldest)!.bytes.byteLength;
    originals.delete(oldest);
  }
  originals.set(url, { bytes, expires: now + originalTtlMs });
  originalBytes += bytes.byteLength;
}

async function readOriginal(url: string) {
  const now = Date.now();
  evictExpiredOriginals(now);
  const cached = originals.get(url);
  if (cached) {
    originals.delete(url);
    cached.expires = now + originalTtlMs;
    originals.set(url, cached);
    return cached.bytes;
  }
  const pending = originalRequests.get(url);
  if (pending) return pending;
  const request = readStoredAsset(url).then(bytes => {
    warmOriginalAsset(url, bytes);
    return bytes;
  });
  originalRequests.set(url, request);
  try { return await request; } finally { originalRequests.delete(url); }
}

const cache = new Map<string, { bytes: Uint8Array; expires: number }>();
const inFlight = new Map<string, Promise<Uint8Array>>();
let cachedBytes = 0;
const maxCacheBytes = 128 * 1024 * 1024;
const maxCacheEntries = 2048;
const cacheTtlMs = 6 * 60 * 60_000;

/** Call only after authorization. Cached bytes never skip the route permission check. */
export async function readThumbnail(url: string, width: number) {
  const key = `${url}:${width}`;
  const now = Date.now();
  const existing = cache.get(key);
  if (existing && existing.expires > now) {
    cache.delete(key);
    existing.expires = now + cacheTtlMs;
    cache.set(key, existing);
    return existing.bytes;
  }
  if (existing) { cache.delete(key); cachedBytes -= existing.bytes.byteLength; }
  const pending = inFlight.get(key);
  if (pending) return pending;
  const work = (async () => {
    const original = await readOriginal(url);
    const bytes = new Uint8Array(await sharp(original, { limitInputPixels: 40_000_000 }).resize({ width, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer());
    for (const [entryKey, entry] of cache) {
      if (entry.expires <= Date.now()) {
        cache.delete(entryKey);
        cachedBytes -= entry.bytes.byteLength;
      }
    }
    while (cache.size && (cachedBytes + bytes.byteLength > maxCacheBytes || cache.size >= maxCacheEntries)) {
      const oldest = cache.keys().next().value!;
      cachedBytes -= cache.get(oldest)!.bytes.byteLength;
      cache.delete(oldest);
    }
    if (bytes.byteLength <= maxCacheBytes) { cache.set(key, { bytes, expires: Date.now() + cacheTtlMs }); cachedBytes += bytes.byteLength; }
    return bytes;
  })();
  inFlight.set(key, work);
  try { return await work; } finally { inFlight.delete(key); }
}
