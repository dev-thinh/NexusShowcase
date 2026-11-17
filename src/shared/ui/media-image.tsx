'use client';

import { useI18n } from '@/shared/i18n/provider';
import { ImageIcon } from 'lucide-react';
import { useEffect, useRef, useState, type ImgHTMLAttributes, type ReactNode } from 'react';

type MediaImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & { src?: string | null; optimized?: boolean; fallback?: ReactNode; showPlaceholderLabel?: boolean };

export function MediaImage({ src, alt = '', className = '', style, width, height, onError, optimized, fallback, showPlaceholderLabel, ...props }: MediaImageProps) {
  const { t: tr } = useI18n();

  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [retryState, setRetryState] = useState<{ src: string | null; count: number }>({ src: null, count: 0 });
  const retryCount = retryState.src === src ? retryState.count : 0;
  const imageRef = useRef<HTMLImageElement>(null);
  const handleFailure = (targetSrc: string, event?: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (retryCount < 2) {
      setRetryState({ src: targetSrc, count: retryCount + 1 });
      return;
    }
    setFailedSrc(targetSrc);
    if (event) onError?.(event);
  };
  useEffect(() => {
    // A failed SSR image can finish before React attaches its error handler.
    if (src && imageRef.current?.complete && imageRef.current.naturalWidth === 0) handleFailure(src);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);
  if (!src || failedSrc === src) {
    if (fallback !== undefined) return fallback;
    const isCompact = (typeof width === 'number' && width <= 180) || (typeof height === 'number' && height <= 135);
    const shouldShowLabel = showPlaceholderLabel ?? !isCompact;
    return <span data-media-placeholder="true" role="img" aria-label={alt ? tr("{0}: Chưa có ảnh", alt) : tr("Chưa có ảnh")} className={`inline-flex min-h-14 flex-col items-center justify-center gap-1 overflow-hidden border border-slate-200 bg-slate-50 text-slate-500 ${className}`} style={{ width: typeof width === 'number' ? `min(100%, ${width}px)` : width, aspectRatio: width && height ? `${width} / ${height}` : undefined, ...style }}>
      <ImageIcon aria-hidden="true" className="h-5 w-5 shrink-0" />
      {shouldShowLabel && <span aria-hidden="true" className="media-placeholder__label max-w-full text-center text-xs leading-tight">{tr("Chưa có ảnh")}</span>}
    </span>;
  }
  const useThumbnail = optimized ?? src.startsWith('/uploads/thumbnails/');
  if (useThumbnail) {
    // Same-origin derivatives carry the reader's cookies, unlike /_next/image.
    const widths = [96, 128, 256, 384, 640, 1080];
    const targetWidth = typeof width === 'number' ? width : 1080;
    const thumbnail = (size: number) => `${src}${src.includes('?') ? '&' : '?'}w=${size}${retryCount ? `&retry=${retryCount}` : ''}`;
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} key={retryCount || undefined} draggable={false} ref={imageRef} src={thumbnail(widths.find(size => size >= targetWidth) ?? 1080)} srcSet={widths.map(size => `${thumbnail(size)} ${size}w`).join(', ')} sizes={props.sizes ?? (typeof width === 'number' ? undefined : '(max-width: 1024px) 100vw, 896px')} alt={alt} className={className} style={style} width={width} height={height} decoding="async" onError={event => handleFailure(src, event)} />;
  }
  const retrySrc = retryCount ? `${src}${src.includes('?') ? '&' : '?'}retry=${retryCount}` : src;
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} key={retryCount || undefined} draggable={false} ref={imageRef} src={retrySrc} alt={alt} className={className} style={style} width={width} height={height} onError={event => handleFailure(src, event)} />;
}
