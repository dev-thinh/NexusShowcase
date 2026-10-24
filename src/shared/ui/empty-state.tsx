import { Inbox, LucideIcon } from 'lucide-react';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onActionClick?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  actionHref,
  onActionClick,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`panel-nested flex flex-col items-center justify-center p-6 sm:p-10 border-dashed border-slate-200 text-center transition-all ${className}`}
    >
      <Icon className="w-8 h-8 text-[#1F2937] mb-2.5" />
      <h3 className="text-sm sm:text-base font-semibold text-[#1F2937] tracking-tight">
        {title}
      </h3>
      <p className="text-xs text-[#1F2937] max-w-sm mx-auto mt-1 leading-relaxed">
        {description}
      </p>

      {actionLabel && (
        <div className="mt-4">
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#1F2937] hover:text-[#1F2937] bg-white hover:bg-[#FFFFFF] border border-slate-200 hover:border-slate-200 transition-all cursor-pointer shadow-2xs"
            >
              <span>{actionLabel}</span>
            </Link>
          ) : onActionClick ? (
            <button
              type="button"
              onClick={onActionClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#1F2937] hover:text-[#1F2937] bg-white hover:bg-[#FFFFFF] border border-slate-200 hover:border-slate-200 transition-all cursor-pointer shadow-2xs"
            >
              <span>{actionLabel}</span>
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
