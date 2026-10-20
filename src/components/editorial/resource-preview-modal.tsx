'use client';

import type { SubmissionResource } from '@/lib/submission-types';
import { formatResourceMetadata } from '@/lib/resource-presentation';
import { Modal } from '@/components/ui/modal';

export function ResourcePreviewModal({ resource, onClose }: {
  resource: SubmissionResource | null;
  onClose: () => void;
}) {
  if (!resource) return null;
  const metadata = formatResourceMetadata(resource);

  return (
    <Modal isOpen onClose={onClose} title={resource.label} description={metadata.secondary}>
      {metadata.preview === 'image' && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={resource.url} alt={resource.label} className="max-h-[70vh] w-full object-contain" />
      )}
      {metadata.preview === 'pdf' && (
        <iframe src={resource.url} title={`Xem ${resource.label}`} className="h-[70vh] w-full rounded-md border border-slate-200" />
      )}
      {metadata.preview === 'link' ? (
        <a href={resource.url} target="_blank" rel="noreferrer" className="action-primary-detail inline-flex">
          Mở liên kết
        </a>
      ) : metadata.preview === 'download' ? (
        <a href={resource.url} download={resource.fileName} className="action-primary-detail inline-flex">
          Tải tài nguyên
        </a>
      ) : null}
    </Modal>
  );
}
