'use client';

import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  useId,
} from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  className?: string;
  wrapperClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      iconLeft,
      iconRight,
      className,
      wrapperClassName,
      id: idProp,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const id = idProp ?? generatedId;

    return (
      <div className={clsx('flex flex-col gap-1.5', wrapperClassName)}>
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {iconLeft && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
              {iconLeft}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            className={clsx(
              'w-full h-10 rounded-lg bg-white/[0.04] border text-text-primary placeholder:text-text-muted',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-accent-flow/20 focus:border-accent-flow/50',
              error
                ? 'border-accent-spark/50 focus:ring-accent-spark/40 focus:border-accent-spark/40'
                : 'border-white/[0.08]',
              iconLeft ? 'pl-10' : 'pl-3',
              iconRight ? 'pr-10' : 'pr-3',
              className,
            )}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            {...props}
          />
          {iconRight && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
              {iconRight}
            </span>
          )}
        </div>
        {error && (
          <p id={`${id}-error`} className="text-sm text-accent-spark" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export { Input };
export type { InputProps };
