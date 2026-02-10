'use client';

import { ProgressBar } from '@/components/ui';

interface LevelProgressProps {
  level: number;
  currentXP: number;
  xpForNext: number;
  className?: string;
}

function LevelProgress({ level, currentXP, xpForNext, className }: LevelProgressProps) {
  return (
    <div className={className}>
      <p className="text-sm text-text-primary mb-2">
        <span className="font-medium">Level {level}</span>
        <span className="text-text-muted mx-1.5">&middot;</span>
        <span className="text-accent-bloom font-mono tabular-nums">
          {currentXP.toLocaleString()} / {xpForNext.toLocaleString()} XP
        </span>
      </p>
      <ProgressBar value={currentXP} max={xpForNext} height="md" fillColor="bg-accent-bloom" />
    </div>
  );
}

export { LevelProgress };
export type { LevelProgressProps };
