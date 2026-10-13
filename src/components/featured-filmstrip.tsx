'use client';

import React from 'react';
import Link from 'next/link';
import { ItemType, ItemScope } from '@prisma/client';
import { TypeBadge } from '@/components/ui/badge';
import {
  Sparkles,
  Pin,
  Calendar,
  Building2,
  Users,
  ArrowUpRight,
} from 'lucide-react';

export interface FeaturedItemData {
  id: string;
  title: string;
  slug: string;
  summary: string;
  thumbnailUrl?: string | null;
  type: ItemType;
  scope?: ItemScope | null;
  issuer?: string | null;
  publishedYear: number;
  isPinned: boolean;
  contributors: Array<{
    id: string;
    user?: { id: string; fullName: string } | null;
    externalName?: string | null;
    role: string;
  }>;
}

interface FeaturedFilmstripProps {
  items: FeaturedItemData[];
}

export function FeaturedFilmstrip({ items }: FeaturedFilmstripProps) {
  if (!items || items.length === 0) return null;

  const isShortList = items.length < 4;

  // Ensure the track has at least 8 items so it spans >= 3000px,
  // guaranteeing that Track 1 + Track 2 seamlessly fill any screen resolution without empty spots
  const trackItems = React.useMemo(() => {
    if (items.length === 0) return [];
    let list = [...items];
    while (list.length < 8) {
      list = [...list, ...items];
    }
    return list;
  }, [items]);

  // Calculate scroll duration based on item count for a consistent, smooth scrolling speed (~72px/s)
  const scrollDuration = React.useMemo(() => {
    // 374px = 350px card width + 24px gap
    return Math.max(28, Math.round((trackItems.length * 374) / 72));
  }, [trackItems.length]);

  return (
    <section className="py-10 sm:py-14 bg-[#e8edf5] border-y border-slate-200 relative z-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#0F294A] text-xs font-bold border border-slate-200 shadow-2xs mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>TIÊU ĐIỂM HỌC THUẬT</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Công Trình Nghiên Cứu &amp; Sáng Tạo Nổi Bật
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md leading-relaxed font-medium">
            Công trình nghiên cứu khoa học và sáng tạo công nghệ tiêu biểu của thành viên Nexus.
          </p>
        </div>
      </div>

      {isShortList ? (
        /* Static Grid View when fewer than 4 items */
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-center">
            {items.map((item) => (
              <FilmstripCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      ) : (
        /* 100% Seamless Infinite Filmstrip Reel View */
        <div className="relative w-full group py-2 overflow-hidden">
          {/* Edge Gradient Fading Masks matching bg-[#e8edf5] */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-[#e8edf5] via-[#e8edf5]/70 to-transparent z-20" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-[#e8edf5] via-[#e8edf5]/70 to-transparent z-20" />

          {/* Marquee Track with ample vertical clearance for zoom scale */}
          <div className="flex overflow-hidden py-8 scrollbar-none select-none">
            <div
              className="flex shrink-0 gap-6 pr-6 animate-filmstrip-roll group-hover:[animation-play-state:paused] will-change-transform py-2"
              style={{ animationDuration: `${scrollDuration}s` }}
            >
              {trackItems.map((item, idx) => (
                <FilmstripCard key={`track1-${item.id}-${idx}`} item={item} />
              ))}
            </div>
            <div
              className="flex shrink-0 gap-6 pr-6 animate-filmstrip-roll group-hover:[animation-play-state:paused] will-change-transform py-2"
              style={{ animationDuration: `${scrollDuration}s` }}
              aria-hidden="true"
            >
              {trackItems.map((item, idx) => (
                <FilmstripCard key={`track2-${item.id}-${idx}`} item={item} />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function FilmstripCard({ item }: { item: FeaturedItemData }) {
  const authorNames = item.contributors
    .map((c) => c.user?.fullName || c.externalName)
    .filter(Boolean);
  const primaryAuthor = authorNames[0] || 'CLB Nexus';
  const remainingCount = authorNames.length > 1 ? authorNames.length - 1 : 0;

  return (
    <Link
      href={`/showcase/${item.slug}`}
      className="group/card block w-[310px] sm:w-[350px] shrink-0 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 hover:scale-[1.03] -translate-y-0.5 hover:-translate-y-1 transition-all duration-300 ease-out overflow-hidden relative z-10 hover:z-30 flex flex-col h-[380px]"
    >
      {/* Thumbnail Aspect 16/9 */}
      <div className="aspect-[16/9] w-full bg-slate-100 relative overflow-hidden border-b border-slate-100 shrink-0">
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-white shadow-2xs flex items-center justify-center text-[#0F294A] font-bold mb-1 border border-slate-200">
              NX
            </div>
            <span className="text-[11px] font-semibold text-slate-500">Nexus Academic Showcase</span>
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute top-2.5 left-2.5">
          <TypeBadge type={item.type} size="sm" />
        </div>

        {/* Pin or New Badge */}
        <div className="absolute top-2.5 right-2.5">
          {item.isPinned ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-600 text-white shadow-xs">
              <Pin className="w-3 h-3 fill-white" />
              <span>Được ghim</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 text-slate-700 shadow-2xs border border-slate-200">
              <span>Mới nhất</span>
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex flex-col flex-1 justify-between">
        <div>
          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
            <span className="flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {item.publishedYear}
            </span>
            {item.issuer && (
              <span className="flex items-center gap-1 font-medium truncate max-w-[190px]" title={item.issuer}>
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {item.issuer}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-slate-900 group-hover/card:text-[#0F294A] transition-colors line-clamp-2 leading-snug mb-2">
            {item.title}
          </h3>

          {/* Summary Excerpt */}
          <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
            {item.summary}
          </p>
        </div>

        {/* Footer Author & CTA */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 truncate max-w-[210px]">
            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-700 truncate">{primaryAuthor}</span>
            {remainingCount > 0 && (
              <span className="text-slate-400 shrink-0">+{remainingCount}</span>
            )}
          </div>

          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0F294A] group-hover/card:translate-x-0.5 transition-transform">
            <span>Chi tiết</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
