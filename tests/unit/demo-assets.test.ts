import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { expect, it } from 'vitest';
import { createDemoAssets } from '../../prisma/demo-assets';

it('creates varied real local fixtures, preserves identical reruns, and rejects file collisions', async () => {
 const directory = await mkdtemp(path.join(os.tmpdir(), 'nexus-demo-assets-'));
 try {
   const assets = await createDemoAssets(directory);
   expect(assets.thumbnails).toHaveLength(16);
   expect(assets.avatars).toHaveLength(12);
   const shapes = new Set<string>();
   for (const asset of [...assets.thumbnails, ...assets.avatars, assets.document, assets.resource]) {
     const bytes = await readFile(path.join(directory, 'storage', asset.url.slice('/uploads/'.length)));
     expect(bytes.byteLength).toBe(asset.byteSize);
     if (asset.url.endsWith('.png')) {
       const metadata = await sharp(bytes).metadata();
       expect(metadata.format).toBe('png');
       if (assets.thumbnails.includes(asset)) shapes.add(`${metadata.width}/${metadata.height}`);
     }
   }
   expect(shapes.size).toBeGreaterThanOrEqual(3);
   const pdf = await readFile(path.join(directory, 'storage/documents/demo-full-guide.pdf'), 'ascii');
   expect(pdf).toMatch(/^%PDF-1.4/);
   const start = Number(pdf.match(/startxref\n(\d+)/)![1]);
   expect(pdf.slice(start, start + 4)).toBe('xref');
   expect(await createDemoAssets(directory)).toEqual(assets);
   const collision = path.join(directory, 'storage/thumbnails/demo-full-01.png');
   await writeFile(collision, 'existing-user-data');
   await expect(createDemoAssets(directory)).rejects.toThrow('Existing demo asset differs');
   expect(await readFile(collision, 'utf8')).toBe('existing-user-data');
 } finally { await rm(directory, { recursive: true, force: true }); }
}, 30_000);
