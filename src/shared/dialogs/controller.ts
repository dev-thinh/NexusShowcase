export interface DialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}
export interface DialogRequest extends DialogOptions {
  mode: 'confirm' | 'alert';
}

/** Resolve every request exactly once, including cancellation during navigation. */
export function createDialogController(onChange: (request: DialogRequest | null) => void) {
  type Pending = { request: DialogRequest; resolve: (value: boolean) => void };
  let active: Pending | undefined;
  const queued: Pending[] = [];
  const next = () => { active = queued.shift(); onChange(active?.request ?? null); };
  return {
    open(request: DialogRequest): Promise<boolean> {
      return new Promise(resolve => {
        queued.push({ request, resolve });
        if (!active) next();
      });
    },
    settle(accepted: boolean) {
      if (!active) return;
      const pending = active;
      next();
      pending.resolve(accepted);
    },
    cancelAll() {
      const pending = [...(active ? [active] : []), ...queued];
      active = undefined;
      queued.length = 0;
      onChange(null);
      pending.forEach(entry => entry.resolve(false));
    },
  };
}
