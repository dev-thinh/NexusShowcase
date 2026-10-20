import { z } from 'zod';

export const ARTICLE_PREFIX = 'nexus-sections:v1\n';
const httpUrl = z.string().trim().max(2048).url().refine(value => {
  try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
}, 'Chỉ chấp nhận liên kết HTTP hoặc HTTPS.');
const assetUrl = z.union([httpUrl, z.string().regex(/^\/uploads\/(thumbnails|documents)\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|pdf)$/)]);
const media = {
  id: z.string().min(1).max(100),
  url: z.union([assetUrl, z.literal('')]),
  caption: z.string().max(160).default(''),
  alt: z.string().max(500).default(''),
  fileName: z.string().max(160).optional(),
  fileSize: z.number().int().min(0).max(25 * 1024 * 1024).optional(),
  mimeType: z.string().max(120).optional(),
};
export const articleBlockSchema = z.discriminatedUnion('kind', [
  z.object({ id: media.id, kind: z.literal('TEXT'), text: z.string().max(20_000) }).strict(),
  z.object({ ...media, kind: z.literal('IMAGE') }).strict(),
  z.object({ ...media, kind: z.literal('DOCUMENT') }).strict(),
  z.object({ ...media, url: z.union([httpUrl, z.literal('')]), kind: z.literal('VIDEO') }).strict(),
  z.object({ ...media, url: z.union([httpUrl, z.literal('')]), kind: z.literal('LINK') }).strict(),
]);
export const articleDocumentSchema = z.object({
  version: z.literal(1),
  sections: z.array(z.object({
    id: z.string().min(1).max(100),
    title: z.string().trim().max(120),
    blocks: z.array(articleBlockSchema).max(40),
  }).strict()).max(30),
}).strict().superRefine((doc, ctx) => {
  const ids = [ ...doc.sections.map(s => s.id), ...doc.sections.flatMap(s => s.blocks.map(b => b.id)) ];
  if (new Set(ids).size !== ids.length) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Mã section và khối nội dung phải duy nhất.' });
});
export type ArticleDocument = z.infer<typeof articleDocumentSchema>;
export type ArticleSection = ArticleDocument['sections'][number];
export type ArticleBlock = z.infer<typeof articleBlockSchema>;
export type MediaBlock = Exclude<ArticleBlock, { kind: 'TEXT' }>;

// Draft parsing checks structure without normalizing or rejecting in-progress input.
const editingMedia = Object.fromEntries(Object.keys(media).map(key => [key, key === 'fileSize' ? z.number().optional() : ['fileName', 'mimeType'].includes(key) ? z.string().optional() : z.string()]));
const editingBlock = z.discriminatedUnion('kind', [
  z.object({ id: z.string(), kind: z.literal('TEXT'), text: z.string() }).strict(),
  ...(['IMAGE', 'DOCUMENT', 'VIDEO', 'LINK'] as const).map(kind => z.object({ ...editingMedia, id: z.string(), url: z.string(), caption: z.string(), alt: z.string(), kind: z.literal(kind) }).strict()),
]);
const editingDocument = z.object({ version: z.literal(1), sections: z.array(z.object({ id: z.string(), title: z.string(), blocks: z.array(editingBlock) }).strict()) }).strict();

