'use client';

import toast from 'react-hot-toast';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import clsx from 'clsx';

type ToastVariant = 'success' | 'error' | 'info';

interface ShowToastOptions {
  message: string;
  variant?: ToastVariant;
  duration?: number;
}

const variantConfig: Record<
  ToastVariant,
  { icon: typeof CheckCircle; color: string; bg: string }
> = {
  success: {
    icon: CheckCircle,
    color: 'text-accent-grow',
    bg: 'bg-accent-grow/10 border-accent-grow/20',
  },
  error: {
    icon: AlertCircle,
    color: 'text-accent-spark',
    bg: 'bg-accent-spark/10 border-accent-spark/20',
  },
  info: {
    icon: Info,
    color: 'text-accent-flow',
    bg: 'bg-accent-flow/10 border-accent-flow/20',
  },
};

function showToast({ message, variant = 'info', duration = 3000 }: ShowToastOptions) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  toast.custom(
    (t) => (
      <div
        role="alert"
        aria-live="assertive"
        className={clsx(
          'flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg',
          config.bg,
          t.visible ? 'animate-slideUp' : 'opacity-0',
        )}
      >
        <span className={clsx('shrink-0', config.color)} aria-hidden="true">
          <Icon size={20} />
        </span>
        <p className="text-sm text-text-primary flex-1">{message}</p>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="shrink-0 p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-all duration-200 active:scale-[0.98] cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    ),
    { duration },
  );
}

export { showToast };
export type { ShowToastOptions, ToastVariant };
