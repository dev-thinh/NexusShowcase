'use client';

import { Loader2, RefreshCw } from 'lucide-react';
import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';

export type MomentPhotoOrigin = {
  left: number;
  top: number;
  width: number;
  height: number;
};

const prefetched = new Map<string, HTMLImageElement>();
const enlargement = (src: string) => `${src}${src.includes('?') ? '&' : '?'}w=1080`;

/** Warm only photos the visitor is approaching, then the neighboring photos. */
export function prefetchMomentPhoto(src: string) {
  if (typeof Image === 'undefined' || prefetched.has(src)) return;
  const image = new Image();
  image.decoding = 'async';
  image.fetchPriority = 'low';
  image.onerror = () => { prefetched.delete(src); };
  prefetched.set(src, image);
  if (prefetched.size > 24) prefetched.delete(prefetched.keys().next().value!);
  image.src = enlargement(src);
}

export function MomentPhotoViewer({ src, alt, previewSrc, ratio = 4 / 3, origin, onReady }: {
  src: string;
  alt: string;
  previewSrc: string;
  ratio?: number;
  origin: MomentPhotoOrigin | null;
  onReady: () => void;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const image = useRef<HTMLImageElement>(null);
  const live = useRef(false);
  const readyCallback = useRef(onReady);
  readyCallback.current = onReady;
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);

  async function reveal(element: HTMLImageElement) {
    try { await element.decode(); } catch { /* Some browsers reject decode for an already displayed image. */ }
    if (!live.current || !element.isConnected || !element.naturalWidth) return;
    setStatus('ready');
    readyCallback.current();
  }

  useLayoutEffect(() => {
    live.current = true;
    const element = image.current;
    if (element?.complete) {
      if (element.naturalWidth) void reveal(element);
      else setStatus('error');
    }
    return () => { live.current = false; };
  }, [attempt]);

  useLayoutEffect(() => {
    const panel = stage.current?.closest<HTMLElement>('.modal-panel');
    if (!origin || !panel || typeof panel.animate !== 'function' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const bounds = panel.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const transform = `translate(${origin.left - bounds.left}px, ${origin.top - bounds.top}px) scale(${origin.width / bounds.width}, ${origin.height / bounds.height})`;
    const animation = panel.animate([
      { transformOrigin: 'top left', transform, opacity: 0.35 },
      { transformOrigin: 'top left', transform: 'translate(0px, 0px) scale(1)', opacity: 1 },
    ], { duration: 520, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
    return () => animation.cancel();
  }, [origin]);

  return <div className="moments-viewer">
    <div ref={stage} className="moments-viewer__stage" data-loading={status === 'loading' ? 'true' : 'false'} data-ready={status === 'ready' ? 'true' : 'false'} style={{ '--viewer-ratio': ratio } as CSSProperties}>
      {/* Reuse the exact thumbnail resource already decoded in the photo strip. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="moments-viewer__preview" src={previewSrc} alt="" aria-hidden="true" decoding="async" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img key={attempt} ref={image} className="moments-viewer__image" src={enlargement(src)} alt={alt} decoding="async" loading="eager" fetchPriority="high" onLoad={event => void reveal(event.currentTarget)} onError={() => setStatus('error')} />
    </div>
    {status === 'loading' && <div className="moments-viewer__feedback" role="status"><Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /><span>Đang tải ảnh rõ nét</span></div>}
    {status === 'error' && <div className="moments-viewer__feedback moments-viewer__feedback--error" role="alert"><span>Không tải được ảnh rõ nét</span><button type="button" className="inline-flex min-h-11 items-center gap-2 underline underline-offset-2" onClick={() => { setStatus('loading'); setAttempt(value => value + 1); }}><RefreshCw className="h-4 w-4" aria-hidden="true" />Tải lại ảnh</button></div>}
  </div>;
}
