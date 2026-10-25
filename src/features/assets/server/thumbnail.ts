import sharp from 'sharp';
import { readStoredAsset } from './delivery';

const cache = new Map<string, { bytes: Uint8Array; expires: number }>();
const inFlight = new Map<string, Promise<Uint8Array>>();
let cachedBytes = 0;
const maxCacheBytes = 32 * 1024 * 1024;

/** Call only after authorization. Cached bytes never skip the route permission check. */
export async function readThumbnail(url: string, width: number) {
  const key = `${url}:${width}`;
  const existing = cache.get(key);
  if (existing && existing.expires > Date.now()) return existing.bytes;
  if (existing) { cache.delete(key); cachedBytes -= existing.bytes.byteLength; }
  const pending = inFlight.get(key);
  if (pending) return pending;
  const work = (async () => {
    const original = await readStoredAsset(url);
    const bytes = new Uint8Array(await sharp(original, { limitInputPixels: 40_000_000 }).resize({ width, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer());
    while (cache.size && (cachedBytes + bytes.byteLength > maxCacheBytes || cache.size >= 128)) {
      const oldest = cache.keys().next().value!;
      cachedBytes -= cache.get(oldest)!.bytes.byteLength;
      cache.delete(oldest);
    }
    if (bytes.byteLength <= maxCacheBytes) { cache.set(key, { bytes, expires: Date.now() + 600_000 }); cachedBytes += bytes.byteLength; }
    return bytes;
  })();
  inFlight.set(key, work);
  try { return await work; } finally { inFlight.delete(key); }
}
