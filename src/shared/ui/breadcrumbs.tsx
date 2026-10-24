import { NavigationLink as Link } from '@/shared/navigation/navigation-link';

type BreadcrumbItem = { label: string; href?: string };

/** Pass the real page hierarchy, not the visitor's navigation history. */
export function Breadcrumbs({ items }: { items: readonly BreadcrumbItem[] }) {
  const trail = [{ label: 'Trang chủ', href: '/' }, ...items];
  return (
    <nav aria-label="Đường dẫn" className="mb-6 text-xs leading-5 text-[#1F2937]" data-breadcrumbs>
      <ol className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
        {trail.map((item, index) => {
          const current = index === trail.length - 1;
          return (
            <li key={`${index}-${item.label}`} className="flex min-w-0 max-w-full items-baseline gap-2">
              {index > 0 && <span aria-hidden="true" className="shrink-0 text-slate-400">/</span>}
              {!current && item.href ? (
                <Link href={item.href} className="min-w-0 break-words rounded-sm font-semibold transition-colors hover:text-[#153D67] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67]/30">{item.label}</Link>
              ) : <span aria-current={current ? 'page' : undefined} className="min-w-0 break-words">{item.label}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
