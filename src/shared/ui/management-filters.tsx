
'use client';

import { useI18n } from '@/shared/i18n/provider';
import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { SearchForm } from '@/shared/ui/validated-form';
import { CustomSelect } from '@/shared/ui/custom-select';
import { FilterDisclosure } from '@/shared/ui/filter-disclosure';
import { LiveSearchInput } from '@/shared/ui/live-search-input';
import { FilterActions } from '@/shared/ui/filter-actions';

type Option = { value: string; label: string; count?: number };
type Filter = { name: string; value: string; label: string; options: Option[] };
export function ManagementFilters({ action, query, searchLabel, placeholder, searchId, filterName, filterValue = 'ALL', filterLabel, options = [], additionalFilters = [], actions }: {
  action: string; query: string; searchLabel: string; placeholder: string; searchId?: string;
  filterName?: string; filterValue?: string; filterLabel?: string; options?: Option[]; additionalFilters?: Filter[]; actions?: ReactNode;
}) {
  const { t: tr } = useI18n();

  const filters = [...(filterName && options.length ? [{ name: filterName, value: filterValue, label: filterLabel ?? 'Bộ lọc', options }] : []), ...additionalFilters];
  const count = filters.filter(filter => filter.value !== 'ALL').length;
  const active = !!query || count > 0;
  const columns = filters.length > 1 ? 'md:grid-cols-[minmax(0,1fr)_10rem_11rem_auto]' : filters.length ? 'md:grid-cols-[minmax(0,1fr)_14rem_auto]' : active ? 'md:grid-cols-[minmax(0,1fr)_auto]' : 'md:grid-cols-1';
  return <div className="mb-4">
    <div className="management-filter-panel rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4">
    <SearchForm action={action} role="search" aria-label={tr("Tìm kiếm và lọc")} className={`grid grid-cols-2 items-end gap-3 md:gap-4 ${columns}`}>
      <div className="col-span-2 min-w-0 md:col-span-1">
        <label className="block text-xs font-semibold text-slate-700">
          {tr(searchLabel)}
          <span className="relative mt-2 block"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><LiveSearchInput id={searchId} query={query} name="q" type="search" maxLength={200} placeholder={tr(placeholder)} className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[#153D67]" /></span>
        </label>
      </div>
      {filters.length > 0 && <FilterDisclosure count={count}>
        {filters.map(filter => {
          const id = `${action.replace(/[^a-z0-9]/gi, '-')}-${filter.name}`;
          return <div key={filter.name} className="min-w-0">
            <label htmlFor={id} className="block text-xs font-semibold text-slate-700">{tr(filter.label)}</label>
            <CustomSelect key={filter.value} id={id} name={filter.name} submitOnChange defaultValue={filter.value} ariaLabel={tr(filter.label)} className="mt-2" options={filter.options.map(option => ({ value: option.value, label: tr(option.label) }))} />
          </div>;
        })}
      </FilterDisclosure>}
      <FilterActions resetHref={action} active={active} className={filters.length ? '' : 'col-span-2 md:col-span-1'} />
    </SearchForm>
    </div>
    {actions && <div role="group" aria-label={tr("Thao tác quản lý")} className="management-filter-actions mt-3 flex flex-wrap justify-end gap-2">{actions}</div>}
  </div>;
}
