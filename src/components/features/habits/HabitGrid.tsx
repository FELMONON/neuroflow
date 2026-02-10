'use client';

import { useState, useMemo } from 'react';
import clsx from 'clsx';

interface DayCell {
  date: string;
  done: boolean;
}

interface HabitGridProps {
  data: DayCell[];
  className?: string;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function isToday(dateStr: string): boolean {
  const today = new Date();
  const d = new Date(dateStr);
  return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatAriaLabel(dateStr: string, done: boolean): string {
  const formatted = new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  return `${formatted}: ${done ? 'completed' : 'rest day'}`;
}

export function HabitGrid({ data, className }: HabitGridProps) {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const grid = useMemo(() => {
    const rows: DayCell[][] = [];
    for (let i = 0; i < data.length; i += 7) {
      rows.push(data.slice(i, i + 7));
    }
    return rows;
  }, [data]);

  // Stats for summary line
  const { thisWeekDone, thisWeekTotal, pctChangeText } = useMemo(() => {
    const thisWeek = data.slice(-7);
    const lastWeek = data.slice(-14, -7);
    const twDone = thisWeek.filter((d) => d.done).length;
    const twTotal = thisWeek.length;
    const lwDone = lastWeek.filter((d) => d.done).length;

    let changeText: string | null = null;
    if (lwDone > 0) {
      const pct = Math.round(((twDone - lwDone) / lwDone) * 100);
      if (pct > 0) changeText = `up ${pct}% from last week`;
      else if (pct < 0) changeText = 'holding steady from last week';
      else changeText = 'same as last week';
    }

    return { thisWeekDone: twDone, thisWeekTotal: twTotal, pctChangeText: changeText };
  }, [data]);

  return (
    <div className={clsx('relative', className)}>
      <div className="flex gap-1.5 mb-2">
        {DAY_LABELS.map((label) => (
          <div key={label} className="w-8 h-4 flex items-center justify-center text-[10px] text-text-muted">
            {label}
          </div>
        ))}
      </div>

      <div role="grid" aria-label="Habit completion grid" className="relative flex flex-col gap-1.5">
        {grid.map((week, weekIdx) => (
          <div key={weekIdx} role="row" className="flex gap-1.5">
            {week.map((day) => (
              <div
                key={day.date}
                role="gridcell"
                aria-label={formatAriaLabel(day.date, day.done)}
                tabIndex={-1}
                className={clsx(
                  'w-8 h-8 rounded-md transition-colors duration-150',
                  day.done ? 'bg-accent-grow/60' : 'bg-white/[0.04]',
                  isToday(day.date) && 'ring-2 ring-accent-flow ring-offset-1 ring-offset-bg-primary',
                )}
                onMouseEnter={() => setHoveredDate(day.date)}
                onMouseLeave={() => setHoveredDate(null)}
                title={formatDate(day.date)}
              />
            ))}
          </div>
        ))}

        <div
          className={clsx(
            'absolute left-0 -bottom-7 text-xs text-text-muted transition-opacity duration-150',
            hoveredDate ? 'opacity-100' : 'opacity-0',
          )}
        >
          {hoveredDate ? formatDate(hoveredDate) : '\u00A0'}
        </div>
      </div>

      {/* Summary stat — tells a story, not just a pattern */}
      <div className="mt-8 text-xs text-text-muted">
        This week:{' '}
        <span className="font-mono tabular-nums text-text-secondary">
          {thisWeekDone}/{thisWeekTotal}
        </span>{' '}
        days active
        {pctChangeText && (
          <span
            className={clsx(
              'ml-1',
              pctChangeText.startsWith('up') ? 'text-accent-grow' : 'text-text-muted',
            )}
          >
            — {pctChangeText}
          </span>
        )}
      </div>
    </div>
  );
}
