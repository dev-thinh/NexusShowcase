import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { SearchForm } from '@/shared/ui/validated-form';
import { FilterDisclosure } from '@/shared/ui/filter-disclosure';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';

type Option = { value: string; label: string; count: number };
export function ManagementFilters({ action, query, searchLabel, placeholder, searchId, filterName, filterValue = 'ALL', filterLabel, options = [], actions }: {
  action: string; query: string; searchLabel: string; placeholder: string; searchId?: string;
  filterName?: string; filterValue?: string; filterLabel?: string; options?: Option[]; actions?: ReactNode;
}) {
  const active = !!query || filterValue !== 'ALL';
  return <div className="mb-4">
    <div className="management-filter-panel rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4">
    <SearchForm action={action} role="search" aria-label="Tìm kiếm và lọc" className="grid grid-cols-2 items-end gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:gap-4">
      <div className="col-span-2 min-w-0 md:col-span-1">
        <label className="block text-xs font-semibold text-slate-700">
          {searchLabel}
          <span className="relative mt-2 block"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input id={searchId} key={query} name="q" type="search" defaultValue={query} maxLength={200} placeholder={placeholder} className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[#153D67]" /></span>
        </label>
      </div>
      {filterName && <input type="hidden" name={filterName} value={filterValue} />}
      {options.length > 0 && <FilterDisclosure count={Number(filterValue !== 'ALL')}>
        <div role="group" aria-label={filterLabel} className="flex min-w-0 flex-wrap gap-2 md:order-3 md:col-span-full md:border-t md:border-slate-200 md:pt-3">
          {options.map(option => <Link key={option.value} href={`${action}?${new URLSearchParams({ [filterName!]: option.value, ...(query ? { q: query } : {}) })}`} scroll={false} aria-current={filterValue === option.value ? 'page' : undefined} className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67] ${filterValue === option.value ? 'border-[#153D67] bg-[#153D67] font-semibold text-white' : 'border-slate-200 bg-white text-slate-600 hover:text-[#153D67]'}`}>{option.label}<span className="text-xs tabular-nums">{option.count}</span></Link>)}
        </div>
      </FilterDisclosure>}
      <button type="submit" className={`h-11 rounded-lg bg-brand-button px-5 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67] focus-visible:ring-offset-2 ${options.length ? '' : 'col-span-2 md:col-span-1'}`}>Áp dụng</button>
    </SearchForm>
    {active && <div className="mt-3 border-t border-slate-200 pt-3">
      <Link href={action} className="inline-flex min-h-11 items-center text-xs font-semibold text-[#153D67] hover:underline">Xóa bộ lọc</Link>
    </div>}
    </div>
    {actions && <div role="group" aria-label="Thao tác quản lý" className="management-filter-actions mt-3 flex flex-wrap justify-end gap-2">{actions}</div>}
  </div>;
}
