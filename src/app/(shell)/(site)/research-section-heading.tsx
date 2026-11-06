
'use client';

import { useI18n } from '@/shared/i18n/provider';
import { HomeText } from '@/features/publications/components/home-content-provider';
import type { ReactNode } from 'react';

export function ResearchSectionHeading({ children }: { children?: ReactNode }) {
  const { t: tr } = useI18n();

  return <div className="home-section-heading">
    <p className="home-section-eyebrow"><HomeText field="researchEyebrow">{tr("Hướng nghiên cứu")}</HomeText></p>
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h2 id="research-directions-title" className="home-section-title">
        <HomeText field="researchTitle">{tr("Nghiên cứu để ứng dụng")}</HomeText>
      </h2>
      {children && <div className="ml-auto flex shrink-0 flex-wrap items-center gap-3">{children}</div>}
    </div>
  </div>;
}
