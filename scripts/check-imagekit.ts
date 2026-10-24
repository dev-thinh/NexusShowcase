import { loadEnvConfig } from '@next/env';
import { randomUUID, createHash } from 'node:crypto';
import { getImageKitConfig, uploadImageKitAsset, deleteImageKitProbe } from '../src/features/assets/server/imagekit';
import { readStoredAsset } from '../src/features/assets/server/delivery';

async function main() {
  loadEnvConfig(process.cwd());
  const config = getImageKitConfig(true)!;
  process.env.ASSET_STORAGE = 'imagekit';
  const probes = [
    { path: `/uploads/thumbnails/imagekit-check-${randomUUID()}.png`, bytes: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEklEQVQImWMQqdgiUrGFAUIBACCOBQFdf8G7AAAAAElFTkSuQmCC', 'base64') },
    { path: `/uploads/resources/imagekit-check-${randomUUID()}.txt`, bytes: Buffer.from('NexusShowcase ImageKit connectivity probe\n') },
  ];
  const digest = (value: Uint8Array) => createHash('sha256').update(value).digest('hex');
  for (const probe of probes) {
    const uploaded = await uploadImageKitAsset(probe.path, probe.bytes, config);
    try {
      const delivered = await readStoredAsset(probe.path);
      if (digest(delivered) !== digest(probe.bytes)) throw new Error('ImageKit original-byte verification failed');
    } finally { await deleteImageKitProbe(uploaded.fileId, config); }
  }
  console.log('ImageKit image/resource uploads and original-byte delivery verified. Temporary probe files deleted.');
}

main().catch(error => {
  console.error(error instanceof Error && /^ImageKit (configuration|upload failed|probe cleanup failed|original-byte)/.test(error.message) ? error.message : 'ImageKit connection check failed; no credentials were printed.');
  process.exitCode = 1;
});
