import { useCallback, useRef } from 'react';
import { useProfileStore } from '@/stores/useProfileStore';

/** XP values for different events */
const XP_REWARDS = {
  taskComplete: 15,
  habitComplete: 10,
  focusSessionComplete: 25,
  checkIn: 5,
} as const;

interface GameLoopResult {
  xpGained: number;
  levelUp: boolean;
  newAchievements: string[];
}

/**
 * Listens for task/habit completions, focus session ends.
 * Awards XP via useProfileStore.addXP().
 * Checks achievement thresholds.
 */
export function useGameLoop() {
  const addXP = useProfileStore((s) => s.addXP);
  const incrementStreak = useProfileStore((s) => s.incrementStreak);
  const getLevel = useProfileStore((s) => s.getLevel);

  // Track last XP event to avoid duplicate awards within the same render
  const lastEventRef = useRef<string>('');

  const awardXP = useCallback(
    (event: keyof typeof XP_REWARDS, eventId?: string): GameLoopResult => {
      const dedupeKey = `${event}-${eventId ?? Date.now()}`;
      if (lastEventRef.current === dedupeKey) {
        return { xpGained: 0, levelUp: false, newAchievements: [] };
      }
      lastEventRef.current = dedupeKey;

      const prevLevel = getLevel();
      const xp = XP_REWARDS[event];
      addXP(xp);
      const newLevel = getLevel();
      const levelUp = newLevel > prevLevel;

      // Achievement checking is lightweight — just slug-based for now
      const newAchievements: string[] = [];

      return { xpGained: xp, levelUp, newAchievements };
    },
    [addXP, getLevel],
  );

  const onTaskComplete = useCallback(
    (taskId: string) => awardXP('taskComplete', taskId),
    [awardXP],
  );

  const onHabitComplete = useCallback(
    (habitId: string) => awardXP('habitComplete', habitId),
    [awardXP],
  );

  const onFocusSessionComplete = useCallback(
    (sessionId: string) => awardXP('focusSessionComplete', sessionId),
    [awardXP],
  );

  const onCheckIn = useCallback(
    () => awardXP('checkIn'),
    [awardXP],
  );

  const onDailyGoalsMet = useCallback(() => {
    incrementStreak();
  }, [incrementStreak]);

  return {
    onTaskComplete,
    onHabitComplete,
    onFocusSessionComplete,
    onCheckIn,
    onDailyGoalsMet,
  };
}
