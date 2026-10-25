'use client';

import { ImageIcon } from 'lucide-react';
import { useEffect, useRef, useState, type ImgHTMLAttributes, type ReactNode } from 'react';

type MediaImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & { src?: string | null; optimized?: boolean; fallback?: ReactNode };

export function MediaImage({ src, alt = '', className = '', style, width, height, onError, optimized = false, fallback, ...props }: MediaImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    // A failed SSR image can finish before React attaches its error handler.
    if (src && imageRef.current?.complete && imageRef.current.naturalWidth === 0) setFailedSrc(src);
  }, [src]);
  if (!src || failedSrc === src) {
    if (fallback !== undefined) return fallback;
    return <span data-media-placeholder="true" role="img" aria-label={alt ? `${alt}: Chưa có ảnh` : 'Chưa có ảnh'} className={`inline-flex min-h-14 flex-col items-center justify-center gap-1 overflow-hidden border border-slate-200 bg-slate-50 text-slate-500 ${className}`} style={{ width: typeof width === 'number' ? `min(100%, ${width}px)` : width, aspectRatio: width && height ? `${width} / ${height}` : undefined, ...style }}>
      <ImageIcon aria-hidden="true" className="h-5 w-5 shrink-0" />
      <span aria-hidden="true" className="max-w-full text-center text-xs leading-tight">Chưa có ảnh</span>
    </span>;
  }
  if (optimized && typeof width === 'number' && typeof height === 'number') {
    // Same-origin derivatives carry the reader's cookies, unlike /_next/image.
    const widths = [96, 128, 256, 384, 640, 1080];
    const thumbnail = (size: number) => `${src}${src.includes('?') ? '&' : '?'}w=${size}`;
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} ref={imageRef} src={thumbnail(widths.find(size => size >= width) ?? 1080)} srcSet={widths.map(size => `${thumbnail(size)} ${size}w`).join(', ')} alt={alt} className={className} style={style} width={width} height={height} decoding="async" onError={event => { setFailedSrc(src); onError?.(event); }} />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} ref={imageRef} src={src} alt={alt} className={className} style={style} width={width} height={height} onError={event => { setFailedSrc(src); onError?.(event); }} />;
}
