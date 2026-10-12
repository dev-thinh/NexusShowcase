import { describe, expect, it } from 'vitest';
import {
  createMemberInputSchema,
  createShowcaseItemInputSchema,
  safeHttpUrlSchema,
  showcaseItemIdSchema,
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
});
