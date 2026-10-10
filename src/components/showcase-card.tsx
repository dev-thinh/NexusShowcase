import Link from 'next/link';
import { ItemType, ItemScope } from '@prisma/client';

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
    publishedYear: number;
    contributors: Contributor[];
  };
}

export function ShowcaseCard({ item }: ShowcaseCardProps) {
  const typeLabelMap = {
    RESEARCH_PAPER: 'Bài báo nghiên cứu',
    PROJECT: 'Dự án công nghệ',
    ACHIEVEMENT: 'Thành tích & Cống hiến',
  };

  const typeColorMap = {
    RESEARCH_PAPER: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    PROJECT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ACHIEVEMENT: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  return (
    <Link
      href={`/showcase/${item.slug}`}
      className="group flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-blue-300 transition-all overflow-hidden"
    >
      <div className="aspect-[16/9] w-full bg-slate-100 relative overflow-hidden flex items-center justify-center">
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="text-slate-400 font-medium text-sm flex items-center gap-1">
            Nexus Showcase
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${typeColorMap[item.type]}`}>
            {typeLabelMap[item.type]}
          </span>
          <span className="text-xs text-slate-500 font-medium">{item.publishedYear}</span>
        </div>

        <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
          {item.title}
        </h3>
        <p className="text-sm text-slate-600 mt-2 line-clamp-3 leading-relaxed flex-1">
          {item.summary}
        </p>

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-1 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">Tác giả:</span>
          <span className="truncate">
            {item.contributors
              .map((c) => c.user?.fullName || c.externalName)
              .filter(Boolean)
              .join(', ') || 'CLB Nexus'}
          </span>
        </div>
      </div>
    </Link>
  );
}
