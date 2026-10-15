import React from 'react';
import { ItemType, ItemStatus, ContributorRole } from '@prisma/client';
import {
  FileText,
  Code2,
  Trophy,
  CheckCircle2,
  Clock,
  XCircle,
  FileEdit,
  Award,
  GraduationCap,
  Users,
} from 'lucide-react';
import { getItemStatusLabel } from '@/lib/item-status-presentation';

interface StatusBadgeProps {
  status: ItemStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const configs = {
    PUBLISHED: {
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      icon: CheckCircle2,
    },
    PENDING_REVIEW: {
      classes: 'bg-amber-50 text-amber-800 border-amber-200/80',
      icon: Clock,
    },
    REVISION_REQUESTED: {
      classes: 'bg-orange-50 text-orange-800 border-orange-200/80',
      icon: FileEdit,
    },
    READY_FOR_APPROVAL: {
      classes: 'bg-blue-50 text-blue-800 border-blue-200/80',
      icon: Clock,
    },
    REJECTED: {
      classes: 'bg-rose-50 text-rose-700 border-rose-200/80',
      icon: XCircle,
    },
    DRAFT: {
      classes: 'bg-slate-100 text-slate-700 border-slate-200/80',
      icon: FileEdit,
    },
    ARCHIVED: {
      classes: 'bg-slate-100 text-slate-600 border-slate-200/80',
      icon: FileEdit,
    },
  };

  const config = configs[status] || configs.DRAFT;
  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border shadow-2xs transition-colors ${sizeClasses} ${config.classes}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{getItemStatusLabel(status)}</span>
    </span>
  );
}

interface TypeBadgeProps {
  type: ItemType;
  size?: 'sm' | 'md';
}

export function TypeBadge({ type, size = 'md' }: TypeBadgeProps) {
  const configs = {
    RESEARCH_PAPER: {
      label: 'Bài báo nghiên cứu',
      classes: 'bg-blue-50/80 text-blue-900 border-blue-200/70',
      icon: FileText,
    },
    PROJECT: {
      label: 'Dự án công nghệ',
      classes: 'bg-indigo-50/80 text-indigo-900 border-indigo-200/70',
      icon: Code2,
    },
    ACHIEVEMENT: {
      label: 'Thành tích & Cống hiến',
      classes: 'bg-amber-50/80 text-amber-900 border-amber-200/70',
      icon: Trophy,
    },
  };

  const config = configs[type] || configs.RESEARCH_PAPER;
  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-semibold border shadow-2xs ${sizeClasses} ${config.classes}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{config.label}</span>
    </span>
  );
}

interface RoleBadgeProps {
  role: ContributorRole | string;
  customTitle?: string | null;
}

export function RoleBadge({ role, customTitle }: RoleBadgeProps) {
  const map: Record<string, { label: string; icon: any; color: string }> = {
    ADVISOR: {
      label: 'Người hướng dẫn / Giảng viên',
      icon: GraduationCap,
      color: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    FIRST_AUTHOR: {
      label: 'Tác giả chính (First Author)',
      icon: Award,
      color: 'bg-blue-50 text-blue-800 border-blue-200/80',
    },
    CO_FIRST_AUTHOR: {
      label: 'Đồng tác giả 1',
      icon: Award,
      color: 'bg-blue-50 text-blue-800 border-blue-200/80',
    },
    CO_AUTHOR: {
      label: 'Đồng tác giả',
      icon: Users,
      color: 'bg-slate-100 text-slate-700 border-slate-200',
    },
    CORRESPONDING_AUTHOR: {
      label: 'Tác giả liên hệ',
      icon: Users,
      color: 'bg-slate-100 text-slate-700 border-slate-200',
    },
    PROJECT_LEAD: {
      label: 'Trưởng nhóm dự án',
      icon: Award,
      color: 'bg-blue-50 text-blue-800 border-blue-200/80',
    },
    CONTRIBUTOR: {
      label: 'Thành viên đóng góp',
      icon: Users,
      color: 'bg-slate-100 text-slate-700 border-slate-200',
    },
    CUSTOM: {
      label: customTitle || 'Đóng góp',
      icon: Users,
      color: 'bg-slate-100 text-slate-700 border-slate-200',
    },
  };

  const current = map[role] || {
    label: customTitle || role,
    icon: Users,
    color: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  const Icon = current.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${current.color}`}
    >
      <Icon className="w-3 h-3" />
      <span>{current.label}</span>
    </span>
  );
}
