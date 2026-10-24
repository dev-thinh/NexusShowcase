'use client';

import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface CustomSelectProps {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  invalid?: boolean;
  describedBy?: string;
  disabled?: boolean;
  required?: boolean;
  ariaLabel?: string;
  className?: string;
  onChange?: (value: string) => void;
}

/** Shared single-choice dropdown for forms and filters. */
export function CustomSelect({ id, name, value, defaultValue = '', options, placeholder = 'Chọn…', invalid, describedBy, disabled, required, ariaLabel, className = '', onChange }: CustomSelectProps) {
  const generatedId = useId();
  const triggerId = id ?? `select-${generatedId}`;
  const listId = `${triggerId}-options`;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = value ?? internalValue;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [position, setPosition] = useState({ left: 0, top: 0, width: 0, maxHeight: 256, transform: '' });
  const searchRef = useRef({ text: '', time: 0 });
  const selected = options.findIndex(option => option.value === currentValue);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node) && !listRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  useLayoutEffect(() => {
    if (!open || disabled) return;
    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const below = window.innerHeight - rect.bottom - 12;
      const above = rect.top - 12;
      const placeAbove = below < 256 && above > below;
      const maxHeight = Math.max(0, Math.min(256, placeAbove ? above : below));
      const width = Math.min(rect.width, window.innerWidth - 16);
      setPosition({ left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)), top: placeAbove ? rect.top - 4 : rect.bottom + 4, width, maxHeight, transform: placeAbove ? 'translateY(-100%)' : '' });
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, disabled]);

  useEffect(() => {
    if (open) document.getElementById(`${listId}-${active}`)?.scrollIntoView?.({ block: 'nearest' });
  }, [open, active, listId]);

  useEffect(() => {
    const form = inputRef.current?.form;
    const reset = () => { setInternalValue(defaultValue); setOpen(false); };
    form?.addEventListener('reset', reset);
    return () => form?.removeEventListener('reset', reset);
  }, [defaultValue]);

  const choose = (index: number) => {
    if (disabled || triggerRef.current?.matches(':disabled') || !options[index]) return;
    setInternalValue(options[index].value);
    onChange?.(options[index].value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div ref={rootRef} className={`relative min-w-0 ${className}`} onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null) && !listRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
    }}>
      {name && <input ref={inputRef} type="hidden" name={name} value={currentValue} disabled={disabled} />}
      <button ref={triggerRef} id={triggerId} type="button" role="combobox" disabled={disabled}
        aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open && !disabled} aria-controls={listId}
        aria-activedescendant={open && !disabled && options[active] ? `${listId}-${active}` : undefined}
        aria-invalid={invalid} aria-required={required} aria-describedby={describedBy}
        onClick={() => { setActive(Math.max(selected, 0)); setOpen(current => !current); }}
        onKeyDown={event => {
          if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); }
          else if (event.key === 'Tab') setOpen(false);
          else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            if (!open) { setOpen(true); setActive(Math.max(selected, 0)); }
            else setActive(current => Math.max(0, Math.min(options.length - 1, current + (event.key === 'ArrowDown' ? 1 : -1))));
          } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (open) choose(active);
            else { setOpen(true); setActive(Math.max(selected, 0)); }
          } else if (event.key === 'Home' || event.key === 'End') {
            event.preventDefault(); setOpen(true); setActive(event.key === 'Home' ? 0 : Math.max(0, options.length - 1));
          } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
            const now = Date.now();
            const text = (now - searchRef.current.time < 700 ? searchRef.current.text : '') + event.key.toLocaleLowerCase('vi');
            searchRef.current = { text, time: now };
            const index = options.findIndex(option => option.label.toLocaleLowerCase('vi').startsWith(text));
            if (index >= 0) { event.preventDefault(); setOpen(true); setActive(index); }
          }
        }}
        className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-md border bg-white px-3 py-2.5 text-left text-sm font-normal text-[#1F2937] outline-none transition-colors hover:border-slate-200 focus:border-slate-200 focus:ring-2 focus:ring-[#153D67]/15 disabled:cursor-not-allowed disabled:opacity-50 ${invalid ? 'border-slate-200' : 'border-slate-200'}`}>
        <span className="truncate">{selected >= 0 ? options[selected].label : placeholder}</span>
        <ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 text-[#1F2937] transition-transform motion-reduce:transition-none ${open && !disabled ? 'rotate-180' : ''}`} />
      </button>
      {open && !disabled && createPortal(<div ref={listRef} id={listId} role="listbox" aria-labelledby={triggerId} style={position} className="fixed z-[60] overflow-y-auto overscroll-contain rounded-md border border-slate-200 bg-white p-1.5 shadow-lg">
        {options.length ? options.map((option, index) => (
          <div key={option.value} id={`${listId}-${index}`} role="option" aria-selected={option.value === currentValue}
            onMouseDown={event => event.preventDefault()} onMouseEnter={() => setActive(index)} onClick={() => choose(index)}
            className={`flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm font-normal ${index === active ? 'bg-[#FFFFFF] text-[#1F2937]' : 'text-[#1F2937] hover:bg-[#FFFFFF]'}`}>
            <span>{option.label}</span>{option.value === currentValue && <Check aria-hidden="true" className="h-4 w-4 shrink-0" />}
          </div>
        )) : <p className="px-3 py-2 text-sm text-[#1F2937]">Chưa có lựa chọn</p>}
      </div>, document.body)}
    </div>
  );
}
