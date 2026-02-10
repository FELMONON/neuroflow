'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

interface DopamineCategoryProps {
  title: string;
  count: number;
  children: ReactNode;
  action?: ReactNode;
}

export function DopamineCategory({ title, count, children, action }: DopamineCategoryProps) {
  const [open, setOpen] = useState(true);

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center gap-2 w-full">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 flex-1 cursor-pointer transition-all duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none rounded-lg"
        >
          <ChevronDown
            size={16}
            className={clsx(
              'text-text-muted transition-transform duration-150',
              !open && '-rotate-90',
            )}
          />
          <h3 className="text-sm font-medium text-text-secondary">{title}</h3>
          <span className="bg-white/[0.06] rounded-full px-1.5 py-0.5 text-xs text-text-muted">{count}</span>
        </button>
        {action && <span className="ml-auto">{action}</span>}
      </div>
      <div
        className={clsx(
          'flex flex-col gap-1.5 overflow-hidden transition-all duration-200',
          open ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        {children}
      </div>
    </section>
  );
}
