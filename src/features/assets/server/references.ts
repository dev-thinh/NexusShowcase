import type { PrismaClient } from '@prisma/client';
import { assertAssetPath } from './asset-path';

/** Match the database guard's bounded printable-ASCII decoder. */
export function normalizeAssetReferenceText(value: string): { text: string; incomplete: boolean } {
  let text = value;
  const named: Record<string, string> = { sol: '/', period: '.', lowbar: '_', UnderBar: '_', bsol: '\\', percnt: '%', amp: '&', AMP: '&', colon: ':', num: '#', quest: '?', equals: '=', commat: '@', fjlig: 'fj' };
  const decode = (code: number, original: string) => code >= 32 && code <= 126 ? String.fromCharCode(code) : original;
  for (let pass = 0; pass < 8; pass++) {
    const next = text.replace(/&([a-z]+);/gi, (original, name: string) => Object.hasOwn(named, name) ? named[name] : original).replace(/\\u([0-9a-f]{4})|%([0-9a-f]{2})|&#(?:x([0-9a-f]+)|(\d+));/gi, (original, unicode, percent, hex, decimal) => decode(decimal ? Number(decimal) : parseInt(unicode ?? percent ?? hex, 16), original)).replace(/\\+\//g, '/');
    if (next === text) break;
    text = next;
  }
  return { text, incomplete: /\\u[0-9a-f]{4}|%[0-9a-f]{2}|&(?:#\w+|[a-z]+);/i.test(text) };
}

/** Foreign origins never grant access to a local object with the same pathname. */
export function inspectAssetReferences(value: unknown, options: { strictLocal?: boolean } = {}): { urls: Set<string>; incomplete: boolean } {
  const urls = new Set<string>();
  let incomplete = false;
  let invalidLocal = false;
  function inspect(entry: unknown): void {
    if (Array.isArray(entry)) { entry.forEach(inspect); return; }
    if (entry && typeof entry === 'object') { Object.values(entry).forEach(inspect); return; }
    if (typeof entry !== 'string') return;
    const prefix = 'nexus-sections:v1\n';
    if (entry.startsWith(prefix)) {
      try { inspect(JSON.parse(entry.slice(prefix.length))); } catch { incomplete = true; }
      return;
    }
    if (/^\s*[\[{]/.test(entry)) {
      try { inspect(JSON.parse(entry)); return; } catch { incomplete = true; }
    }
    const normalized = normalizeAssetReferenceText(entry);
    incomplete ||= normalized.incomplete;
    for (const match of normalized.text.matchAll(/https?:\/\/[^\s"'<>\\]+|\/uploads\/[^\s"'<>\\)\]]+/g)) {
      const candidate = match[0];
      if (/^https?:/.test(candidate)) {
        // External URLs may be legacy origin URLs: inventory cannot prove ownership.
        if (candidate.includes('/uploads/') || /https?:\/\/ik\.imagekit\.io\//i.test(candidate)) incomplete = true;
        continue;
      }
      const pathname = candidate.split(/[?#]/)[0];
      try { assertAssetPath(pathname); urls.add(pathname); } catch { incomplete = true; invalidLocal = true; }
    }
  }
  inspect(value);
  if (options.strictLocal && invalidLocal) throw new Error('Ambiguous local asset reference');
  return { urls, incomplete };
}

export function extractLocalAssetUrls(value: unknown): Set<string> {
  const result = inspectAssetReferences(value);
  if (result.incomplete) throw new Error('Incomplete asset reference provenance');
  return result.urls;
}

export type ReferenceInventory = { urls: Set<string>; incompleteSources: string[] };

/** Every persisted media-bearing source participates, including historical revisions. */
export async function inventoryAssetReferences(db: PrismaClient): Promise<ReferenceInventory> {
  const sources = [
    ['user.avatar', () => db.user.findMany({ select: { avatarUrl: true } })],
    ['item.live-draft', () => db.showcaseItem.findMany({ select: { thumbnailUrl: true, content: true, authorDraft: true, mediaDriveUrl: true } })],
    ['item.links', () => db.itemLink.findMany({ select: { url: true } })],
    ['item.attachments', () => db.itemAttachment.findMany({ select: { fileUrl: true } })],
    ['revision.history', () => db.submissionRevision.findMany({ select: { snapshot: true } })],
    ['editorial.overrides', () => db.editorialDraft.findMany({ select: { overrides: true } })],
    ['gallery.photos', () => db.homeMomentsGallery.findMany({ select: { photos: true } })],
  ] as const;
  const urls = new Set<string>(), incompleteSources: string[] = [];
  for (const [name, read] of sources) {
    try {
      extractLocalAssetUrls(await read()).forEach(url => urls.add(url));
    } catch { incompleteSources.push(name); }
  }
  return { urls, incompleteSources };
}
