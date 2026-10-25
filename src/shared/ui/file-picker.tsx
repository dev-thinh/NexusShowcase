'use client';

import { useId, useRef, useState, type InputHTMLAttributes } from 'react';
import { Loader2, Upload } from 'lucide-react';

type FilePickerProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> & {
  label?: string;
  busy?: boolean;
  showFileName?: boolean;
  className?: string;
  buttonClassName?: string;
};

export function FilePicker({ label = 'Chọn tệp', busy = false, showFileName = true, className = '', buttonClassName, id, disabled, onChange, ...props }: FilePickerProps) {
  const generatedId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  return <div className={`flex min-w-0 flex-wrap items-center gap-2 ${className}`} data-file-picker="true">
    <input {...props} id={id ?? generatedId} ref={input} type="file" className="hidden" aria-hidden="true" tabIndex={-1} disabled={disabled || busy} onChange={event => {
      const files = Array.from(event.currentTarget.files ?? []);
      if (!files.length) return;
      setFileName(files.length > 1 ? `${files.length} tệp đã chọn` : files[0].name);
      onChange?.(event);
      event.currentTarget.value = '';
    }} />
    <button type="button" disabled={disabled || busy} aria-controls={id ?? generatedId} aria-describedby={props['aria-describedby']} aria-invalid={props['aria-invalid']} onClick={() => input.current?.click()} className={buttonClassName ?? 'action-secondary-detail min-h-10 shrink-0 disabled:cursor-not-allowed disabled:opacity-50'}>
      {busy ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Upload aria-hidden="true" className="h-4 w-4" />}{busy ? 'Đang tải…' : label}
    </button>
    {showFileName && fileName && <span className="min-w-0 max-w-full truncate text-sm text-slate-500" title={fileName} role="status">{fileName}</span>}
  </div>;
}
