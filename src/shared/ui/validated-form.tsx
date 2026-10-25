'use client';

import NavigationForm from 'next/form';
import { createContext, useContext, useEffect, useId, useRef, useState, type FormHTMLAttributes } from 'react';
import type { z } from 'zod';
import { formErrors, searchFormSchema } from '@/shared/lib/form-validation';

type Context = { errors: Record<string, string>; errorId: (name: string) => string };
const ValidationContext = createContext<Context | null>(null);

export function FieldError({ name }: { name: string }) {
  const context = useContext(ValidationContext);
  const message = context?.errors[name];
  return message ? <p id={context!.errorId(name)} role="alert" className="mt-1.5 text-sm leading-5 text-rose-800">{message}</p> : null;
}

type Props = Omit<FormHTMLAttributes<HTMLFormElement>, 'action'> & {
  schema: z.ZodType;
  values?: Record<string, unknown>;
  action?: string;
  navigation?: boolean;
  inlineErrors?: boolean;
  scroll?: boolean;
  prefetch?: false;
};

export function ValidatedForm({ schema, values, action, navigation = false, inlineErrors = false, onSubmit, onChange, children, scroll = false, prefetch = false, ...props }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const root = useRef<HTMLFormElement>(null);
  const id = useId();
  const errorId = (name: string) => `${id}-${name.replace(/[^a-zA-Z0-9_-]/g, '-')}-error`;
  useEffect(() => {
    const previous: Array<{ control: HTMLElement; invalid: string | null; describedBy: string | null }> = [];
    for (const control of root.current?.querySelectorAll<HTMLElement>('[name]') ?? []) {
      const name = control.getAttribute('name')!;
      if (!errors[name]) continue;
      const target = control instanceof HTMLInputElement && control.type === 'hidden' ? control.parentElement?.querySelector<HTMLElement>('button') ?? control : control;
      previous.push({ control: target, invalid: target.getAttribute('aria-invalid'), describedBy: target.getAttribute('aria-describedby') });
      target.setAttribute('aria-invalid', 'true');
      const describedBy = target.getAttribute('aria-describedby');
      target.setAttribute('aria-describedby', [describedBy, errorId(name)].filter(Boolean).join(' '));
    }
    return () => {
      for (const { control, invalid, describedBy } of previous) {
        if (invalid === null) control.removeAttribute('aria-invalid'); else control.setAttribute('aria-invalid', invalid);
        if (describedBy === null) control.removeAttribute('aria-describedby'); else control.setAttribute('aria-describedby', describedBy);
      }
    };
  }, [errors, id]);

  const content = <ValidationContext.Provider value={{ errors, errorId }}>
    {children}
    {errors._form && <FieldError name="_form" />}
    {!inlineErrors && Object.keys(errors).some(name => name !== '_form') && <div className="col-span-full w-full space-y-1" role="alert">
      {Object.entries(errors).filter(([name]) => name !== '_form').map(([name, message]) => <p key={name} id={errorId(name)} className="text-sm text-rose-800">{message}</p>)}
    </div>}
  </ValidationContext.Provider>;
  const common = {
    ...props, ref: root, noValidate: true,
    onChange: (event: React.ChangeEvent<HTMLFormElement>) => {
      const name = event.target instanceof Element ? event.target.getAttribute('name') : null;
      if (name) setErrors(current => Object.fromEntries(Object.entries(current).filter(([path]) => path !== name && !path.startsWith(name + '.') && !name.startsWith(path + '.'))));
      onChange?.(event);
    },
    onSubmit: (event: React.SubmitEvent<HTMLFormElement>) => {
      const parsed = schema.safeParse({ ...Object.fromEntries(new FormData(event.currentTarget)), ...values });
      if (!parsed.success) {
        event.preventDefault();
        const next = formErrors(parsed.error); setErrors(next);
        requestAnimationFrame(() => {
          const name = Object.keys(next).find(path => path !== '_form');
          const control = Array.from(root.current?.querySelectorAll<HTMLElement>('[name]') ?? []).find(element => element.getAttribute('name') === name);
          const target = control instanceof HTMLInputElement && control.type === 'hidden' ? control.parentElement?.querySelector<HTMLElement>('button') : control;
          target?.focus();
        });
        return;
      }
      setErrors({}); onSubmit?.(event);
    },
  };
  return navigation && action ? <NavigationForm {...common} action={action} scroll={scroll} prefetch={prefetch}>{content}</NavigationForm> : <form {...common} action={action}>{content}</form>;
}

export function SearchForm({ action, ...props }: Omit<Props, 'schema' | 'values' | 'navigation'>) {
  return <ValidatedForm {...props} schema={searchFormSchema} action={action} navigation={!!action} />;
}
