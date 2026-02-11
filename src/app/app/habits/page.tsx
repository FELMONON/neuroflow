'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Plus, Repeat } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { HabitItem } from '@/components/features/habits/HabitItem';
import { HabitForm } from '@/components/features/habits/HabitForm';
import { ProgressRing } from '@/components/features/habits/ProgressRing';
import { SectionHeader } from '@/components/features/habits/SectionHeader';
import { ConsistencySection } from '@/components/features/habits/ConsistencySection';
import { useHabitStore } from '@/stores/useHabitStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { SEED_HABITS } from '@/lib/seed-data';
import type { RoutineType } from '@/types/database';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};
const pageTransition = { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const };
const staggerContainer = { animate: { transition: { staggerChildren: 0.05 } } };
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

const routineOrder: RoutineType[] = ['morning', 'evening', 'anytime'];

export default function HabitsPage() {
  const [showForm, setShowForm] = useState(false);
  const [currentHour, setCurrentHour] = useState<number | null>(null);
  const currentHourRef = useRef(currentHour);
  const reducedMotion = useReducedMotion();

  const storeHabits = useHabitStore((s) => s.habits);
  const storeCompletions = useHabitStore((s) => s.completions);
  const toggleHabit = useHabitStore((s) => s.toggleHabit);
  const addHabitToStore = useHabitStore((s) => s.addHabit);
  const profileId = useProfileStore((s) => s.profile?.id ?? '');

  const habits: HabitData[] = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return storeHabits
      .filter((h) => h.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((h) => ({
        id: h.id, title: h.title, routineType: h.routine_type,
        currentStreak: h.streak_current, estimatedMinutes: h.estimated_minutes,
        completed: storeCompletions.some((c) => c.habit_id === h.id && c.completed_date === today),
      }));
  }, [storeHabits, storeCompletions]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const hour = new Date().getHours();
      if (hour !== currentHourRef.current) {
        currentHourRef.current = hour;
        setCurrentHour(hour);
      }
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const handleToggle = useCallback((id: string) => { toggleHabit(id); }, [toggleHabit]);

  const handleLoadStarter = useCallback(() => {
    if (!profileId) return;
    const now = new Date().toISOString();
    for (const seed of SEED_HABITS) {
      addHabitToStore({
        ...seed,
        id: crypto.randomUUID(),
        user_id: profileId,
        streak_current: 0,
        streak_best: 0,
        created_at: now,
      });
    }
  }, [profileId, addHabitToStore]);

  const grouped = useMemo(() => {
    const groups: Partial<Record<RoutineType, HabitData[]>> = {};
    for (const h of habits) {
      if (!groups[h.routineType]) groups[h.routineType] = [];
      groups[h.routineType]!.push(h);
    }
    for (const key of Object.keys(groups) as RoutineType[]) {
      groups[key]!.sort((a, b) => Number(a.completed) - Number(b.completed));
    }
    return groups;
  }, [habits]);

  const totalHabits = habits.length;
  const completedCount = habits.filter((h) => h.completed).length;

  const quickestWinId = useMemo(() => {
    const uncompleted = habits.filter((h) => !h.completed);
    if (uncompleted.length === 0) return null;
    return uncompleted.reduce((min, h) => (h.estimatedMinutes < min.estimatedMinutes ? h : min)).id;
  }, [habits]);

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
      initial="initial" animate="animate" exit="exit" transition={pageTransition}
    >
      <div className="flex items-center gap-4 mb-6">
        {totalHabits > 0 && <ProgressRing done={completedCount} total={totalHabits} />}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-text-primary">Today&apos;s habits</h1>
          {subtitle && <p className="text-sm text-text-muted mt-0.5">{subtitle}</p>}
        </div>
        <Button size="sm" variant="ghost" icon={<Plus size={16} />} onClick={() => setShowForm(true)}>Add</Button>
      </div>

      {habits.length === 0 ? (
        <div className="flex flex-col items-center gap-3">
          <EmptyState
            icon={<Repeat />} title="No habits yet"
            description="Small routines build momentum. Start with one thing you want to do each day."
            action={{ label: 'Add a Habit', onClick: () => setShowForm(true) }}
          />
          <Button variant="secondary" size="sm" onClick={handleLoadStarter}>
            Load starter habits
          </Button>
        </div>
      ) : (
        <>
          <motion.div className="space-y-5" variants={reducedMotion ? undefined : staggerContainer} initial="initial" animate="animate">
            {routineOrder.map((routine) => {
              const items = grouped[routine];
              if (!items || items.length === 0) return null;
              const sectionDone = items.filter((h) => h.completed).length;
              return (
                <motion.div key={routine} variants={reducedMotion ? undefined : staggerItem}>
                  <SectionHeader routine={routine} done={sectionDone} total={items.length} currentHour={currentHour} />
                  <Card noPadding>
                    <div className="divide-y divide-white/[0.06]">
                      {items.map((habit) => (
                        <HabitItem
                          key={habit.id} id={habit.id} title={habit.title}
                          currentStreak={habit.currentStreak} estimatedMinutes={habit.estimatedMinutes}
                          completed={habit.completed} isQuickestWin={habit.id === quickestWinId}
                          onToggle={handleToggle}
                        />
                      ))}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
          <ConsistencySection completions={storeCompletions} />
        </>
      )}

      <HabitForm
        open={showForm} onClose={() => setShowForm(false)}
        onSubmit={(data) => {
          addHabitToStore({
            id: crypto.randomUUID(), user_id: profileId, title: data.title,
            description: null, cue: null, routine_type: data.routineType,
            frequency: data.frequency ?? 'daily', custom_days: [], estimated_minutes: data.estimatedMinutes ?? 5,
            sort_order: habits.length, streak_current: 0, streak_best: 0,
            is_active: true, created_at: new Date().toISOString(),
          });
        }}
      />
    </motion.div>
  );
}
