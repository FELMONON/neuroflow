'use client';

import clsx from 'clsx';
import { ProgressBar } from './ProgressBar';

interface XPBarProps {
  currentXP: number;
  xpForNextLevel: number;
  level: number;
  className?: string;
}

function XPBar({
  currentXP,
  xpForNextLevel,
  level,
  className,
}: XPBarProps) {
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      <span className="text-sm text-text-secondary">
        Level {level} &middot; <span className="font-mono tabular-nums text-accent-bloom">{currentXP}/{xpForNextLevel} XP</span>
      </span>
      <ProgressBar value={currentXP} max={xpForNextLevel} height="sm" fillColor="bg-accent-bloom" />
    </div>
  );
}

export { XPBar };
export type { XPBarProps };
