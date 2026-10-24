import type { ReactNode } from 'react';

export function ResearchSectionHeading({ children }: { children?: ReactNode }) {
  return <div className="home-section-heading">
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">Hướng nghiên cứu</p>
    <div className="mt-2 flex items-center justify-between gap-4">
      <h2 id="research-directions-title" className="max-w-3xl text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
        Từ nghiên cứu đến hệ thống thông minh.
      </h2>
      {children && <div className="flex shrink-0 flex-wrap items-center justify-end gap-3">{children}</div>}
    </div>
  </div>;
}
