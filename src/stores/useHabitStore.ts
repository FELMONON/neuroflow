import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type { Habit, HabitCompletion, RoutineType } from '@/types/database';

// Lazy singleton — created once on first mutation that needs Supabase
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) _supabase = createClient();
  return _supabase;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isPersistedId(id: string): boolean {
  return UUID_RE.test(id);
}

function todayDateStr(): string {
  return new Date().toISOString().split('T')[0];
}

interface HabitState {
  habits: Habit[];
  completions: HabitCompletion[];
  isLoading: boolean;

  // Actions
  setHabits: (habits: Habit[]) => void;
  toggleHabit: (id: string) => void;
  addHabit: (habit: Habit) => void;
  reorderHabits: (habitIds: string[]) => void;
  hydrateFromSupabase: () => Promise<void>;

  // Selectors
  getTodayHabits: () => (Habit & { completed: boolean })[];
  getCompletionRate: () => number;
  getStreaks: () => { current: number; best: number };
  getByRoutineType: (type: RoutineType) => Habit[];
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  completions: [],
  isLoading: false,

  setHabits: (habits) => set({ habits }),

  toggleHabit: (id) => {
    const today = todayDateStr();
    const existing = get().completions.find(
      (c) => c.habit_id === id && c.completed_date === today,
    );

    if (existing) {
      // Un-complete: remove completion, decrement streak
      set((state) => ({
        completions: state.completions.filter((c) => c.id !== existing.id),
        habits: state.habits.map((h) =>
          h.id === id ? { ...h, streak_current: Math.max(0, h.streak_current - 1) } : h,
        ),
      }));
      if (isPersistedId(existing.id)) {
        getSupabase().from('habit_completions').delete().eq('id', existing.id)
          .then(({ error }) => {
            if (error) console.error('[useHabitStore] remove completion sync error:', error.message);
          });
      }
    } else {
      // Complete: add completion, increment streak
      const completionId = isPersistedId(id) ? crypto.randomUUID() : `comp-${id}-${today}`;
      const completion: HabitCompletion = {
        id: completionId,
        habit_id: id,
        user_id: get().habits.find((h) => h.id === id)?.user_id ?? '',
        completed_date: today,
        completed_at: new Date().toISOString(),
        notes: null,
      };

      set((state) => ({
        completions: [...state.completions, completion],
        habits: state.habits.map((h) =>
          h.id === id
            ? { ...h, streak_current: h.streak_current + 1, streak_best: Math.max(h.streak_best, h.streak_current + 1) }
            : h,
        ),
      }));

      if (isPersistedId(id)) {
        getSupabase().from('habit_completions').insert(completion)
          .then(({ error }) => {
            if (error) console.error('[useHabitStore] add completion sync error:', error.message);
          });
      }
    }
  },

  addHabit: (habit) => {
    set((state) => ({ habits: [...state.habits, habit] }));
    if (!isPersistedId(habit.id)) return;
    getSupabase().from('habits').insert(habit)
      .then(({ error }) => {
        if (error) console.error('[useHabitStore] addHabit sync error:', error.message);
      });
  },

  reorderHabits: (habitIds) => {
    set((state) => ({
      habits: state.habits.map((h) => {
        const idx = habitIds.indexOf(h.id);
        return idx >= 0 ? { ...h, sort_order: idx } : h;
      }),
    }));
    const persistedIds = habitIds.filter(isPersistedId);
    if (persistedIds.length === 0) return;
    Promise.all(
      persistedIds.map((hid) =>
        getSupabase().from('habits').update({ sort_order: habitIds.indexOf(hid) }).eq('id', hid),
      ),
    ).catch((err) => {
      console.error('[useHabitStore] reorderHabits sync error:', err);
    });
  },

  hydrateFromSupabase: async () => {
    set({ isLoading: true });
    try {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { set({ isLoading: false }); return; }

      const [habitsRes, completionsRes] = await Promise.all([
        supabase.from('habits').select('*').eq('user_id', user.id).eq('is_active', true).order('sort_order'),
        supabase.from('habit_completions').select('*').eq('user_id', user.id).eq('completed_date', todayDateStr()),
      ]);

      if (habitsRes.error) {
        console.error('[useHabitStore] habits fetch error:', habitsRes.error.message);
      } else if (habitsRes.data) {
        set({ habits: habitsRes.data });
      }
      if (completionsRes.error) {
        console.error('[useHabitStore] completions fetch error:', completionsRes.error.message);
      } else if (completionsRes.data) {
        set({ completions: completionsRes.data });
      }
    } catch (err) {
      console.error('[useHabitStore] hydration error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  getTodayHabits: () => {
    const { habits, completions } = get();
    const today = todayDateStr();
    return habits
      .filter((h) => h.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((h) => ({
        ...h,
        completed: completions.some((c) => c.habit_id === h.id && c.completed_date === today),
      }));
  },

  getCompletionRate: () => {
    const { habits, completions } = get();
    const today = todayDateStr();
    const active = habits.filter((h) => h.is_active);
    if (active.length === 0) return 0;
    const done = active.filter((h) =>
      completions.some((c) => c.habit_id === h.id && c.completed_date === today),
    ).length;
    return done / active.length;
  },

  getStreaks: () => {
    const { habits } = get();
    const active = habits.filter((h) => h.is_active);
    if (active.length === 0) return { current: 0, best: 0 };
    const current = Math.max(...active.map((h) => h.streak_current));
    const best = Math.max(...active.map((h) => h.streak_best));
    return { current, best };
  },

  getByRoutineType: (type) => {
    return get().habits.filter((h) => h.routine_type === type && h.is_active);
  },
}));
