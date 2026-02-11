'use client';

import { useState, useCallback, type KeyboardEvent } from 'react';
import clsx from 'clsx';

interface ScaleInputProps {
  value?: number;
  onChange?: (value: number) => void;
  lowLabel?: string;
  highLabel?: string;
  label?: string;
  className?: string;
}

function ScaleInput({
  value: controlledValue,
  onChange,
  lowLabel,
  highLabel,
  label,
  className,
}: ScaleInputProps) {
  const [internalValue, setInternalValue] = useState(controlledValue ?? 3);
  const value = controlledValue ?? internalValue;

  const handleSelect = useCallback(
    (v: number) => {
      if (controlledValue === undefined) setInternalValue(v);
      onChange?.(v);
    },
    [controlledValue, onChange],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const next = Math.min(5, value + 1);
        handleSelect(next);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = Math.max(1, value - 1);
        handleSelect(prev);
      }
    },
    [value, handleSelect],
  );

  return (
    <div className={clsx('flex flex-col gap-2', className)}>
      {label && (
        <span className="text-sm font-medium text-text-secondary">{label}</span>
      )}
      <div className="flex items-center gap-2">
        {lowLabel && (
          <span className="text-xs text-text-muted shrink-0">{lowLabel}</span>
        )}
        <div className="flex gap-1" role="radiogroup" aria-label={label ?? 'Scale input'} onKeyDown={handleKeyDown}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              tabIndex={value === n ? 0 : -1}
              onClick={() => handleSelect(n)}
              aria-label={`${n} out of 5`}
              className={clsx(
                'w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200 active:scale-[0.98] cursor-pointer',
                'focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none',
                value === n
                  ? 'bg-accent-flow text-white shadow-sm shadow-accent-flow/30'
                  : 'bg-white/[0.04] text-text-secondary hover:bg-white/[0.08]',
              )}
            >
              {n}
            </button>
          ))}
        </div>
        {highLabel && (
          <span className="text-xs text-text-muted shrink-0">{highLabel}</span>
        )}
      </div>
    </div>
  );
}

/** @deprecated Use ScaleInput instead */
const EmojiSlider = ScaleInput;

export { ScaleInput, EmojiSlider };
export type { ScaleInputProps };
export type { ScaleInputProps as EmojiSliderProps };
