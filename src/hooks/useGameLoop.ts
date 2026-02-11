import { useCallback, useRef } from 'react';
import { useProfileStore } from '@/stores/useProfileStore';
import { useSessionStore } from '@/stores/useSessionStore';
import { showToast } from '@/components/ui/Toast';

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

/** Debounced achievement check — fires at most once per 60 seconds. */
let _achievementTimer: ReturnType<typeof setTimeout> | null = null;
let _lastAchievementCheck = 0;
const ACHIEVEMENT_CHECK_COOLDOWN = 60_000; // 1 minute

function scheduleAchievementCheck() {
  const now = Date.now();
  if (now - _lastAchievementCheck < ACHIEVEMENT_CHECK_COOLDOWN) {
    // Already checked recently — schedule for after cooldown expires
    if (!_achievementTimer) {
      const delay = ACHIEVEMENT_CHECK_COOLDOWN - (now - _lastAchievementCheck);
      _achievementTimer = setTimeout(() => {
        _achievementTimer = null;
        runAchievementCheck();
      }, delay);
    }
    return;
  }
  runAchievementCheck();
}

async function runAchievementCheck() {
  _lastAchievementCheck = Date.now();
  try {
    const res = await fetch('/api/gamification/check-achievements', {
      method: 'POST',
    });
    if (!res.ok) return;
    const data = await res.json() as {
      newly_unlocked?: { title: string; xp_reward: number }[];
    };
    if (data.newly_unlocked && data.newly_unlocked.length > 0) {
      for (const achievement of data.newly_unlocked) {
        showToast({
          message: `Achievement unlocked: ${achievement.title} (+${achievement.xp_reward} XP)`,
          variant: 'success',
          duration: 5000,
        });
      }
    }
  } catch {
    // Silently fail — achievements are non-critical
  }
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

      // Trigger debounced achievement check via API
      scheduleAchievementCheck();

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
    (sessionId: string) => {
      const session = useSessionStore.getState().lastCompletedSession
        ?? useSessionStore.getState().currentSession;
      if (session && session.actual_duration != null && session.planned_duration > 0) {
        const ratio = session.actual_duration / session.planned_duration;
        let xp: number;
        if (ratio >= 0.8) {
          xp = 40;
        } else if (ratio >= 0.5) {
          xp = 25;
        } else {
          xp = 15;
        }

        const dedupeKey = `focusSessionComplete-${sessionId}`;
        if (lastEventRef.current === dedupeKey) {
          return { xpGained: 0, levelUp: false, newAchievements: [] };
        }
        lastEventRef.current = dedupeKey;

        const prevLevel = getLevel();
        addXP(xp);
        const newLevel = getLevel();
        scheduleAchievementCheck();
        return { xpGained: xp, levelUp: newLevel > prevLevel, newAchievements: [] };
      }
      // Fallback to flat reward if session data is unavailable
      return awardXP('focusSessionComplete', sessionId);
    },
    [awardXP, addXP, getLevel],
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
