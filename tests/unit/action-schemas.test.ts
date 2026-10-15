import { describe, expect, it } from 'vitest';
import {
  createMemberInputSchema,
  createShowcaseItemInputSchema,
  editorialDraftInputSchema,
  rejectShowcaseInputSchema,
  reviewCommentInputSchema,
  safeHttpUrlSchema,
  showcaseDraftInputSchema,
  showcaseItemIdSchema,
  showcaseSubmissionInputSchema,
  toggleItemVisibilityInputSchema,
} from '@/lib/action-schemas';

const validShowcaseItem = {
  title: 'Nexus research project',
  summary: 'A concise summary.',
  type: 'PROJECT',
  publishedYear: 2026,
  contributors: [],
  links: [],
};

describe('action schemas', () => {
  it('rejects javascript URLs in showcase input', () => {
    expect(safeHttpUrlSchema.safeParse('javascript:alert(1)').success).toBe(false);
    expect(createShowcaseItemInputSchema.safeParse({
      ...validShowcaseItem,
      links: [{ label: 'Unsafe', url: 'javascript:alert(1)', type: 'OTHER' }],
    }).success).toBe(false);
  });

  it('rejects oversized text and unbounded link collections', () => {
    expect(createShowcaseItemInputSchema.safeParse({
      ...validShowcaseItem,
      title: 'a'.repeat(201),
    }).success).toBe(false);
    expect(createShowcaseItemInputSchema.safeParse({
      ...validShowcaseItem,
      links: Array.from({ length: 21 }, (_, index) => ({
        label: `Link ${index}`,
        url: 'https://example.test',
        type: 'OTHER',
      })),
    }).success).toBe(false);
  });

  it('rejects invalid showcase enums and years', () => {
    expect(createShowcaseItemInputSchema.safeParse({ ...validShowcaseItem, type: 'UNTRUSTED_TYPE' }).success).toBe(false);
    expect(createShowcaseItemInputSchema.safeParse({ ...validShowcaseItem, publishedYear: 3000 }).success).toBe(false);
  });

  it('rejects invalid mutation IDs and privileged member roles', () => {
    expect(showcaseItemIdSchema.safeParse('not-a-cuid').success).toBe(false);
    expect(createMemberInputSchema.safeParse({
      fullName: 'New Member',
      email: 'new.member@nexus.test',
      role: 'ADMIN',
    }).success).toBe(false);
  });

  it('validates flexible submission fields: tags, mediaDriveUrl, categoryId, proposedCategory', () => {
    const validFlexible = {
      title: 'Robotics Autonomous Rover',
      summary: 'Dự án xe tự hành với LiDAR và STM32.',
      type: 'PROJECT' as const,
      categoryId: 'cjr012345678901234567890',
      proposedCategory: 'Robotics',
      tags: ['Robotics', 'LiDAR', 'STM32'],
      mediaDriveUrl: 'https://drive.google.com/drive/folders/test123456',
      visibility: 'PUBLIC' as const,
      contributors: [],
      links: [{ label: 'GitHub Repo', url: 'https://github.com/nexus/rover', type: 'OTHER' as const }],
    };

    const parsed = createShowcaseItemInputSchema.safeParse(validFlexible);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.tags).toEqual(['Robotics', 'LiDAR', 'STM32']);
      expect(parsed.data.mediaDriveUrl).toBe('https://drive.google.com/drive/folders/test123456');
    }
  });

  it('validates toggleItemVisibilityInputSchema requires valid cuid', () => {
    expect((toggleItemVisibilityInputSchema as any)?.safeParse?.({ itemId: 'not-a-cuid' })?.success).toBe(false);
    expect((toggleItemVisibilityInputSchema as any)?.safeParse?.({ itemId: 'cjr012345678901234567890' })?.success).toBe(true);
  });
});

describe('submission workflow schemas', () => {
  const author = {
    userId: 'cjr012345678901234567890',
    role: 'PROJECT_LEAD' as const,
    displayOrder: 0,
  };
  const base = {
    title: 'Bản thảo robot tự hành',
    summary: '',
    content: '',
    suggestedField: 'Robotics',
    customProjectType: '',
    publishedYear: 2026,
    contributors: [],
    resources: [],
  };

  it('allows a title-only draft but requires a summary and contributor for submission', () => {
    expect(showcaseDraftInputSchema.safeParse(base).success).toBe(true);
    expect(showcaseSubmissionInputSchema.safeParse(base).success).toBe(false);
    expect(showcaseSubmissionInputSchema.safeParse({
      ...base,
      summary: 'Mô tả đóng góp học thuật của dự án.',
      contributors: [author],
    }).success).toBe(true);
  });

  it('limits custom project types and resource collections to safe values', () => {
    expect(showcaseDraftInputSchema.safeParse({ ...base, customProjectType: 'x'.repeat(101) }).success).toBe(false);
    expect(showcaseDraftInputSchema.safeParse({
      ...base,
      resources: [{ kind: 'LINK', label: 'Unsafe', url: 'javascript:alert(1)' }],
    }).success).toBe(false);
    expect(showcaseDraftInputSchema.safeParse({
      ...base,
      resources: Array.from({ length: 21 }, (_, index) => ({
        kind: 'LINK',
        label: `Resource ${index}`,
        url: 'https://example.test/resource',
      })),
    }).success).toBe(false);
  });

  it('accepts only known editable fields and requires actionable review text', () => {
    expect(editorialDraftInputSchema.safeParse({ title: 'Bản biên tập', unknown: 'ignored' }).success).toBe(false);
    expect(editorialDraftInputSchema.safeParse({ resources: [] }).success).toBe(false);
    expect(reviewCommentInputSchema.safeParse({
      itemId: 'cjr012345678901234567890',
      fieldKey: 'unknown',
      body: 'Cần làm rõ.',
      audience: 'AUTHOR',
      severity: 'REQUIRED',
    }).success).toBe(false);
    expect(rejectShowcaseInputSchema.safeParse({
      itemId: 'cjr012345678901234567890',
      reason: '   ',
    }).success).toBe(false);
  });
});
