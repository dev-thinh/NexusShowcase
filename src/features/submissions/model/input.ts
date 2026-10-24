import { articleSubmissionErrors, hasDetailedContent, isValidArticleContent } from '@/features/submissions/model/article';
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
}).strict();

const showcaseWorkflowShape = {
  title: trimmedText(200).min(1, 'Vui lòng nhập tiêu đề.'),
  summary: trimmedText(2_000).default(''),
  content: trimmedText(200_000).refine(isValidArticleContent, 'Nội dung section không hợp lệ.').default(''),
  type: z.enum(['RESEARCH_PAPER', 'PROJECT']).default('PROJECT'),
  categoryId: cuidSchema.nullish(),
  thumbnailUrl: storedFileUrlSchema.nullish(),
  publishedYear: z.number().int().min(1900).max(MAX_CURRENT_YEAR).optional(),
  suggestedField: trimmedText(100).default(''),
  customProjectType: trimmedText(100).default(''),
  contributors: z.array(contributorInputSchema).max(20).default([]),
  resources: z.array(submissionResourceSchema).max(200).default([]),
};

export const showcaseDraftInputSchema = z.object(showcaseWorkflowShape).strict();

export const showcaseSubmissionInputSchema = z.object(showcaseWorkflowShape).strict().superRefine((value, context) => {
  for (const message of articleSubmissionErrors(value.content)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['content'], message });
  }
  if (value.type === 'RESEARCH_PAPER' && !hasDetailedContent(value.content) && !value.resources.some(r => r.kind === 'DOCUMENT' || r.linkType === 'PAPER_URL')) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['content'], message: 'Bài nghiên cứu cần nội dung chi tiết hoặc PDF/liên kết toàn văn.' });
  }
  if (!value.summary) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['summary'], message: 'Vui lòng nhập abstract / tóm tắt.' });
  }
  if (value.contributors.length === 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['contributors'], message: 'Vui lòng thêm ít nhất một người đóng góp.' });
  }
});


export type ContributorInput = z.input<typeof contributorInputSchema>;
export type ShowcaseDraftInput = z.input<typeof showcaseDraftInputSchema>;
