import type { ReactNode } from 'react';

export function ResearchSectionHeading({ children }: { children?: ReactNode }) {
  return <div className="home-section-heading">
    <p className="home-section-eyebrow">Hướng nghiên cứu</p>
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h2 id="research-directions-title" className="home-section-title">
        Nghiên cứu để ứng dụng
      </h2>
      {children && <div className="ml-auto flex shrink-0 flex-wrap items-center gap-3">{children}</div>}
    </div>
  </div>;
}
