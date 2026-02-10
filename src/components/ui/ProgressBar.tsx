'use client';

import clsx from 'clsx';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercent?: boolean;
  height?: 'sm' | 'md' | 'lg';
  fillColor?: string;
  className?: string;
}

const heightStyles: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-1',
  md: 'h-1.5',
  lg: 'h-2',
};

function ProgressBar({
  value,
  max = 100,
  label,
  showPercent = false,
  height = 'md',
  fillColor,
  className,
}: ProgressBarProps) {
  const percent = max === 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="text-text-secondary">{label}</span>}
          {showPercent && (
            <span className="text-text-muted font-mono tabular-nums">
              {Math.round(percent)}%
            </span>
          )}
        </div>
      )}
      <div
        className={clsx(
          'w-full rounded-full bg-white/[0.06] overflow-hidden',
          heightStyles[height],
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label ?? 'Progress'}
      >
        <div
          className={clsx('h-full rounded-full', fillColor ?? 'bg-accent-flow')}
          style={{
            width: `${percent}%`,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}

export { ProgressBar };
export type { ProgressBarProps };
