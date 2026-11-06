
'use client';

import { useI18n } from '@/shared/i18n/provider';
import type { ReactNode } from 'react';
import type { ItemType } from '@prisma/client';
import { TypeBadge } from './badges';

export function PublicationCardMeta({ type, year, children }: {
  type: ItemType; year: number | null; children?: ReactNode;
}) {
  const { t: tr } = useI18n();

  return <div className="publication-card-meta">
    <div className="publication-card-meta__labels">
      <TypeBadge type={type} size="sm" variant="outline" />
      {year && <span aria-label={tr("Năm {0}", year)} className="whitespace-nowrap text-xs">{year}</span>}
    </div>
    {children && <div className="publication-card-meta__controls">{children}</div>}
  </div>;
}
