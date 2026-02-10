'use client';

import clsx from 'clsx';

type EnergyLevel = 'high' | 'medium' | 'low' | 'recharge';

interface EnergyIndicatorProps {
  level: EnergyLevel;
  label?: boolean;
  className?: string;
}

const dotColor: Record<EnergyLevel, string> = {
  high: 'bg-energy-high',
  medium: 'bg-energy-medium',
  low: 'bg-energy-low',
  recharge: 'bg-energy-recharge',
};

const textColor: Record<EnergyLevel, string> = {
  high: 'text-energy-high',
  medium: 'text-energy-medium',
  low: 'text-energy-low',
  recharge: 'text-energy-recharge',
};

const labelText: Record<EnergyLevel, string> = {
  high: 'High Energy',
  medium: 'Medium Energy',
  low: 'Low Energy',
  recharge: 'Recharge',
};

function EnergyIndicator({
  level,
  label = false,
  className,
}: EnergyIndicatorProps) {
  return (
    <div className={clsx('inline-flex items-center gap-1.5', className)}>
      <span
        className={clsx('w-2 h-2 rounded-full shrink-0', dotColor[level])}
        aria-hidden="true"
      />
      {label ? (
        <span className={clsx('text-sm font-medium', textColor[level])}>
          {labelText[level]}
        </span>
      ) : (
        <span className="sr-only">{labelText[level]}</span>
      )}
    </div>
  );
}

export { EnergyIndicator };
export type { EnergyIndicatorProps, EnergyLevel };
