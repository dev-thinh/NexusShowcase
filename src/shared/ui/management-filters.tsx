import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { SearchForm } from '@/shared/ui/validated-form';
import { CustomSelect } from '@/shared/ui/custom-select';
import { FilterDisclosure } from '@/shared/ui/filter-disclosure';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';

type Option = { value: string; label: string; count?: number };
type Filter = { name: string; value: string; label: string; options: Option[] };
export function ManagementFilters({ action, query, searchLabel, placeholder, searchId, filterName, filterValue = 'ALL', filterLabel, options = [], additionalFilters = [], actions }: {
  action: string; query: string; searchLabel: string; placeholder: string; searchId?: string;
  filterName?: string; filterValue?: string; filterLabel?: string; options?: Option[]; additionalFilters?: Filter[]; actions?: ReactNode;
}) {
  const filters = [...(filterName && options.length ? [{ name: filterName, value: filterValue, label: filterLabel ?? 'Bộ lọc', options }] : []), ...additionalFilters];
  const count = filters.filter(filter => filter.value !== 'ALL').length;
  const active = !!query || count > 0;
  const columns = filters.length > 1 ? 'md:grid-cols-[minmax(0,1fr)_10rem_11rem_auto]' : filters.length ? 'md:grid-cols-[minmax(0,1fr)_14rem_auto]' : 'md:grid-cols-[minmax(0,1fr)_auto]';
  return <div className="mb-4">
    <div className="management-filter-panel rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4">
    <SearchForm action={action} role="search" aria-label="Tìm kiếm và lọc" className={`grid grid-cols-2 items-end gap-3 md:gap-4 ${columns}`}>
      <div className="col-span-2 min-w-0 md:col-span-1">
        <label className="block text-xs font-semibold text-slate-700">
          {searchLabel}
          <span className="relative mt-2 block"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input id={searchId} key={query} name="q" type="search" defaultValue={query} maxLength={200} placeholder={placeholder} className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[#153D67]" /></span>
        </label>
      </div>
      {filters.length > 0 && <FilterDisclosure count={count}>
        {filters.map(filter => {
          const id = `${action.replace(/[^a-z0-9]/gi, '-')}-${filter.name}`;
          return <div key={filter.name} className="min-w-0">
            <label htmlFor={id} className="block text-xs font-semibold text-slate-700">{filter.label}</label>
            <CustomSelect key={filter.value} id={id} name={filter.name} defaultValue={filter.value} ariaLabel={filter.label} className="mt-2" options={filter.options.map(option => ({ value: option.value, label: option.count === undefined ? option.label : `${option.label} (${option.count})` }))} />
          </div>;
        })}
      </FilterDisclosure>}
      <button type="submit" className={`h-11 rounded-lg bg-brand-button px-5 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67] focus-visible:ring-offset-2 ${filters.length ? '' : 'col-span-2 md:col-span-1'}`}>Áp dụng</button>
    </SearchForm>
    {active && <div className="mt-3 border-t border-slate-200 pt-3">
      <Link href={action} className="inline-flex min-h-11 items-center text-xs font-semibold text-[#153D67] hover:underline">Xóa bộ lọc</Link>
    </div>}
    </div>
    {actions && <div role="group" aria-label="Thao tác quản lý" className="management-filter-actions mt-3 flex flex-wrap justify-end gap-2">{actions}</div>}
  </div>;
}
