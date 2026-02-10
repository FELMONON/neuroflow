'use client';

import { type ReactNode } from 'react';
import clsx from 'clsx';

type BadgeVariant = 'default' | 'accent' | 'muted';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  /** @deprecated Use variant instead */
  color?: string;
  icon?: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-white/[0.08] text-text-secondary border border-white/[0.06]',
  accent: 'bg-accent-flow/15 text-accent-flow border border-accent-flow/20',
  muted: 'bg-white/[0.04] text-text-muted border border-white/[0.06]',
};

function mapColorToVariant(color: string): BadgeVariant {
  switch (color) {
    case 'flow':
    case 'spark':
    case 'grow':
    case 'sun':
    case 'bloom':
      return 'accent';
    case 'muted':
      return 'muted';
    default:
      return 'default';
  }
}

function Badge({ children, variant, color, icon, className }: BadgeProps) {
  const resolvedVariant = variant ?? (color ? mapColorToVariant(color) : 'default');

  return (
    <span
      className={clsx(
        'inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium',
        variantStyles[resolvedVariant],
        className,
      )}
    >
      {icon && <span className="shrink-0 mr-1">{icon}</span>}
      {children}
    </span>
  );
}

export { Badge };
export type { BadgeProps, BadgeVariant };
