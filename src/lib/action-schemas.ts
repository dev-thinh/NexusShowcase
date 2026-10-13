import { z } from 'zod';

export const INVALID_ACTION_INPUT_ERROR = 'Invalid input.';

const MAX_CURRENT_YEAR = new Date().getFullYear() + 1;
const cuidSchema = z.string().cuid();
const trimmedText = (max: number) => z.string().trim().max(max);

export const safeHttpUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .url()
  .refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === 'http:' || protocol === 'https:';
  }, 'Only HTTP(S) URLs are allowed.');

const localUploadUrlSchema = z
  .string()
  .regex(/^\/uploads\/(thumbnails|documents)\/[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp|pdf)$/);

const storedFileUrlSchema = z.union([safeHttpUrlSchema, localUploadUrlSchema]);

const contributorInputSchema = z.object({
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

const linkInputSchema = z.object({
  label: trimmedText(120).min(1),
  url: safeHttpUrlSchema,
  type: z.enum(['PAPER_URL', 'VIDEO_EMBED', 'GITHUB', 'LIVE_DEMO', 'SLIDES', 'CERTIFICATE', 'OTHER']),
});

const attachmentInputSchema = z.object({
  fileName: trimmedText(160).min(1),
  fileUrl: storedFileUrlSchema,
  fileSize: z.number().int().min(0).max(25 * 1024 * 1024),
  mimeType: z.literal('application/pdf'),
});

export const createShowcaseItemInputSchema = z.object({
  title: trimmedText(200).min(1),
  summary: trimmedText(2_000).min(1),
  content: trimmedText(50_000).optional(),
  type: z.enum(['RESEARCH_PAPER', 'PROJECT', 'ACHIEVEMENT']).default('PROJECT'),
  categoryId: cuidSchema.optional(),
  proposedCategory: trimmedText(100).optional(),
  tags: z.array(trimmedText(50)).max(20).default([]),
  scope: z.enum(['INTERNAL', 'CLUB_CONTRIBUTION', 'EXTERNAL', 'OPEN_SOURCE']).optional(),
  issuer: trimmedText(200).optional(),
  thumbnailUrl: storedFileUrlSchema.optional(),
  mediaDriveUrl: safeHttpUrlSchema.optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).default('PRIVATE'),
  publishedYear: z.number().int().min(1900).max(MAX_CURRENT_YEAR).optional(),
  contributors: z.array(contributorInputSchema).max(20),
  links: z.array(linkInputSchema).max(20),
  attachments: z.array(attachmentInputSchema).max(10).optional(),
  submitForReview: z.boolean().optional(),
});

export const showcaseItemIdSchema = cuidSchema;

export const toggleItemVisibilityInputSchema = z.object({
  itemId: showcaseItemIdSchema,
});
export const reviewShowcaseItemInputSchema = z.object({
  itemId: showcaseItemIdSchema,
  payload: z.object({
    action: z.enum(['PUBLISH', 'REJECT']),
    reason: trimmedText(1_000).optional(),
  }),
});

export const createMemberInputSchema = z.object({
  fullName: trimmedText(200).min(1),
  email: trimmedText(254).min(1),
  studentId: trimmedText(64).optional(),
  role: z.enum(['MEMBER', 'CORE_MEMBER']).optional(),
  password: trimmedText(128).optional(),
});

export const userRoleUpdateInputSchema = z.object({
  targetUserId: cuidSchema,
  newRole: z.enum(['GUEST', 'MEMBER', 'CORE_MEMBER', 'ADMIN']),
});

export const deleteMemberInputSchema = z.object({ targetUserId: cuidSchema });

export type ContributorInput = z.input<typeof contributorInputSchema>;
export type LinkInput = z.input<typeof linkInputSchema>;
export type AttachmentInput = z.input<typeof attachmentInputSchema>;
export type CreateShowcaseItemInput = z.input<typeof createShowcaseItemInputSchema>;
export type CreateMemberInput = z.input<typeof createMemberInputSchema>;
