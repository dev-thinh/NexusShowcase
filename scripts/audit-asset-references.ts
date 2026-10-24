import type { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function files(root: string): string[] {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(path.join(root, entry.name)) : [path.join(root, entry.name)]);
}

export async function auditAssetReferences(input: { prisma: PrismaClient; root: string }): Promise<{ referenced: string[]; unreferenced: string[]; incompleteSources: string[] }> {
  const root = path.resolve(input.root), referenced = new Set<string>(), incompleteSources: string[] = [];
  function inspect(value: unknown): void {
    if (Array.isArray(value)) { value.forEach(inspect); return; }
    if (value && typeof value === 'object') { Object.values(value).forEach(inspect); return; }
    if (typeof value !== 'string') return;
    const structured = value.startsWith('nexus-sections:v1\n') ? value.slice('nexus-sections:v1\n'.length) : value;
    if (structured.startsWith('{') || structured.startsWith('[')) {
      try { inspect(JSON.parse(structured)); } catch { /* Scan text for ordinary URLs below. */ }
    }
    const candidates = value.match(/https?:\/\/[^\s"'<>\\]+|\/(?:uploads\/[^\s"'<>\\]+|logo\.svg(?:[?#][^\s"'<>\\]*)?)/g) ?? [];
    for (const candidate of candidates) {
      if (/^https?:/.test(candidate)) {
        if (candidate.includes('/uploads/')) incompleteSources.push('absolute-upload-url:manual-origin-review');
        continue;
      }
      try {
        const normalized = decodeURIComponent(new URL(candidate, 'http://local.invalid').pathname);
        if (/^\/uploads\/(thumbnails|documents|resources)\/[a-zA-Z0-9_.-]+$/.test(normalized) || normalized === '/logo.svg') referenced.add(normalized);
        else incompleteSources.push('unrecognized-local-asset-path');
      } catch { incompleteSources.push('unparseable-local-asset-path'); }
    }
  }
  for (const file of [...files(path.join(root, 'src')), ...files(path.join(root, 'prisma')), ...files(path.join(root, 'scripts')), ...fs.readdirSync(root).filter(name => /\.(?:tsx?|mjs|json|md)$/.test(name) && !name.startsWith('package-lock')).map(name => path.join(root, name))]) {
    if (/\.(?:tsx?|mjs|json|md|css)$/.test(file) && fs.statSync(file).isFile()) inspect(fs.readFileSync(file, 'utf8'));
  }
  const database = input.prisma;
  const readers = [
    ['user.avatar', () => database.user.findMany({ select: { avatarUrl: true } })],
    ['item.live-draft', () => database.showcaseItem.findMany({ select: { thumbnailUrl: true, content: true, authorDraft: true, mediaDriveUrl: true } })],
    ['item.links', () => database.itemLink.findMany({ select: { url: true } })],
    ['item.attachments', () => database.itemAttachment.findMany({ select: { fileUrl: true } })],
    ['revision.history', () => database.submissionRevision.findMany({ select: { snapshot: true } })],
    ['editorial.overrides', () => database.editorialDraft.findMany({ select: { overrides: true } })],
  ] as const;
  for (const [name, read] of readers) {
    try { inspect(await read()); } catch { incompleteSources.push(name); }
  }
  const disk = [
    ...files(path.join(root, 'public')).map(file => '/' + path.relative(path.join(root, 'public'), file).split(path.sep).join('/')),
    ...files(path.join(root, 'storage/resources')).map(file => '/uploads/resources/' + path.basename(file)),
  ];
  return { referenced: [...referenced].sort(), unreferenced: disk.filter(file => !referenced.has(file)).sort(), incompleteSources: [...new Set(incompleteSources)].sort() };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const main = async () => {
    const { loadEnvConfig } = await import('@next/env');
    const { PrismaClient } = await import('@prisma/client');
    loadEnvConfig(process.cwd());
    const prisma = new PrismaClient({ log: [] });
    try {
      const result = await auditAssetReferences({ prisma, root: process.cwd() });
      console.log(JSON.stringify(result, null, 2));
      if (result.incompleteSources.length) process.exitCode = 1;
    } finally { await prisma.$disconnect(); }
  };
  main().catch(() => { console.error('Read-only asset audit failed; no files were deleted.'); process.exitCode = 1; });
}
