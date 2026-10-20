import type { SubmissionResource } from '@/lib/submission-types';

export function ResourceLinks({ resources }: { resources: SubmissionResource[] }) {
  return <div className="flex flex-col items-stretch gap-2">
    {resources.map((resource, index) => (
      <a key={`${resource.url}-${index}`} href={resource.url.startsWith('/uploads/resources/') ? `${resource.url}?name=${encodeURIComponent(resource.fileName || resource.label)}` : resource.url} target="_blank" rel="noopener noreferrer"
        className="action-secondary-detail !h-auto min-h-10 justify-start whitespace-normal break-words py-2">
        {resource.label}
      </a>
    ))}
  </div>;
}
