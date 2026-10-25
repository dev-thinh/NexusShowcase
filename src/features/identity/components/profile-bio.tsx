'use client';

import { useEffect, useId, useRef, useState } from 'react';

export function ProfileBio({ text }: { text: string }) {
  const [overflows, setOverflows] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const measurement = useRef<HTMLParagraphElement>(null);
  const id = useId();
  const open = overflows && expanded;

  useEffect(() => {
    let disposed = false;
    const measure = () => {
      const element = measurement.current;
      if (disposed || !element || !element.clientWidth) return;
      const lineHeight = parseFloat(window.getComputedStyle(element).lineHeight) || 24;
      const clipped = element.scrollHeight > lineHeight + 1 || element.scrollWidth > element.clientWidth + 1;
      setOverflows(clipped);
      if (!clipped) setExpanded(false);
    };
    measure();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (measurement.current) observer?.observe(measurement.current);
    window.addEventListener('resize', measure);
    void document.fonts?.ready.then(measure);
    return () => { disposed = true; observer?.disconnect(); window.removeEventListener('resize', measure); };
  }, [text]);

  return <div className="relative mt-2" data-profile-bio="true">
    <p ref={measurement} aria-hidden="true" className="pointer-events-none invisible absolute inset-x-0 top-0 whitespace-pre-wrap break-words text-sm leading-6">{text}</p>
    <div className="flex items-start gap-2">
      <p id={id} className={`min-w-0 flex-1 text-sm leading-6 text-slate-600 ${open ? 'whitespace-pre-wrap break-words' : 'truncate'}`}>{text}</p>
      {overflows && <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setExpanded(!open)} className="shrink-0 rounded-sm text-sm font-semibold leading-6 text-[#153D67] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67]/30">{open ? 'Thu gọn' : 'Xem thêm'}</button>}
    </div>
  </div>;
}
