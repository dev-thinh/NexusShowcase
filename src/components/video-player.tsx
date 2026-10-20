'use client';

import { useState } from 'react';
import { parseVideoEmbedUrl } from '@/lib/video-parser';
import { Loader2 } from 'lucide-react';

export function VideoPlayer({ url, title }: { url: string; title: string }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const embedUrl = parseVideoEmbedUrl(url);

  if (!embedUrl) {
    let safe = false;
    try { safe = ['http:', 'https:'].includes(new URL(url).protocol); } catch {}
    return safe ? <a href={url} target="_blank" rel="noopener noreferrer" className="action-secondary-detail">Mở video: {title}</a> : null;
  }

  return (
    <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-slate-200 shadow-xs bg-slate-950">
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          <span className="text-xs font-semibold text-slate-300 font-sans">Đang tải video demo...</span>
        </div>
      )}

      <iframe
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-full border-0 transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
