import type { PublicUser } from '@/features/identity/model/public-user';
import type { CitationItem } from '@/features/publications/model/citation';
import type { Prisma } from '@prisma/client';
import type { publicationCardSelect, publicationDetailSelect } from '../server/selects';

export type CitationDto = CitationItem;
export function toCitationDto(item: CitationDto): CitationDto {
  return {
    title: item.title,
    slug: item.slug,
    publishedYear: item.publishedYear,
    issuer: item.issuer,
    contributors: item.contributors.map(contributor => ({
      user: contributor.user ? { fullName: contributor.user.fullName } : contributor.user,
      externalName: contributor.externalName,
    })),
  };
}
export type PublicationCardDto = Prisma.ShowcaseItemGetPayload<{ select: typeof publicationCardSelect }>;
export type PublicationDetailDto = Prisma.ShowcaseItemGetPayload<{ select: typeof publicationDetailSelect }>;
export type PublicMemberDto = PublicUser & { _count: { contributions: number } };
export type AuthorItemDto = PublicationCardDto & {
  status: import('@prisma/client').ItemStatus;
  reviewStatus: import('@prisma/client').ItemStatus | null;
  reviewVersion: number;
  rejectionReason: string | null;
};
