import { describe, it, expect, beforeEach } from 'vitest';
import type { Habit, HabitCompletion, RoutineType } from '@/types/database';
import { useHabitStore } from '../useHabitStore';

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: overrides.id ?? '1',
    user_id: 'user-1',
    title: 'Test habit',
    description: null,
    cue: null,
    routine_type: 'morning' as RoutineType,
    frequency: 'daily',
    custom_days: [],
    estimated_minutes: 5,
    sort_order: 0,
    streak_current: 0,
    streak_best: 0,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeCompletion(overrides: Partial<HabitCompletion> = {}): HabitCompletion {
  return {
    id: overrides.id ?? 'comp-1',
    habit_id: overrides.habit_id ?? '1',
    user_id: 'user-1',
    completed_date: overrides.completed_date ?? new Date().toISOString().split('T')[0],
    completed_at: '2024-01-01T08:00:00Z',
    notes: null,
    ...overrides,
  };
}

const today = new Date().toISOString().split('T')[0];

describe('useHabitStore selectors', () => {
  beforeEach(() => {
    useHabitStore.setState({ habits: [], completions: [], isLoading: false });
  });

  describe('getTodayHabits', () => {
    it('returns active habits with completion status for today', () => {
      useHabitStore.setState({
        habits: [
          makeHabit({ id: 'h1', sort_order: 1 }),
          makeHabit({ id: 'h2', sort_order: 0 }),
        ],
        completions: [makeCompletion({ habit_id: 'h1', completed_date: today })],
      });

      const todayHabits = useHabitStore.getState().getTodayHabits();
      expect(todayHabits.length).toBe(2);
      // Sorted by sort_order
      expect(todayHabits[0].id).toBe('h2');
      expect(todayHabits[1].id).toBe('h1');
      // Completion status
      expect(todayHabits[0].completed).toBe(false);
      expect(todayHabits[1].completed).toBe(true);
    });

    it('excludes inactive habits', () => {
      useHabitStore.setState({
        habits: [
          makeHabit({ id: 'h1', is_active: true }),
          makeHabit({ id: 'h2', is_active: false }),
        ],
        completions: [],
      });

      const todayHabits = useHabitStore.getState().getTodayHabits();
      expect(todayHabits.length).toBe(1);
      expect(todayHabits[0].id).toBe('h1');
    });

    it('does not mark habits as completed from a different date', () => {
      useHabitStore.setState({
        habits: [makeHabit({ id: 'h1' })],
        completions: [makeCompletion({ habit_id: 'h1', completed_date: '2020-01-01' })],
      });

      const todayHabits = useHabitStore.getState().getTodayHabits();
      expect(todayHabits[0].completed).toBe(false);
    });
  });

  describe('getCompletionRate', () => {
    it('returns 0 when there are no active habits', () => {
      useHabitStore.setState({ habits: [], completions: [] });
      expect(useHabitStore.getState().getCompletionRate()).toBe(0);
    });

    it('returns 0 when no habits are completed today', () => {
      useHabitStore.setState({
        habits: [makeHabit({ id: 'h1' }), makeHabit({ id: 'h2' })],
        completions: [],
      });
      expect(useHabitStore.getState().getCompletionRate()).toBe(0);
    });

    it('returns 0.5 when half of habits are completed', () => {
      useHabitStore.setState({
        habits: [makeHabit({ id: 'h1' }), makeHabit({ id: 'h2' })],
        completions: [makeCompletion({ habit_id: 'h1', completed_date: today })],
      });
      expect(useHabitStore.getState().getCompletionRate()).toBe(0.5);
    });

    it('returns 1 when all habits are completed', () => {
      useHabitStore.setState({
        habits: [makeHabit({ id: 'h1' }), makeHabit({ id: 'h2' })],
        completions: [
          makeCompletion({ id: 'c1', habit_id: 'h1', completed_date: today }),
          makeCompletion({ id: 'c2', habit_id: 'h2', completed_date: today }),
        ],
      });
      expect(useHabitStore.getState().getCompletionRate()).toBe(1);
    });

    it('ignores inactive habits in the rate calculation', () => {
      useHabitStore.setState({
        habits: [
          makeHabit({ id: 'h1', is_active: true }),
          makeHabit({ id: 'h2', is_active: false }),
        ],
        completions: [makeCompletion({ habit_id: 'h1', completed_date: today })],
      });
      // Only 1 active habit, and it's completed → 100%
      expect(useHabitStore.getState().getCompletionRate()).toBe(1);
    });
  });

  describe('getStreaks', () => {
    it('returns { current: 0, best: 0 } with no active habits', () => {
      useHabitStore.setState({ habits: [] });
      expect(useHabitStore.getState().getStreaks()).toEqual({ current: 0, best: 0 });
    });

    it('returns the max current and best streak across active habits', () => {
      useHabitStore.setState({
        habits: [
          makeHabit({ id: 'h1', streak_current: 5, streak_best: 10, is_active: true }),
          makeHabit({ id: 'h2', streak_current: 8, streak_best: 8, is_active: true }),
          makeHabit({ id: 'h3', streak_current: 20, streak_best: 30, is_active: false }),
        ],
      });

      const streaks = useHabitStore.getState().getStreaks();
      expect(streaks.current).toBe(8);
      expect(streaks.best).toBe(10);
    });
  });

  describe('getByRoutineType', () => {
    it('returns only active habits of the given routine type', () => {
      useHabitStore.setState({
        habits: [
          makeHabit({ id: 'h1', routine_type: 'morning', is_active: true }),
          makeHabit({ id: 'h2', routine_type: 'evening', is_active: true }),
          makeHabit({ id: 'h3', routine_type: 'morning', is_active: false }),
          makeHabit({ id: 'h4', routine_type: 'morning', is_active: true }),
        ],
      });

      const morning = useHabitStore.getState().getByRoutineType('morning');
      expect(morning.length).toBe(2);
      expect(morning.map((h) => h.id)).toEqual(['h1', 'h4']);
    });

    it('returns empty array for a routine type with no habits', () => {
      useHabitStore.setState({
        habits: [makeHabit({ routine_type: 'morning' })],
      });
      expect(useHabitStore.getState().getByRoutineType('evening')).toEqual([]);
    });
  });
});
