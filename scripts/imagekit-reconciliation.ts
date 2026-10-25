import { createHash } from 'node:crypto';
import { setTimeout as pause } from 'node:timers/promises';
import { imageKitObject, signedImageKitUrl, type ImageKitConfig } from '../src/features/assets/server/imagekit';

export type ReconciliationMetadata = { fileId: string; filePath: string; createdAt: string; isPrivateFile: boolean };
export function validateReconciliationMetadata(value: unknown, url: string, config: ImageKitConfig): ReconciliationMetadata {
  const entry = value as Partial<ReconciliationMetadata> | null;
  if (!entry || typeof entry.fileId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(entry.fileId) || entry.filePath !== imageKitObject(url, config).filePath || typeof entry.createdAt !== 'string' || !Number.isFinite(Date.parse(entry.createdAt)) || typeof entry.isPrivateFile !== 'boolean') throw new Error('Unverified provider metadata; reconciliation refused');
  return entry as ReconciliationMetadata;
}
export const imageKitAuthorization = (config: ImageKitConfig) => ({ Authorization: `Basic ${Buffer.from(`${config.privateKey}:`).toString('base64')}` });
export async function readReconciliationMetadata(fileId: string, url: string, config: ImageKitConfig, request = fetch) {
  if (!/^[a-zA-Z0-9_-]+$/.test(fileId)) throw new Error('Invalid provider identity');
  const response = await request(`https://api.imagekit.io/v1/files/${encodeURIComponent(fileId)}/details`, { headers: imageKitAuthorization(config), signal: AbortSignal.timeout(30_000), redirect: 'error' });
  if (!response.ok) throw new Error('Provider metadata read failed');
  const result = validateReconciliationMetadata(await response.json(), url, config);
  if (result.fileId !== fileId) throw new Error('Provider identity changed');
  return result;
}

async function purgeExactOriginalUrls(urls: string[], config: ImageKitConfig, request: typeof fetch) {
  const deadline = Date.now() + 30_000;
  const boundedSignal = () => {
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new Error('Exact cache purge timed out; registry privacy not confirmed');
    return AbortSignal.timeout(Math.max(1, Math.min(10_000, remaining)));
  };
  const requests: string[] = [];
  for (const url of urls) {
    if (url.includes('*')) throw new Error('Wildcard cache purge refused');
    const response = await request('https://api.imagekit.io/v1/files/purge', { method: 'POST', headers: { ...imageKitAuthorization(config), 'Content-Type': 'application/json' }, body: JSON.stringify({ url }), redirect: 'error', signal: boundedSignal() });
    if (!response.ok) throw new Error(`Exact cache purge submission failed (${response.status})`);
    const result = await response.json() as { requestId?: unknown };
    if (typeof result.requestId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(result.requestId)) throw new Error('Invalid exact cache purge request identity');
    requests.push(result.requestId);
  }
  for (const requestId of requests) {
    for (;;) {
      const response = await request(`https://api.imagekit.io/v1/files/purge/${encodeURIComponent(requestId)}`, { headers: imageKitAuthorization(config), redirect: 'error', signal: boundedSignal() });
      if (!response.ok) throw new Error('Exact cache purge status read failed');
      const result = await response.json() as { status?: unknown };
      if (result.status === 'Completed') break;
      if (result.status !== 'Pending') throw new Error('Unexpected exact cache purge status');
      const remaining = deadline - Date.now();
      if (remaining <= 0) throw new Error('Exact cache purge timed out; registry privacy not confirmed');
      await pause(Math.min(1000, remaining));
    }
  }
}

/** Preserve bytes. Optional purge is limited to this object's two exact original URLs. */
export async function reconcileImageKitObject(url: string, expected: ReconciliationMetadata, config: ImageKitConfig, request = fetch, options: { purgeCache?: boolean } = {}) {
  const object = imageKitObject(url, config);
  const current = await readReconciliationMetadata(expected.fileId, url, config, request);
  if (current.createdAt !== expected.createdAt || current.isPrivateFile !== expected.isPrivateFile) throw new Error('Provider metadata changed since inventory');
  async function readOriginal() {
    const response = await request(signedImageKitUrl(url, config), { cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(90_000) });
    if (!response.ok) throw new Error('Signed original read failed');
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (!bytes.length || bytes.length > 100 * 1024 * 1024) throw new Error('Unexpected original size');
    return bytes;
  }
  const before = await readOriginal();
  const digest = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
  let fileId = current.fileId;
  if (!current.isPrivateFile) {
    const form = new FormData();
    form.set('file', new Blob([new Uint8Array(before)]), object.fileName);
    form.set('fileName', object.fileName);
    form.set('folder', object.folder);
    form.set('useUniqueFileName', 'false');
    form.set('overwriteFile', 'true');
    form.set('isPrivateFile', 'true');
    form.set('overwriteTags', 'false');
    form.set('overwriteAITags', 'false');
    form.set('overwriteCustomMetadata', 'false');
    const response = await request('https://upload.imagekit.io/api/v1/files/upload', { method: 'POST', headers: imageKitAuthorization(config), body: form, redirect: 'error', signal: AbortSignal.timeout(90_000) });
    if (!response.ok) throw new Error('Privacy reupload failed');
    const result = await response.json() as { fileId?: string; filePath?: string; url?: string };
    if (!result.fileId || !/^[a-zA-Z0-9_-]+$/.test(result.fileId) || result.filePath !== object.filePath || result.url !== `${config.endpoint}${object.filePath}`) throw new Error('Privacy reupload identity/path mismatch');
    fileId = result.fileId;
  }
  const verified = await readReconciliationMetadata(fileId, url, config, request);
  if (!verified.isPrivateFile) throw new Error('Provider did not confirm private origin');
  if (digest(before) !== digest(await readOriginal())) throw new Error('Original bytes changed; reconciliation requires manual recovery');
  const unsignedUrls = [`${config.endpoint}${object.filePath}`, object.url];
  async function denied() {
    let allDenied = true;
    for (const unsigned of unsignedUrls) {
      const response = await request(unsigned, { method: 'GET', cache: 'no-store', redirect: 'manual', signal: AbortSignal.timeout(30_000) });
      await response.body?.cancel();
      if (response.status !== 401 && response.status !== 403) allDenied = false;
    }
    return allDenied;
  }
  if (!(await denied())) {
    if (options.purgeCache) await purgeExactOriginalUrls(unsignedUrls, config, request);
    if (!options.purgeCache || !(await denied())) throw new Error('Unsigned origin access remains possible; registry privacy not confirmed');
  }
  return { fileId, createdAt: new Date(current.createdAt), sha256: digest(before), private: true as const };
}
