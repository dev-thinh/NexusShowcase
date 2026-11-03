'use client';

import { useId } from 'react';
import { Search } from 'lucide-react';
import { FilterDisclosure } from '@/shared/ui/filter-disclosure';
import { SearchForm } from '@/shared/ui/validated-form';
import { CustomSelect } from '@/shared/ui/custom-select';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';

type Props = {
  action: string;
  searchLabel: string;
  searchQuery: string;
  year?: number;
  sort: string;
  defaultSort: string;
  hasFilters: boolean;
};

export function PublicationFilters({ action, searchLabel, searchQuery, year, sort, defaultSort, hasFilters }: Props) {
  const id = useId();
  const count = Number(!!year) + Number(sort !== defaultSort);
  const inputClass = 'h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#153D67]';
  return (
    <SearchForm action={action} role="search" aria-label="Tìm kiếm và lọc công trình" className="publication-filters mb-6 grid grid-cols-2 items-end gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4 md:grid-cols-[minmax(0,1fr)_8rem_11rem_auto] md:gap-4">
      <div className="col-span-2 min-w-0 md:col-span-1">
        <label htmlFor={`${id}-search`} className="text-xs font-semibold text-slate-700">{searchLabel}</label>
        <div className="relative mt-2">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input key={searchQuery} id={`${id}-search`} type="search" name="q" defaultValue={searchQuery} aria-label="Từ khóa tìm kiếm" placeholder="Tiêu đề, tác giả, từ khóa..." className={`${inputClass} !pl-10`} />
        </div>
      </div>
      <FilterDisclosure count={count} className="publication-filter-fields">
        <div className="min-w-0">
          <label htmlFor={`${id}-year`} className="text-xs font-semibold text-slate-700">Năm<span className="sr-only md:not-sr-only"> thực hiện</span></label>
          <input key={year ?? ''} id={`${id}-year`} type="text" inputMode="numeric" name="year" defaultValue={year ?? ''} placeholder="Tất cả" className={`mt-2 ${inputClass}`} />
        </div>
        <div className="min-w-0">
          <label htmlFor={`${id}-sort`} className="text-xs font-semibold text-slate-700">Sắp xếp</label>
          <CustomSelect key={sort} id={`${id}-sort`} name="sort" defaultValue={sort} className="mt-2" options={[
            { value: 'featured', label: 'Ưu tiên nổi bật' },
            { value: 'newest', label: 'Mới nhất' },
            { value: 'oldest', label: 'Cũ nhất' },
            { value: 'title', label: 'Tiêu đề A–Z' },
          ]} />
        </div>
      </FilterDisclosure>
      <button type="submit" className="h-11 rounded-lg bg-brand-button px-5 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67] focus-visible:ring-offset-2">Áp dụng</button>
      {hasFilters && <div className="col-span-full flex flex-wrap items-center justify-between gap-x-3 border-t border-slate-200 pt-2">
        <p className="min-w-0 break-words text-xs text-slate-600">Kết quả lọc công trình{searchQuery ? ` với “${searchQuery}”` : ''}{year ? ` · Năm ${year}` : ''}</p>
        <Link href={action} className="inline-flex min-h-9 items-center text-xs font-semibold text-[#153D67] hover:underline">Xóa bộ lọc</Link>
      </div>}
    </SearchForm>
  );
}
