'use client';

import type { RoutineType } from '@/types/database';

const routineLabels: Record<RoutineType, string> = {
  morning: 'First thing',
  evening: 'Wind down',
  anytime: 'Whenever',
  custom: 'Custom',
};

interface SectionHeaderProps {
  routine: RoutineType;
  done: number;
  total: number;
  currentHour: number | null;
}

export function SectionHeader({ routine, done, total, currentHour }: SectionHeaderProps) {
  const label = routineLabels[routine];

  let suffix = '';
  if (done === total && total > 0) {
    suffix = ' — all done!';
  } else if (routine === 'morning' && currentHour !== null && currentHour >= 12 && done === 0) {
    suffix = '';
  } else if (done > 0) {
    suffix = ` — ${done} of ${total} done`;
  }

  return (
    <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
      {label}
      {suffix && (
        <span className={done === total ? 'ml-1.5 text-accent-grow' : 'ml-1.5 text-white/[0.3] font-normal'}>
          {suffix}
        </span>
      )}
    </h2>
  );
}
