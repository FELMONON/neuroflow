'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Plus, Repeat, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { HabitGrid } from '@/components/features/habits/HabitGrid';
import { HabitItem } from '@/components/features/habits/HabitItem';
import { HabitForm } from '@/components/features/habits/HabitForm';
import { useHabitStore } from '@/stores/useHabitStore';
import { useProfileStore } from '@/stores/useProfileStore';
import type { RoutineType } from '@/types/database';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};
const pageTransition = { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const };
const staggerContainer = {
  animate: { transition: { staggerChildren: 0.05 } },
};
const staggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

interface HabitData {
  id: string;
  title: string;
  routineType: RoutineType;
  currentStreak: number;
  estimatedMinutes: number;
  completed: boolean;
}

function generateGridData(completions: { completed_date: string }[]) {
  const completionDates = new Set(completions.map((c) => c.completed_date));
  const days: { date: string; done: boolean }[] = [];
  const today = new Date();
  for (let week = 3; week >= 0; week--) {
    for (let day = 0; day < 7; day++) {
      const d = new Date(today);
      d.setDate(today.getDate() - (week * 7 + (6 - day)));
      const dateStr = d.toISOString().split('T')[0];
      const isInFuture = d > today;
      days.push({
        date: dateStr,
        done: isInFuture ? false : completionDates.has(dateStr),
      });
    }
  }
  return days;
}

// initialHabits removed — now sourced from useHabitStore

const routineOrder: RoutineType[] = ['morning', 'evening', 'anytime'];

// Friendlier labels — no rigid clock assumptions
const routineLabels: Record<RoutineType, string> = {
  morning: 'First thing',
  evening: 'Wind down',
  anytime: 'Whenever',
  custom: 'Custom',
};

/** Progress ring — fills up, never counts down */
function ProgressRing({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : done / total;
  const r = 22;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);

  return (
    <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
        <circle
          cx="26"
          cy="26"
          r={r}
          fill="none"
          stroke={pct === 1 ? 'var(--color-accent-grow)' : 'var(--color-accent-flow)'}
          strokeWidth="3"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-xs font-mono tabular-nums text-text-primary font-medium">
        {done}/{total}
      </span>
    </div>
  );
}

