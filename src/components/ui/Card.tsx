'use client';

import { forwardRef, type ReactNode, type HTMLAttributes } from 'react';
import clsx from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  header?: ReactNode;
  footer?: ReactNode;
  noPadding?: boolean;
  children: ReactNode;
  className?: string;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      header,
      footer,
      noPadding = false,
      children,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'bg-bg-secondary rounded-xl border border-white/[0.06] hover:border-white/[0.10] transition-all duration-200',
          className,
        )}
        {...props}
      >
        {header && (
          <div className="px-5 py-4 border-b border-white/[0.06]">
            {header}
          </div>
        )}
        <div className={clsx(!noPadding && 'p-5')}>{children}</div>
        {footer && (
          <div className="px-5 py-4 border-t border-white/[0.06]">
            {footer}
          </div>
        )}
      </div>
    );
  },
);

Card.displayName = 'Card';

export { Card };
export type { CardProps };
