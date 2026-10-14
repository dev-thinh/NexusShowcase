import type { LucideIcon } from 'lucide-react';

export function MemberSectionHeading({
  icon: Icon,
  title,
  count,
  tone,
}: {
  icon: LucideIcon;
  title: string;
  count: number;
  tone: string;
}) {
  return (
    <div className="heading-gutter flex items-center gap-2 mb-4">
      <Icon
        aria-hidden="true"
        className={`heading-gutter-icon w-5 h-5 sm:w-6 sm:h-6 ${tone}`}
      />
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      <span className="px-2 py-0.5 rounded-md border border-slate-200 bg-white text-xs font-bold text-slate-600">
        {count}
      </span>
    </div>
  );
}
