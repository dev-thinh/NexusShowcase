import type { ReactNode } from 'react';
import type { ItemType } from '@prisma/client';
import { TypeBadge } from './badges';

export function PublicationCardMeta({ type, year, children }: {
  type: ItemType; year: number | null; children?: ReactNode;
}) {
  return <div className="publication-card-meta">
    <div className="publication-card-meta__labels">
      <TypeBadge type={type} size="sm" variant="outline" />
      {year && <span aria-label={`Năm ${year}`} className="whitespace-nowrap text-xs">{year}</span>}
    </div>
    {children && <div className="publication-card-meta__controls">{children}</div>}
  </div>;
}
