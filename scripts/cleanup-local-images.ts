import { loadEnvConfig } from '@next/env';
import { Prisma, PrismaClient } from '@prisma/client';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { clearLocalImageReferences, imageDigest, inventoryLocalImages } from './local-image-cleanup';

const changed = (a: unknown, b: unknown) => JSON.stringify(a) !== JSON.stringify(b);
const json = (value: unknown) => value === null ? Prisma.JsonNull : value as Prisma.InputJsonValue;
async function main() {
  loadEnvConfig(process.cwd());
  const args = process.argv.slice(2);
  if (args.some(arg => !['--apply', '--dry-run'].includes(arg)) || args.includes('--apply') && args.includes('--dry-run')) throw new Error('Invalid cleanup arguments');
  const root = path.resolve(process.cwd());
  const images = await inventoryLocalImages(root);
  const targets = new Set(images.map(image => image.url));
  const clean = <T>(value: T): T => clearLocalImageReferences(value, targets) as T;
  const database = new PrismaClient({ log: [] });
  try {
    const [users, items, revisions, drafts, galleries, attachments, links] = await Promise.all([
      database.user.findMany({ select: { id: true, avatarUrl: true } }),
      database.showcaseItem.findMany({ select: { id: true, updatedAt: true, reviewVersion: true, thumbnailUrl: true, content: true, authorDraft: true, mediaDriveUrl: true } }),
      database.submissionRevision.findMany({ select: { id: true, snapshot: true } }),
      database.editorialDraft.findMany({ select: { id: true, updatedAt: true, overrides: true } }),
      database.homeMomentsGallery.findMany(),
      database.itemAttachment.findMany({ select: { id: true, fileUrl: true } }),
      database.itemLink.findMany({ select: { id: true, url: true } }),
    ]);
    const affected = {
      users: users.filter(row => changed(row, clean(row))), items: items.filter(row => changed({ ...row, updatedAt: undefined }, clean({ ...row, updatedAt: undefined }))),
      revisions: revisions.filter(row => changed(row, clean(row))), drafts: drafts.filter(row => changed(row.overrides, clean(row.overrides))),
      galleries: galleries.filter(row => changed(row.photos, clean(row.photos))), attachments: attachments.filter(row => targets.has(row.fileUrl)), links: links.filter(row => targets.has(row.url)),
    };
    console.log(JSON.stringify({ mode: args.includes('--apply') ? 'apply' : 'dry-run', photos: images.length, affected: Object.fromEntries(Object.entries(affected).map(([key, rows]) => [key, rows.length])) }));
    if (!args.includes('--apply')) return;
    const backup = path.resolve(root, '.tmp', `local-image-cleanup-${Date.now()}.json`);
    await mkdir(path.dirname(backup), { recursive: true });
    await writeFile(backup, JSON.stringify({ images, affected }, null, 2));
    const check = (count: number) => { if (count !== 1) throw new Error('Concurrent content update; cleanup transaction rolled back'); };
    await database.$transaction(async tx => {
      for (const row of affected.users) check((await tx.user.updateMany({ where: { id: row.id, avatarUrl: row.avatarUrl }, data: { avatarUrl: null } })).count);
      for (const row of affected.items) {
        const next = clean({ thumbnailUrl: row.thumbnailUrl, content: row.content, authorDraft: row.authorDraft, mediaDriveUrl: row.mediaDriveUrl });
        check((await tx.showcaseItem.updateMany({ where: { id: row.id, updatedAt: row.updatedAt, reviewVersion: row.reviewVersion }, data: { ...next, authorDraft: next.authorDraft === null ? Prisma.DbNull : json(next.authorDraft), reviewVersion: { increment: 1 } } })).count);
      }
      for (const row of affected.revisions) check((await tx.submissionRevision.updateMany({ where: { id: row.id, snapshot: { equals: row.snapshot as Prisma.InputJsonValue } }, data: { snapshot: json(clean(row.snapshot)) } })).count);
      for (const row of affected.drafts) check((await tx.editorialDraft.updateMany({ where: { id: row.id, updatedAt: row.updatedAt }, data: { overrides: json(clean(row.overrides)) } })).count);
      for (const row of affected.galleries) check((await tx.homeMomentsGallery.updateMany({ where: { id: row.id, version: row.version }, data: { photos: json(clean(row.photos)), version: { increment: 1 } } })).count);
      for (const row of affected.attachments) check((await tx.itemAttachment.deleteMany({ where: row })).count);
      for (const row of affected.links) check((await tx.itemLink.deleteMany({ where: row })).count);
    }, { timeout: 30_000 });
    for (const image of images) {
      if (imageDigest(await readFile(image.filename)) !== image.sha256) throw new Error('Local image changed; file deletion stopped');
      await unlink(image.filename);
    }
    console.log(`Removed ${images.length} local photos. Logo and non-image files preserved. Reference backup: ${path.relative(root, backup)}`);
  } finally { await database.$disconnect(); }
}
main().catch(error => {
  console.error(error instanceof Error && /^(Concurrent content|Local image changed|Invalid cleanup|Refusing symlink|Image path outside)/.test(error.message) ? error.message : 'Local image cleanup failed; credentials and content were not printed.');
  process.exitCode = 1;
});
