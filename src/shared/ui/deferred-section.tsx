'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

/** Fetch each section independently after mount, without blocking route navigation. */
export function DeferredSection({ name, load, fallback }: { name: string; load: (signal: AbortSignal) => Promise<ReactNode>; fallback: ReactNode }) {
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
    void start();
    return cleanup;
  }, [start]);
  return <div data-deferred-section={name} data-state={state}>
    {state === 'ready' ? <div data-deferred-content>{content}</div> : state === 'error' ? <div role="alert" className="panel-public space-y-3">
      <p>Không tải được nội dung.</p>
      <button type="button" onClick={() => void start()} className="action-secondary-detail">Thử lại</button>
    </div> : fallback}
  </div>;
}
