import { normalizePaperUrl } from '@/features/publications/model/doi';
import { conferenceSchema } from '@/features/publications/model/conference';
import { isGithubUrl } from '@/shared/lib/github-url';
import { articleSubmissionIssues, hasDetailedContent, articleContentIssues, draftArticleIssues } from '@/features/submissions/model/article';
import { cuidSchema, MAX_CURRENT_YEAR, safeHttpUrlSchema, storedFileUrlSchema, trimmedText } from '@/shared/lib/validation';
import { z } from 'zod';
const storedResourceUrlSchema = z.string().regex(/^\/uploads\/resources\/[a-zA-Z0-9_-]+\.[a-z0-9]{1,16}$/);
const resourceUrlSchema = z.union([storedFileUrlSchema, storedResourceUrlSchema]);

export const contributorInputSchema = z.object({
  userId: cuidSchema.nullish(),
  externalName: trimmedText(200).nullish(),
  externalAffiliation: trimmedText(200).nullish(),
  externalLink: safeHttpUrlSchema.nullish(),
  role: z.enum([
    'ADVISOR',
    'FIRST_AUTHOR',
    'CO_FIRST_AUTHOR',
    'CO_AUTHOR',
    'CORRESPONDING_AUTHOR',
    'PROJECT_LEAD',
    'CONTRIBUTOR',
    'CUSTOM',
  ]),
  customRoleTitle: trimmedText(100).nullish(),
  displayOrder: z.number().int().min(0).max(100),
});

export const submissionResourceSchema = z.object({
  kind: z.enum(['IMAGE', 'DOCUMENT', 'LINK']),
  label: trimmedText(160).min(1),
  url: resourceUrlSchema,
  linkType: z.enum(['PAPER_URL', 'VIDEO_EMBED', 'GITHUB', 'LIVE_DEMO', 'SLIDES', 'CERTIFICATE', 'OTHER']).optional(),
  fileName: trimmedText(160).optional(),
  fileSize: z.number().int().min(0).max(25 * 1024 * 1024).optional(),
  mimeType: trimmedText(120).optional(),
}).strict().refine(resource => resource.linkType !== 'GITHUB' || (resource.kind === 'LINK' && isGithubUrl(resource.url)), { message: 'Vui lòng nhập URL kho mã nguồn dạng https://github.com/owner/repository.', path: ['url'] });

const showcaseWorkflowShape = {
  citationEnabled: z.boolean().default(true),
  conference: conferenceSchema.nullish(),
  title: trimmedText(200).min(1, 'Vui lòng nhập tiêu đề.'),
  summary: trimmedText(2_000).default(''),
  content: trimmedText(200_000).superRefine((content, context) => {
    for (const issue of articleContentIssues(content)) context.addIssue({ code: 'custom', ...issue });
  }).default(''),
  type: z.enum(['RESEARCH_PAPER', 'PROJECT']).default('PROJECT'),
  categoryId: cuidSchema.nullish(),
  thumbnailUrl: storedFileUrlSchema.nullish(),
  publishedYear: z.number().int().min(1900).max(MAX_CURRENT_YEAR).optional(),
  suggestedField: trimmedText(100).default(''),
  customProjectType: trimmedText(100).default(''),
  contributors: z.array(contributorInputSchema).max(20).default([]),
  resources: z.array(submissionResourceSchema).max(200).default([]),
};

const normalizeConference = <T extends { conference?: z.output<typeof conferenceSchema> | null }>(value: T) => ({ ...value, conference: value.conference ?? null, citationEnabled: value.conference?.status === 'PUBLISHED' && safeHttpUrlSchema.safeParse(value.conference.paperUrl).success });

// Editing accepts unfinished strings; publication validation is intentionally separate.
const draftText = (max: number) => z.string().max(max);
const draftUrl = draftText(2048).refine(value => {
  const text = value.trim();
  if (text.startsWith('/')) return resourceUrlSchema.safeParse(text).success;
  return !/^[a-z][a-z\d+.-]*:/i.test(text) || /^https?:/i.test(text);
}, 'Chỉ chấp nhận liên kết HTTP(S) hoặc tệp đã tải lên.');
const draftDate = z.union([z.iso.date(), z.literal('')]).nullish();
export const showcaseDraftInputSchema = z.object({
  ...showcaseWorkflowShape,
  title: draftText(200),
  summary: draftText(2_000).default(''),
  content: draftText(200_000).default('').superRefine((content, context) => {
    for (const issue of draftArticleIssues(content)) context.addIssue({ code: 'custom', ...issue });
  }),
  suggestedField: draftText(100).default(''),
  customProjectType: draftText(100).default(''),
  conference: z.object({
    name: draftText(240), status: z.enum(['ACCEPTED', 'PUBLISHED']).default('ACCEPTED'),
    paperUrl: z.string().transform(normalizePaperUrl).pipe(draftUrl).nullish(), publicationDate: draftDate, eventDate: draftDate, acceptedDate: draftDate,
    rankings: z.array(z.object({ system: draftText(80), rank: draftText(40) }).strict()).max(8).default([]),
  }).strict().nullish(),
  contributors: z.array(contributorInputSchema.extend({
    externalName: draftText(200).nullish(), externalAffiliation: draftText(200).nullish(),
    externalLink: draftUrl.nullish(), customRoleTitle: draftText(100).nullish(),
  })).max(20).default([]),
  resources: z.array(z.object({ ...submissionResourceSchema.shape,
    label: draftText(160), url: draftUrl, fileName: draftText(160).optional(), mimeType: draftText(120).optional(),
  }).strict()).max(200).default([]),
}).strict().transform(normalizeConference);

export const showcaseSubmissionInputSchema = z.object(showcaseWorkflowShape).strict().superRefine((value, context) => {
  if (value.conference?.status === 'PUBLISHED' && !value.conference.paperUrl) {
    context.addIssue({ code: 'custom', path: ['conference', 'paperUrl'], message: 'Vui lòng nhập link bài báo đã công bố.' });
  }
  for (const issue of articleSubmissionIssues(value.content)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['content', ...issue.path], message: issue.message });
  }
  if (value.type === 'RESEARCH_PAPER' && !value.conference?.paperUrl && !hasDetailedContent(value.content) && !value.resources.some(r => r.kind === 'DOCUMENT' || r.linkType === 'PAPER_URL')) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['content'], message: 'Bài nghiên cứu cần nội dung chi tiết hoặc PDF/liên kết toàn văn.' });
  }
  if (!value.summary) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['summary'], message: 'Vui lòng nhập abstract / tóm tắt.' });
  }
  if (value.contributors.length === 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['contributors'], message: 'Vui lòng thêm ít nhất một người đóng góp.' });
  }
}).transform(normalizeConference);


export type ContributorInput = z.input<typeof contributorInputSchema>;
export type ShowcaseDraftInput = z.input<typeof showcaseDraftInputSchema>;
