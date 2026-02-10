'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Check, Repeat, Flame } from 'lucide-react';
import { EmptyState } from '@/components/ui';
import type { RoutineType } from '@/types/database';

interface HabitItem {
  id: string;
  title: string;
  routineType: RoutineType;
  currentStreak: number;
  estimatedMinutes: number;
  completed: boolean;
}

interface HabitsSummaryProps {
  initialHabits: HabitItem[];
  onToggleHabit: (id: string) => void;
}

const routineLabels: Record<RoutineType, string> = {
  morning: 'First thing',
  evening: 'Wind down',
  anytime: 'Whenever',
  custom: 'Custom',
};

function groupByRoutine(habits: HabitItem[]) {
  const groups: Partial<Record<RoutineType, HabitItem[]>> = {};
  for (const h of habits) {
    if (!groups[h.routineType]) groups[h.routineType] = [];
    groups[h.routineType]!.push(h);
  }
  // Sort each group: uncompleted first, completed sink to bottom
  for (const key of Object.keys(groups) as RoutineType[]) {
    groups[key]!.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));
  }
  return groups;
}

export function HabitsSummary({ initialHabits, onToggleHabit }: HabitsSummaryProps) {
  const [habits, setHabits] = useState(initialHabits);

  // Sync local state when parent passes new habits (e.g. after store hydration)
  useEffect(() => {
    setHabits(initialHabits);
  }, [initialHabits]);

  const completedCount = useMemo(
    () => habits.filter((h) => h.completed).length,
    [habits],
  );

  const groups = useMemo(() => groupByRoutine(habits), [habits]);

  const handleToggle = useCallback(
    (id: string) => {
      setHabits((prev) =>
        prev.map((h) =>
          h.id === id ? { ...h, completed: !h.completed } : h,
        ),
      );
      onToggleHabit(id);
    },
    [onToggleHabit],
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-text-primary">Habits</h3>
          <span className="text-xs bg-white/[0.06] text-text-secondary rounded-full px-2 py-0.5 font-mono tabular-nums">
            {completedCount}/{habits.length}
          </span>
        </div>
      </div>

      {habits.length === 0 ? (
        <EmptyState
          icon={<Repeat />}
          title="No habits tracked yet"
          description="Small routines build momentum. Add a habit to get started."
          action={{ label: 'Go to Habits', onClick: () => window.location.href = '/app/habits' }}
        />
      ) : (
      <div className="flex flex-col gap-4">
        {Object.entries(groups).map(([routine, items]) => (
          <div key={routine}>
            <p className="text-xs font-medium text-text-muted mb-1.5">
              {routineLabels[routine as RoutineType]}
            </p>

            <div className="flex flex-col">
              {items!.map((habit) => {
                const displayStreak = habit.completed
                  ? habit.currentStreak + 1
                  : habit.currentStreak;

                return (
                  <button
                    key={habit.id}
                    onClick={() => handleToggle(habit.id)}
                    aria-pressed={habit.completed}
                    className={`flex items-center gap-3 w-full px-3 rounded-lg transition-all duration-200 active:scale-[0.98] text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none ${
                      habit.completed ? 'py-1.5 opacity-60' : 'py-2 hover:bg-white/[0.03]'
                    }`}
                  >
                    <div
                      className={`shrink-0 w-[18px] h-[18px] rounded border-[1.5px] flex items-center justify-center transition-all duration-150 ${
                        habit.completed
                          ? 'bg-accent-grow border-accent-grow shadow-sm shadow-accent-grow/30'
                          : 'border-white/20'
                      }`}
                    >
                      {habit.completed && (
                        <Check size={11} className="text-white" strokeWidth={3} />
                      )}
                    </div>

                    <span
                      className={`flex-1 text-sm ${
                        habit.completed ? 'text-text-muted line-through' : 'text-text-primary'
                      }`}
                    >
                      {habit.title}
                    </span>

                    {/* Duration tag */}
                    {!habit.completed && habit.estimatedMinutes > 0 && (
                      <span className="text-[10px] text-text-muted font-mono tabular-nums">
                        {habit.estimatedMinutes}m
                      </span>
                    )}

                    {/* Streak: flame for active, "New" for zero */}
                    {displayStreak > 0 ? (
                      <span className="flex items-center gap-0.5 text-xs text-accent-sun font-mono tabular-nums">
                        <Flame size={11} className="text-accent-sun" />
                        {displayStreak}
                      </span>
                    ) : !habit.completed ? (
                      <span className="text-[10px] text-text-muted bg-white/[0.04] px-1.5 py-0.5 rounded">
                        New
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
