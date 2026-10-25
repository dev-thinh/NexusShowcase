import { expect, it } from 'vitest';
import { reconcileImageKitObject, validateReconciliationMetadata } from '../../scripts/imagekit-reconciliation';

const config = { privateKey: 'private_test', endpoint: 'https://ik.imagekit.io/test', folder: 'project' };
it('accepts only exact project paths with provider identity, creation date and privacy metadata', () => {
  expect(validateReconciliationMetadata({ fileId: 'known', filePath: '/project/uploads/thumbnails/a.png', createdAt: '2026-10-01T00:00:00Z', isPrivateFile: false }, '/uploads/thumbnails/a.png', config).fileId).toBe('known');
  for (const patch of [{ filePath: '/other/uploads/thumbnails/a.png' }, { fileId: '' }, { createdAt: 'invalid' }, { isPrivateFile: undefined }]) {
    expect(() => validateReconciliationMetadata({ fileId: 'known', filePath: '/project/uploads/thumbnails/a.png', createdAt: '2026-10-01', isPrivateFile: false, ...patch }, '/uploads/thumbnails/a.png', config)).toThrow();
  }
});

it('verifies identical bytes and origin denial before returning verified privacy', async () => {
  const metadata = { fileId: 'known', filePath: '/project/uploads/thumbnails/a.png', createdAt: '2026-10-01T00:00:00Z', isPrivateFile: false };
  const request = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = String(input);
    if (url.includes('/details')) return Response.json({ ...metadata, isPrivateFile: uploaded });
    if (url.includes('upload.imagekit.io')) {
      const form = init?.body as FormData;
      expect(form.get('overwriteFile')).toBe('true');
      expect(form.get('isPrivateFile')).toBe('true');
      expect(await (form.get('file') as Blob).text()).toBe('original-bytes');
      uploaded = true;
      return Response.json({ fileId: 'known', filePath: metadata.filePath, url: config.endpoint + metadata.filePath });
    }
    if (url.includes('ik-s=')) return new Response('original-bytes');
    return new Response(null, { status: 403 });
  };
  let uploaded = false;
  const result = await reconcileImageKitObject('/uploads/thumbnails/a.png', metadata, config, request as typeof fetch);
  expect(result).toMatchObject({ fileId: 'known', private: true });
  expect(result.sha256).toBe('8e338be649868e7c9e053212037e4bb0965ba7653e81b974bab76578bd59c80a');
});

it('refuses verified privacy if unsigned CDN bytes remain available', async () => {
  const metadata = { fileId: 'known', filePath: '/project/uploads/thumbnails/a.png', createdAt: '2026-10-01T00:00:00Z', isPrivateFile: true };
  const request = async (input: string | URL | Request) => String(input).includes('/details') ? Response.json(metadata) : new Response('still-readable');
  await expect(reconcileImageKitObject('/uploads/thumbnails/a.png', metadata, config, request as typeof fetch)).rejects.toThrow('Unsigned origin access');
});

it('refuses privacy confirmation when signed original bytes change', async () => {
  const metadata = { fileId: 'known', filePath: '/project/uploads/thumbnails/a.png', createdAt: '2026-10-01T00:00:00Z', isPrivateFile: true };
  let reads = 0;
  const request = async (input: string | URL | Request) => String(input).includes('/details') ? Response.json(metadata) : new Response(++reads === 1 ? 'before' : 'after');
  await expect(reconcileImageKitObject('/uploads/thumbnails/a.png', metadata, config, request as typeof fetch)).rejects.toThrow('Original bytes changed');
});

it('purges only the two exact unsigned URLs when explicitly requested and confirms denial', async () => {
  const metadata = { fileId: 'known', filePath: '/project/uploads/thumbnails/a.png', createdAt: '2026-10-01T00:00:00Z', isPrivateFile: true };
  const purged: string[] = [];
  let completed = 0;
  const request = async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    if (url.includes('/details')) return Response.json(metadata);
    if (url === 'https://api.imagekit.io/v1/files/purge') {
      expect(init?.method).toBe('POST');
      purged.push(JSON.parse(init!.body as string).url);
      return Response.json({ requestId: `request-${purged.length}` });
    }
    if (url.startsWith('https://api.imagekit.io/v1/files/purge/request-')) { completed++; return Response.json({ status: 'Completed' }); }
    if (url.includes('ik-s=')) return new Response('unchanged');
    return completed === 2 ? new Response(null, { status: 403 }) : new Response('cached');
  };
  expect(await reconcileImageKitObject('/uploads/thumbnails/a.png', metadata, config, request as typeof fetch, { purgeCache: true })).toMatchObject({ private: true });
  expect(purged).toEqual(['https://ik.imagekit.io/test/project/uploads/thumbnails/a.png', 'https://ik.imagekit.io/test/project/uploads/thumbnails/a.png?tr=orig-true']);
});
