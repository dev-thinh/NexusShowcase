import { MediaImage } from '@/shared/ui/media-image';
import { TypeBadge } from '@/features/publications/components/badges';
import { CardLink } from '@/features/publications/components/card-link';
import { CitationModal } from '@/features/publications/components/citation-modal';
import { toCitationDto } from '@/features/publications/model/contracts';
import { ItemScope, ItemType } from '@prisma/client';
import { ArrowRight, ArrowUpRight, Building2, Calendar } from 'lucide-react';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';

interface Contributor {
  id: string;
  user?: { id: string; fullName: string } | null;
  externalName?: string | null;
  role: string;
}

interface ShowcaseCardProps {
  item: {
    id: string;
    title: string;
    slug: string;
    summary: string;
    thumbnailUrl?: string | null;
    type: ItemType;
    scope?: ItemScope | null;
    issuer?: string | null;
    publishedYear?: number | null;
    contributors: Contributor[];
  };
}

export function ShowcaseCard({ item }: ShowcaseCardProps) {
  const authorNames = item.contributors
    .map((c) => c.user?.fullName || c.externalName)
    .filter(Boolean);

  const authors = authorNames.join(', ');

  return (
    <div className="clickable-card panel-public group flex h-full min-w-0 flex-col !p-0 hover:shadow-sm hover:border-slate-200 transition-all duration-200 overflow-hidden">
      <CardLink slug={item.slug} />
      {/* Thumbnail Container */}
      <Link
        href={`/showcase/${item.slug}`}
        className="aspect-[16/9] w-full bg-[#FFFFFF] relative overflow-hidden flex items-center justify-center border-b border-slate-200 block"
        aria-label={`Xem chi tiết ${item.title}`}
      >
        <MediaImage
            src={item.thumbnailUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
            loading="lazy"
          />

        <div className="absolute top-2.5 left-2.5">
          <TypeBadge type={item.type} size="sm" />
        </div>

        <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white backdrop-blur-xs p-1.5 rounded-full text-[#1F2937] shadow-xs border border-slate-200">
          <ArrowUpRight className="w-3.5 h-3.5" />
        </div>
      </Link>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2.5 text-xs text-[#1F2937] mb-2">
          {item.publishedYear && (
            <span className="flex items-center gap-1 font-semibold">
              <Calendar className="w-3.5 h-3.5 text-[#1F2937]" />
              {item.publishedYear}
            </span>
          )}
          {item.issuer && (
            <span
              className="flex items-center gap-1 font-semibold truncate max-w-[180px]"
              title={item.issuer}
            >
              <Building2 className="w-3.5 h-3.5 text-[#1F2937]" />
              {item.issuer}
            </span>
          )}
        </div>

        <Link href={`/showcase/${item.slug}`} className="block group-hover:text-[#1F2937] transition-colors">
          <h3 className="text-base sm:text-lg font-semibold text-[#1F2937] group-hover:text-[#1F2937] transition-colors h-14 line-clamp-2 leading-7 mb-2">
            {item.title}
          </h3>
        </Link>

        <p className="h-12 shrink-0 text-xs sm:text-sm text-[#1F2937] line-clamp-2 leading-6">
          {item.summary}
        </p>

        {/* Authors Footer with Citation Badge */}
        <div className="mt-auto pt-3 border-t border-slate-200 flex min-w-0 items-center justify-between gap-3 text-xs text-[#1F2937]">
          <div className="min-w-0 flex-1 truncate" title={authors}>

            <span className="text-foreground-muted">{authors}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <CitationModal item={toCitationDto(item)} triggerVariant="badge" />
            <Link
              href={`/showcase/${item.slug}`}
              className="text-[#1F2937] text-xs font-semibold hover:text-[#1F2937] inline-flex items-center gap-1 group/btn transition-colors"
            >
              <span>Xem</span>
              <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
