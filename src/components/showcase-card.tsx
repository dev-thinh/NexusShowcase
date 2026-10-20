import { CardLink } from '@/components/card-link';
import Link from 'next/link';
import { ItemType, ItemScope } from '@prisma/client';
import { TypeBadge } from '@/components/ui/badge';
import { Calendar, Building2, Users, ArrowUpRight, ArrowRight } from 'lucide-react';
import { CitationModal } from '@/components/citation-modal';

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

  const primaryAuthor = authorNames[0] || 'CLB Robotics & IoT';
  const remainingCount = authorNames.length > 1 ? authorNames.length - 1 : 0;

  return (
    <div className="clickable-card panel-public group flex flex-col p-0 hover:shadow-sm hover:border-slate-300 transition-all duration-200 overflow-hidden">
      <CardLink slug={item.slug} />
      {/* Thumbnail Container */}
      <Link
        href={`/showcase/${item.slug}`}
        className="aspect-[16/9] w-full bg-slate-100 relative overflow-hidden flex items-center justify-center border-b border-slate-100 block"
        aria-label={`Xem chi tiết ${item.title}`}
      >
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
            <div className="w-10 h-10 rounded-md bg-white shadow-2xs flex items-center justify-center text-[#0F294A] font-semibold mb-1 border border-slate-200">
              RI
            </div>
            <span className="text-xs font-semibold text-slate-500">CLB Robotics &amp; IoT</span>
          </div>
        )}

        <div className="absolute top-2.5 left-2.5">
          <TypeBadge type={item.type} size="sm" />
        </div>

        <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 backdrop-blur-xs p-1.5 rounded-full text-slate-700 shadow-xs border border-slate-200">
          <ArrowUpRight className="w-3.5 h-3.5" />
        </div>
      </Link>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2.5 text-xs text-slate-500 mb-2">
          {item.publishedYear && (
            <span className="flex items-center gap-1 font-semibold">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {item.publishedYear}
            </span>
          )}
          {item.issuer && (
            <span
              className="flex items-center gap-1 font-semibold truncate max-w-[180px]"
              title={item.issuer}
            >
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              {item.issuer}
            </span>
          )}
        </div>

        <Link href={`/showcase/${item.slug}`} className="block group-hover:text-[#0F294A] transition-colors">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 group-hover:text-[#0F294A] transition-colors line-clamp-2 leading-snug mb-2">
            {item.title}
          </h3>
        </Link>

        <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed flex-1">
          {item.summary}
        </p>

        {/* Authors Footer with Citation Badge */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 truncate max-w-[200px]">
            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-700 truncate">{primaryAuthor}</span>
            {remainingCount > 0 && (
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold shrink-0 border border-slate-200">
                +{remainingCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <CitationModal item={item} triggerVariant="badge" />
            <Link
              href={`/showcase/${item.slug}`}
              className="text-[#0F294A] text-xs font-semibold hover:text-[#1E3A5F] inline-flex items-center gap-1 group/btn transition-colors"
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
