'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { GreetingHeader } from '@/components/features/today/GreetingHeader';
import { TodayFocus } from '@/components/features/today/TodayFocus';
import { TodayTasks } from '@/components/features/today/TodayTasks';
import { TimeBlocks } from '@/components/features/today/TimeBlocks';
import { HabitsSummary } from '@/components/features/today/HabitsSummary';
import { EnergyCheckIn } from '@/components/features/today/EnergyCheckIn';
import { CoachNudge } from '@/components/features/today/CoachNudge';
import { useTaskActions } from '@/hooks/useTaskActions';
import { useDailyFlow } from '@/hooks/useDailyFlow';
import { useHabitStore } from '@/stores/useHabitStore';
import { useDailyPlanStore } from '@/stores/useDailyPlanStore';
import { useProfileStore } from '@/stores/useProfileStore';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};
const pageTransition = { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const };

export default function TodayPage() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();

  // Store-driven data
  const { todayTasks, focusTask, completeTask, reorderTasks } = useTaskActions();
  const { focusTask: energyFocusTask } = useDailyFlow();
  const habits = useHabitStore((s) => s.habits);
  const completions = useHabitStore((s) => s.completions);
  const toggleHabit = useHabitStore((s) => s.toggleHabit);
  const blocks = useDailyPlanStore((s) => s.blocks);
  const streak = useProfileStore((s) => s.profile?.streak_current ?? 0);

  // Pick best focus task: energy-matched > task-actions > null (show empty state)
  const displayFocusTask = energyFocusTask ?? focusTask ?? null;

  const handleStartSession = useCallback(() => {
    if (displayFocusTask) {
      router.push(`/app/focus?task=${displayFocusTask.id}`);
    }
  }, [router, displayFocusTask]);

  const handleToggleTask = useCallback(
    (id: string) => {
      completeTask(id);
    },
    [completeTask],
  );

  const handleReorderTasks = useCallback(
    (taskIds: string[]) => {
      reorderTasks(taskIds);
    },
    [reorderTasks],
  );

  const handleToggleHabit = useCallback(
    (id: string) => {
      toggleHabit(id);
    },
    [toggleHabit],
  );

  // Derive today's habits from raw state (avoids infinite loop from calling selector in useStore)
  const todayHabits = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return habits
      .filter((h) => h.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((h) => ({
        id: h.id,
        title: h.title,
        routineType: h.routine_type,
        currentStreak: h.streak_current,
        estimatedMinutes: h.estimated_minutes,
        completed: completions.some((c) => c.habit_id === h.id && c.completed_date === today),
      }));
  }, [habits, completions]);

  // Map blocks to component shape (add id for TimeBlocks component)
  const blockItems = blocks.map((b) => ({
    id: b.id,
    start: b.start,
    end: b.end,
    label: b.label,
    energy: b.energy,
  }));

  return (
    <motion.div
      className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto"
      variants={reducedMotion ? undefined : pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      <div className="flex flex-col gap-8">
        <GreetingHeader streak={streak} />

        {/* Energy check-in — quick daily pulse */}
        <EnergyCheckIn />

        {/* AI coach nudge — personalized motivation */}
        <CoachNudge />

        {displayFocusTask && (
          <TodayFocus task={displayFocusTask} onStartSession={handleStartSession} />
        )}
        <section className="bg-bg-secondary rounded-xl border border-white/[0.06] hover:border-white/[0.10] transition-all duration-200 p-5">
          <TodayTasks
            initialTasks={todayTasks}
            onToggleTask={handleToggleTask}
            onReorder={handleReorderTasks}
          />
        </section>
        <section className="bg-bg-secondary rounded-xl border border-white/[0.06] hover:border-white/[0.10] transition-all duration-200 p-5">
          <TimeBlocks blocks={blockItems} />
        </section>
        <section className="bg-bg-secondary rounded-xl border border-white/[0.06] hover:border-white/[0.10] transition-all duration-200 p-5">
          <HabitsSummary
            initialHabits={todayHabits}
            onToggleHabit={handleToggleHabit}
          />
        </section>
      </div>
    </motion.div>
  );
}
