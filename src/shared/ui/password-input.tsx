'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useState, type InputHTMLAttributes } from 'react';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  id: string;
  visibilityLabel: string;
};

export function PasswordInput({ id, visibilityLabel, className = '', disabled, ...props }: Props) {
  const [visible, setVisible] = useState(false);
  return <div className="relative">
    <input {...props} id={id} type={visible ? 'text' : 'password'} disabled={disabled} className={`${className} pr-12`} />
    <button
      type="button"
      disabled={disabled}
      onClick={() => setVisible(current => !current)}
      aria-label={`${visible ? 'Ẩn' : 'Hiện'} ${visibilityLabel}`}
      aria-pressed={visible}
      aria-controls={id}
      className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-r-lg text-slate-500 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#153D67]/30 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
    </button>
  </div>;
}