/** Section header — encourages, never shames */
function SectionHeader({
  routine,
  done,
  total,
  currentHour,
}: {
  routine: RoutineType;
  done: number;
  total: number;
  currentHour: number | null;
}) {
  const label = routineLabels[routine];

  let suffix = '';
  if (done === total && total > 0) {
    suffix = ' — all done!';
  } else if (routine === 'morning' && currentHour !== null && currentHour >= 12 && done === 0) {
    // Morning is past and nothing done — be kind, no "0/4" shame
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

export default function HabitsPage() {
  const [showForm, setShowForm] = useState(false);
  const [consistencyOpen, setConsistencyOpen] = useState(false);
  const [currentHour, setCurrentHour] = useState<number | null>(null);
  const reducedMotion = useReducedMotion();

  // Store-driven state (select raw arrays to avoid infinite loop from calling selector in useStore)
  const storeHabits = useHabitStore((s) => s.habits);
  const storeCompletions = useHabitStore((s) => s.completions);
  const gridData = useMemo(() => generateGridData(storeCompletions), [storeCompletions]);
  const toggleHabit = useHabitStore((s) => s.toggleHabit);
  const addHabitToStore = useHabitStore((s) => s.addHabit);
  const profileId = useProfileStore((s) => s.profile?.id ?? '');

  // Derive today's habits from raw state
  const habits: HabitData[] = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return storeHabits
      .filter((h) => h.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((h) => ({
      id: h.id,
      title: h.title,
      routineType: h.routine_type,
      currentStreak: h.streak_current,
      estimatedMinutes: h.estimated_minutes,
      completed: storeCompletions.some((c) => c.habit_id === h.id && c.completed_date === today),
    }));
  }, [storeHabits, storeCompletions]);

  // Avoid hydration mismatch — set hour client-side only
  useEffect(() => {
    setCurrentHour(new Date().getHours());
  }, []);

  const handleToggle = useCallback((id: string) => {
    toggleHabit(id);
  }, [toggleHabit]);

  const grouped = useMemo(() => {
    const groups: Partial<Record<RoutineType, HabitData[]>> = {};
    for (const h of habits) {
      if (!groups[h.routineType]) groups[h.routineType] = [];
      groups[h.routineType]!.push(h);
    }
    // Uncompleted rise to the top — eye lands on "what's next"
    for (const key of Object.keys(groups) as RoutineType[]) {
      groups[key]!.sort((a, b) => Number(a.completed) - Number(b.completed));
    }
    return groups;
  }, [habits]);

  // Total progress
  const totalHabits = habits.length;
  const completedCount = habits.filter((h) => h.completed).length;

  // Find the quickest uncompleted habit — the "start here" nudge
  const quickestWinId = useMemo(() => {
    const uncompleted = habits.filter((h) => !h.completed);
    if (uncompleted.length === 0) return null;
    return uncompleted.reduce((min, h) => (h.estimatedMinutes < min.estimatedMinutes ? h : min)).id;
  }, [habits]);

  // Encouraging subtitle based on progress
  const subtitle = useMemo(() => {
    if (totalHabits === 0) return '';
    if (completedCount === totalHabits) return 'You did it all today!';
    if (completedCount === 0) return 'Pick the easiest one and start there.';
    if (completedCount >= totalHabits * 0.5) return 'More than halfway — keep rolling.';
    return `${completedCount} down. You're building momentum.`;
  }, [completedCount, totalHabits]);

  return (
    <motion.div
      className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto"
      variants={reducedMotion ? undefined : pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      {/* Header: Progress ring + title + add button */}
      <div className="flex items-center gap-4 mb-6">
        {totalHabits > 0 && <ProgressRing done={completedCount} total={totalHabits} />}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-text-primary">Today&apos;s habits</h1>
          {subtitle && <p className="text-sm text-text-muted mt-0.5">{subtitle}</p>}
        </div>
        <Button
          size="sm"
          variant="ghost"
          icon={<Plus size={16} />}
          onClick={() => setShowForm(true)}
        >
          Add
        </Button>
      </div>

      {habits.length === 0 ? (
        <EmptyState
          icon={<Repeat />}
          title="No habits yet"
          description="Small routines build momentum. Start with one thing you want to do each day."
          action={{ label: 'Add a Habit', onClick: () => setShowForm(true) }}
        />
      ) : (
        <>
          {/* Habit sections — action first */}
          <motion.div
            className="space-y-5"
            variants={reducedMotion ? undefined : staggerContainer}
            initial="initial"
            animate="animate"
          >
            {routineOrder.map((routine) => {
              const items = grouped[routine];
              if (!items || items.length === 0) return null;
              const sectionDone = items.filter((h) => h.completed).length;

              return (
                <motion.div key={routine} variants={reducedMotion ? undefined : staggerItem}>
                  <SectionHeader
                    routine={routine}
                    done={sectionDone}
                    total={items.length}
                    currentHour={currentHour}
                  />
                  <Card noPadding>
                    <div className="divide-y divide-white/[0.06]">
                      {items.map((habit) => (
                        <HabitItem
                          key={habit.id}
                          id={habit.id}
                          title={habit.title}
                          currentStreak={habit.currentStreak}
                          estimatedMinutes={habit.estimatedMinutes}
                          completed={habit.completed}
                          isQuickestWin={habit.id === quickestWinId}
                          onToggle={handleToggle}
                        />
                      ))}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Consistency — collapsible, below the actions */}
          <div className="mt-8">
            <button
              onClick={() => setConsistencyOpen(!consistencyOpen)}
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted hover:text-text-secondary transition-colors cursor-pointer mb-3"
            >
              <span>Consistency</span>
              <ChevronDown
                size={12}
                className={`transition-transform duration-200 ${consistencyOpen ? 'rotate-0' : '-rotate-90'}`}
              />
            </button>

            {consistencyOpen && (
              <motion.div
                initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
                animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <h3 className="text-sm font-medium text-text-secondary mb-3">Last 4 weeks</h3>
                  <HabitGrid data={gridData} />
                </Card>
              </motion.div>
            )}
          </div>
        </>
      )}

      <HabitForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={(data) => {
          addHabitToStore({
            id: crypto.randomUUID(),
            user_id: profileId,
            title: data.title,
            description: null,
            cue: null,
            routine_type: data.routineType,
            frequency: data.frequency ?? 'daily',
            custom_days: [],
            estimated_minutes: 5,
            sort_order: habits.length,
            streak_current: 0,
            streak_best: 0,
            is_active: true,
            created_at: new Date().toISOString(),
          });
        }}
      />
    </motion.div>
  );
}
