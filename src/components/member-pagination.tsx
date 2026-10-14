import Link from 'next/link';

const baseControlClass =
  'h-9 min-w-9 px-3 rounded-lg inline-flex items-center justify-center text-sm font-semibold border transition-colors';
const activePageClass = `${baseControlClass} bg-[#0F294A] text-white border-[#0F294A]`;
const inactivePageClass = `${baseControlClass} bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300`;
const disabledClass = `${baseControlClass} bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed`;

export function MemberPagination({
  page,
  totalPages,
  basePath,
}: {
  page: number;
  totalPages: number;
  basePath: string;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const hrefFor = (pageNumber: number) =>
    pageNumber === 1 ? basePath : `${basePath}?page=${pageNumber}`;

  return (
    <nav
      aria-label="Phân trang thành viên"
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

      {Array.from({ length: totalPages }, (_, index) => index + 1).map(
        (pageNumber) => (
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
