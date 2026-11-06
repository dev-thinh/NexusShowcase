import type { CitationItem } from '@/features/publications/model/citation';
import type { Prisma } from '@prisma/client';
import type { publicationCardSelect } from '../server/selects';

export type CitationDto = CitationItem;
export function toCitationDto(item: CitationDto): CitationDto {
  return {
    citationEnabled: item.citationEnabled,
    conference: item.conference,
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
