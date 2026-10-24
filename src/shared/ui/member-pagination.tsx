import { paginationWindow } from '@/shared/lib/pagination';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';

const baseControlClass =
  'h-9 min-w-9 px-3 rounded-lg inline-flex items-center justify-center text-sm font-semibold border transition-colors';
const activePageClass = `${baseControlClass} bg-brand-button text-white border-slate-200`;
const inactivePageClass = `${baseControlClass} bg-white text-[#1F2937] border-slate-200 hover:bg-[#FFFFFF] hover:border-slate-200`;
const disabledClass = `${baseControlClass} bg-[#FFFFFF] text-[#1F2937] border-slate-200 cursor-not-allowed`;

export function MemberPagination({
  page,
  totalPages,
  basePath,
  ariaLabel = 'Phân trang thành viên',
  pageParam = 'page',
}: {
  page: number;
  totalPages: number;
  basePath: string;
  ariaLabel?: string;
  pageParam?: string;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const hrefFor = (pageNumber: number) => {
    const [pathname, query] = basePath.split('?');
    const params = new URLSearchParams(query);
    if (pageNumber === 1) params.delete(pageParam);
    else params.set(pageParam, String(pageNumber));
    return `${pathname}${params.size ? `?${params}` : ''}`;
  };

  return (
    <nav
      aria-label={ariaLabel}
      className="flex items-center gap-1.5 flex-wrap"
    >
      {page === 1 ? (
        <span aria-disabled="true" className={disabledClass}>
          Trang trước
        </span>
      ) : (
        <Link href={hrefFor(page - 1)} className={inactivePageClass}>
          Trang trước
        </Link>
      )}

      {paginationWindow(page, totalPages).map(
        (pageNumber, index) => pageNumber === 'gap' ? <span key={`gap-${index}`} aria-hidden="true" className="px-1 text-[#1F2937]">…</span> : (
          <Link
            key={pageNumber}
            href={hrefFor(pageNumber)}
            aria-current={pageNumber === page ? 'page' : undefined}
            className={
              pageNumber === page ? activePageClass : inactivePageClass
            }
          >
            {pageNumber}
          </Link>
        ),
      )}

      {page === totalPages ? (
        <span aria-disabled="true" className={disabledClass}>
          Trang sau
        </span>
      ) : (
        <Link href={hrefFor(page + 1)} className={inactivePageClass}>
          Trang sau
        </Link>
      )}
    </nav>
  );
}
