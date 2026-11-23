'use client';

import { useToast } from '@/context/toast-context';
import { cn } from '@/lib/utils';

const toastStyles: Record<string, string> = {
  success: 'bg-emerald-500/90 text-white',
  error: 'bg-destructive/90 text-destructive-foreground',
  info: 'bg-primary/90 text-primary-foreground',
};

export function Toaster() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'rounded-lg px-4 py-3 text-sm font-medium shadow-lg backdrop-blur-sm transition-all',
            toastStyles[toast.type]
          )}
          role="alert"
        >
          <div className="flex items-center gap-3">
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 rounded p-0.5 opacity-70 hover:opacity-100"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