export function parseArticleContent(content?: string | null): ArticleDocument | null {
  if (!content?.startsWith(ARTICLE_PREFIX)) return null;
  try {
    const parsed = articleDocumentSchema.safeParse(JSON.parse(content.slice(ARTICLE_PREFIX.length)));
    return parsed.success ? parsed.data : null;
  } catch { return null; }
}
export function serializeArticle(doc: ArticleDocument): string {
  return ARTICLE_PREFIX + JSON.stringify(doc);
}
export function isValidArticleContent(content: string): boolean {
  return !content.startsWith(ARTICLE_PREFIX) || parseArticleContent(content) !== null;
}
export function articleSubmissionErrors(content: string): string[] {
  const doc = parseArticleContent(content);
  if (!doc) return [];
  const errors: string[] = [];
  for (const section of doc.sections) {
    if (!section.title) errors.push('Mỗi section cần có tiêu đề.');
    if (['abstract', 'tóm tắt'].includes(section.title.toLocaleLowerCase('vi'))) errors.push('Abstract / Tóm tắt đã là phần cố định, không cần thêm section trùng.');
    if (!section.blocks.length || section.blocks.every(b => b.kind === 'TEXT' ? !b.text.trim() : !b.url)) errors.push(`Section “${section.title || 'chưa đặt tên'}” chưa có nội dung.`);
    for (const block of section.blocks) {
      if (block.kind === 'TEXT' && !block.text.trim()) errors.push('Hãy bổ sung hoặc xóa khối văn bản trống.');
      if (block.kind !== 'TEXT' && !block.url) errors.push('Hãy hoàn tất hoặc xóa khối media chưa có tài nguyên.');
      if (block.kind === 'IMAGE' && !block.alt.trim()) errors.push('Ảnh cần có mô tả để người đọc hiểu nội dung.');
    }
  }
  return errors;
}
export function hasDetailedContent(content: string): boolean {
  const doc = parseArticleContent(content);
  return doc ? doc.sections.some(s => s.blocks.some(b => b.kind === 'TEXT' ? !!b.text.trim() : !!b.url)) : !!content.trim();
}
export function articleResources(content: string) {
  return (parseArticleContent(content)?.sections.flatMap(s => s.blocks) ?? []).flatMap(block => {
    if (block.kind === 'TEXT' || !block.url) return [];
    return [{
      kind: block.kind === 'VIDEO' ? 'LINK' as const : block.kind,
      label: block.caption || block.fileName || (block.kind === 'VIDEO' ? 'Video demo' : block.kind === 'LINK' ? 'Liên kết' : block.kind === 'IMAGE' ? 'Hình minh họa' : 'Tài liệu PDF'),
      url: block.url,
      linkType: block.kind === 'VIDEO' ? 'VIDEO_EMBED' as const : isGithubUrl(block.url) ? 'GITHUB' as const : 'OTHER' as const,
      fileName: block.fileName, fileSize: block.fileSize, mimeType: block.mimeType,
    }];
  });
}
export function isGithubUrl(value: string) {
  try { return new URL(value).hostname.toLowerCase() === 'github.com'; } catch { return false; }
}

// One-time, in-memory conversion: existing text/files remain editable and are saved only by the author.
export function articleFromLegacy(content: string, resources: Array<{ kind: 'IMAGE' | 'DOCUMENT' | 'LINK'; label: string; url: string; linkType?: string; fileName?: string; fileSize?: number; mimeType?: string }> = []): ArticleDocument {
  // Editing must preserve whitespace, incomplete URLs and over-limit text.
  // The publication schema still validates the document on save/submit.
  if (content.startsWith(ARTICLE_PREFIX)) {
    try {
      const raw = JSON.parse(content.slice(ARTICLE_PREFIX.length));
      if (editingDocument.safeParse(raw).success) return raw as ArticleDocument;
    } catch {}
  }
  const sections: ArticleSection[] = [];
  if (content.trim()) sections.push({ id: 'legacy-content', title: 'Nội dung công trình', blocks: [{ id: 'legacy-text', kind: 'TEXT', text: content }] });
  if (resources.length) sections.push({ id: 'legacy-resources', title: 'Tài liệu và liên kết', blocks: resources.map((r, i) => ({
    id: `legacy-resource-${i}`, kind: r.linkType === 'VIDEO_EMBED' ? 'VIDEO' : r.kind,
    url: r.url, caption: r.label, alt: r.kind === 'IMAGE' ? r.label : '', fileName: r.fileName, fileSize: r.fileSize, mimeType: r.mimeType,
  })) });
  return { version: 1, sections };
}

/** Keep sidebar resources separate from media already embedded in the article. */
export function standaloneResources(content: string, resources: import('@/lib/submission-types').SubmissionResource[]) {
  const embedded = new Set(articleResources(content).map(resource => resource.url));
  return resources.filter(resource => !embedded.has(resource.url));
}

export function publicationResources(content: string, resources: import('@/lib/submission-types').SubmissionResource[]) {
  const result = new Map<string, import('@/lib/submission-types').SubmissionResource>();
  for (const resource of [...resources, ...articleResources(content)]) {
    if (!result.has(resource.url)) result.set(resource.url, resource);
  }
  return [...result.values()];
}
