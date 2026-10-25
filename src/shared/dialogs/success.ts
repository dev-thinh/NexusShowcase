'use client';

export const SUCCESS_EVENT = 'nexus:action-success';
export type SuccessRequest = { message: string; resolve: () => void };

/** The root provider owns presentation and queuing, including calls from nested modals. */
export function notifySuccess(message: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  return new Promise(resolve => {
    queueMicrotask(() => {
      const event = new CustomEvent<SuccessRequest>(SUCCESS_EVENT, { cancelable: true, detail: { message, resolve } });
      window.dispatchEvent(event);
      // A detached component or standalone rendering must not leave an action pending.
      if (!event.defaultPrevented) resolve();
    });
  });
}
