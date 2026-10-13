'use client';

import { useState } from 'react';
import { parseVideoEmbedUrl } from '@/lib/video-parser';
import { Loader2 } from 'lucide-react';

export function VideoPlayer({ url, title }: { url: string; title: string }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const embedUrl = parseVideoEmbedUrl(url);

  if (!embedUrl) return null;

  return (
    <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-slate-200 shadow-xs bg-slate-950">
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          <span className="text-xs font-medium text-slate-300 font-sans">Đang tải video demo...</span>
        </div>
      )}

      <iframe
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
