import type { SubmissionResource } from '@/lib/submission-types';

function formatFileSize(bytes?: number) {
  if (bytes === undefined) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatResourceMetadata(resource: SubmissionResource): {
  primary: string;
  secondary: string;
  preview: 'image' | 'pdf' | 'link' | 'download';
} {
  if (resource.kind === 'LINK') {
    let hostname = 'Liên kết ngoài';
    try { hostname = new URL(resource.url).hostname.replace(/^www\./, ''); } catch {}
    return { primary: resource.label, secondary: hostname, preview: 'link' };
  }

  const extension = resource.mimeType === 'application/pdf' || resource.url.toLowerCase().endsWith('.pdf')
    ? 'PDF'
    : resource.mimeType?.split('/')[1]?.toUpperCase();
  const secondary = [resource.fileName, extension, formatFileSize(resource.fileSize)]
    .filter(Boolean)
    .join(' · ');
  const preview = resource.kind === 'IMAGE'
    ? 'image'
    : extension === 'PDF' ? 'pdf' : 'download';
  return { primary: resource.label, secondary: secondary || 'Tệp đính kèm', preview };
}
