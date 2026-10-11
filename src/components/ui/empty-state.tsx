import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import Link from 'next/link';

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
      className={`flex flex-col items-center justify-center p-8 sm:p-12 bg-white rounded-2xl border border-dashed border-slate-300 text-center transition-all ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mb-3.5 shadow-2xs">
        <Icon className="w-6 h-6 text-slate-500" />
      </div>
      <h3 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight font-serif">
        {title}
      </h3>
      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
        {description}
      </p>

      {actionLabel && (
        <div className="mt-5">
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#0F294A] bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer shadow-2xs"
            >
              <span>{actionLabel}</span>
            </Link>
          ) : onActionClick ? (
            <button
              type="button"
              onClick={onActionClick}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#0F294A] bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer shadow-2xs"
            >
              <span>{actionLabel}</span>
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
