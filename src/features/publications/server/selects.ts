import { publicUserSelect } from '@/features/identity/model/public-user';
import type { Prisma } from '@prisma/client';

export const publicationCardSelect = {
  id: true, title: true, slug: true, summary: true, thumbnailUrl: true,
  type: true, scope: true, issuer: true, publishedYear: true,
  isPinned: true, visibility: true,
  contributors: {
    select: { id: true, role: true, externalName: true, user: { select: { id: true, fullName: true } } },
    orderBy: { displayOrder: 'asc' },
  },
  links: { select: { type: true, url: true } },
} satisfies Prisma.ShowcaseItemSelect;

export const publicationDetailSelect = {
  ...publicationCardSelect,
  content: true, status: true, creatorId: true, createdAt: true, rejectionReason: true,
  publishedAt: true, updatedAt: true, mediaDriveUrl: true, categoryId: true,
  customProjectType: true, suggestedField: true,
  contributors: { include: { user: { select: publicUserSelect } }, orderBy: { displayOrder: 'asc' } },
  links: true,
  attachments: true,
} satisfies Prisma.ShowcaseItemSelect;
