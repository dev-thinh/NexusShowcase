/** Abstracts always retain the same two-line region, independent of conference metadata. */
export function PublicationCardDescription({ summary, className = '' }: { summary: string; className?: string }) {
  return <div data-card-description className={`h-12 min-w-0 shrink-0 overflow-hidden text-sm leading-6 text-[#1F2937] ${className}`}>
    <p className="line-clamp-2 break-words">{summary}</p>
  </div>;
}
