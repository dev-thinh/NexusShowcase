'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

/** Do not invoke the server loader until this section approaches the viewport. */
export function DeferredSection({ name, load, fallback }: { name: string; load: (signal: AbortSignal) => Promise<ReactNode>; fallback: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const active = useRef(false);
  const inFlight = useRef(false);
  const request = useRef<AbortController | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [content, setContent] = useState<ReactNode>(null);
  const start = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    const controller = new AbortController();
    request.current = controller;
    setState('loading');
    try {
      const result = await load(controller.signal);
      if (active.current && request.current === controller) { setContent(result); setState('ready'); }
    } catch { if (active.current && request.current === controller) setState('error'); }
    finally { if (request.current === controller) { inFlight.current = false; request.current = null; } }
  }, [load]);
  useEffect(() => {
    active.current = true;
    const cleanup = () => {
      active.current = false;
      request.current?.abort();
      request.current = null;
      inFlight.current = false;
    };
    if (!('IntersectionObserver' in window)) void start();
    else {
      const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); void start(); }
      }, { rootMargin: '200px 0px' });
      if (root.current) observer.observe(root.current);
      return () => { cleanup(); observer.disconnect(); };
    }
    return cleanup;
  }, [start]);
  return <div ref={root} data-deferred-section={name} data-state={state}>
    {state === 'ready' ? <div data-deferred-content>{content}</div> : state === 'error' ? <div role="alert" className="panel-public space-y-3">
      <p>Không tải được nội dung.</p>
      <button type="button" onClick={() => void start()} className="action-secondary-detail">Thử lại</button>
    </div> : fallback}
  </div>;
}
