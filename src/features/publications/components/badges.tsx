import { getItemStatusLabel } from '@/features/publications/model/status';
import { ItemStatus, ItemType } from '@prisma/client';
import {
CheckCircle2,
Clock,
FileEdit,
XCircle
} from 'lucide-react';

interface StatusBadgeProps {
  status: ItemStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const configs = {
    PUBLISHED: {
      classes: 'bg-[#FFFFFF] text-[#1F2937] border-slate-200',
      icon: CheckCircle2,
    },
    PENDING_REVIEW: {
      classes: 'bg-[#FFFFFF] text-[#1F2937] border-slate-200',
      icon: Clock,
    },
    REVISION_REQUESTED: {
      classes: 'bg-[#FFFFFF] text-[#1F2937] border-slate-200',
      icon: FileEdit,
    },
    READY_FOR_APPROVAL: {
      classes: 'bg-[#FFFFFF] text-[#1F2937] border-slate-200',
      icon: Clock,
    },
    REJECTED: {
      classes: 'bg-[#FFFFFF] text-[#1F2937] border-slate-200',
      icon: XCircle,
    },
    DRAFT: {
      classes: 'bg-[#FFFFFF] text-[#1F2937] border-slate-200',
      icon: FileEdit,
    },
    ARCHIVED: {
      classes: 'bg-[#FFFFFF] text-[#1F2937] border-slate-200',
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
  variant?: 'subtle' | 'outline';
}

export function TypeBadge({ type, size = 'sm', variant = 'subtle' }: TypeBadgeProps) {
  const isRobotics = type === 'PROJECT';
  const label = isRobotics ? 'Robotics & IoT' : 'Nghiên cứu khoa học';
  const classes = variant === 'outline'
    ? 'bg-transparent text-[#1F2937] border-slate-200'
    : isRobotics
    ? 'bg-[#FFFFFF] text-[#1F2937] border-slate-200'
    : 'bg-[#FFFFFF] text-[#1F2937] border-slate-200';
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-md font-semibold border ${variant === 'subtle' ? 'shadow-2xs' : ''} ${sizeClasses} ${classes}`}>
      {label}
    </span>
  );
}
