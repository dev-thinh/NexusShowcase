import { CheckCircle2 } from 'lucide-react';

export function SuccessNotice({ message }: { message: string }) {
  return <div className="mb-6 flex flex-col items-center gap-3 text-center" data-success-notice="true">
    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><CheckCircle2 className="h-8 w-8" aria-hidden="true" /></span>
    <p className="text-sm leading-6 text-slate-600">{message}</p>
  </div>;
}
