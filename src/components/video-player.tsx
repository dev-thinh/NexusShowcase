import { parseVideoEmbedUrl } from '@/lib/video-parser';

export function VideoPlayer({ url, title }: { url: string; title: string }) {
  const embedUrl = parseVideoEmbedUrl(url);
  if (!embedUrl) return null;

  return (
    <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-black">
      <iframe
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full border-0"
      />
    </div>
  );
}
