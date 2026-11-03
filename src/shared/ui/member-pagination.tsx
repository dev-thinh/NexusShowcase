import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PaginationNavigation } from '@/shared/ui/pagination-navigation';
import { PaginationJump } from '@/shared/ui/pagination-jump';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';

const baseControlClass =
  'h-11 min-w-11 px-3 sm:h-9 sm:min-w-9 rounded-lg inline-flex items-center justify-center text-sm font-semibold border transition-colors';
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
    <PaginationNavigation page={page}
      aria-label={ariaLabel}
      className="flex w-full max-w-full flex-wrap items-center justify-center gap-2"
    >
      {page === 1 ? (
        <span aria-disabled="true" className={disabledClass}>
          <ChevronLeft aria-hidden="true" className="h-4 w-4" /><span className="sr-only">Trang trước</span>
        </span>
      ) : (
        <Link href={hrefFor(page - 1)} scroll={false} className={inactivePageClass}>
          <ChevronLeft aria-hidden="true" className="h-4 w-4" /><span className="sr-only">Trang trước</span>
        </Link>
      )}

      <PaginationJump page={page} totalPages={totalPages} basePath={basePath} pageParam={pageParam} className="flex min-w-0" />
      {page === totalPages ? (
        <span aria-disabled="true" className={disabledClass}>
          <ChevronRight aria-hidden="true" className="h-4 w-4" /><span className="sr-only">Trang sau</span>
        </span>
      ) : (
        <Link href={hrefFor(page + 1)} scroll={false} className={inactivePageClass}>
          <ChevronRight aria-hidden="true" className="h-4 w-4" /><span className="sr-only">Trang sau</span>
        </Link>
      )}
    </PaginationNavigation>
  );
}


export function PaginationFooter({ page, totalPages, pageSize, basePath, ariaLabel, itemLabel = 'công trình', children }: {
  page: number;
  totalPages: number;
  pageSize: number;
  basePath: string;
  ariaLabel?: string;
  children?: import('react').ReactNode;
  itemLabel?: string;
}) {
  return <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6" data-pagination-footer>
    <p aria-live="polite" className="text-xs leading-6 text-[#1F2937]">Trang {page} / {totalPages} · {pageSize} {itemLabel} mỗi trang{children && <span className="ml-2">· {children}</span>}</p>
    <MemberPagination page={page} totalPages={totalPages} basePath={basePath} ariaLabel={ariaLabel} />
  </div>;
}
