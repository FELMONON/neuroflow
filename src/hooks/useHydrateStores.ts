import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTaskStore } from '@/stores/useTaskStore';
import { useHabitStore } from '@/stores/useHabitStore';
import { useDailyPlanStore } from '@/stores/useDailyPlanStore';
import { useProfileStore } from '@/stores/useProfileStore';
import type { Task, CheckIn } from '@/types/database';

/**
 * Hydrates all stores from Supabase on mount.
 * Guards on auth state — only syncs when authenticated.
 * Uses a ref guard to prevent double-hydration in StrictMode.
 *
 * Mount once in layout-client.tsx.
 */
export function useHydrateStores() {
  const hydrated = useRef<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function hydrate() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Not authenticated — clear hydration ref so a new login triggers re-hydration
        hydrated.current = null;
        return;
      }

      // Skip re-hydration for the same user
      if (hydrated.current === user.id) return;
      hydrated.current = user.id;

      // Authenticated — hydrate from Supabase in parallel
      const taskStore = useTaskStore.getState();
      const habitStore = useHabitStore.getState();
      const planStore = useDailyPlanStore.getState();
      const profileStore = useProfileStore.getState();

      // Set today's date for the daily plan store
      const today = new Date().toISOString().split('T')[0];
      planStore.setCurrentDate(today);

      // Task store: fetch from Supabase
      const taskHydration = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .not('status', 'eq', 'archived')
        .order('sort_order')
        .then(({ data, error }) => {
          if (error) {
            console.error('[useHydrateStores] task fetch error:', error.message);
            return;
          }
          if (data) {
            taskStore.setTasks(data as Task[]);
          }
        });

      // Profile hydration: fetch latest check-in
      const profileHydration = supabase
        .from('check_ins')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .then(({ data, error }) => {
          if (error) {
            console.error('[useHydrateStores] check-in fetch error:', error.message);
            return;
          }
          if (data && data.length > 0) {
            profileStore.setLatestCheckIn(data[0] as CheckIn);
          }
        });

      await Promise.all([
        taskHydration,
        habitStore.hydrateFromSupabase(),
        planStore.hydrateFromSupabase(),
        profileHydration,
      ]);
    }

    hydrate().catch((err) => {
      console.error('[useHydrateStores] hydration failed:', err);
    });

    // Re-hydrate when auth state changes (login/logout/user switch)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && session.user.id !== hydrated.current) {
        hydrate().catch((err) => {
          console.error('[useHydrateStores] re-hydration failed:', err);
        });
      } else if (!session) {
        hydrated.current = null;
        // Clear store data on logout
        useTaskStore.getState().setTasks([]);
        useHabitStore.getState().setHabits([]);
        useDailyPlanStore.getState().setBlocks([]);
        useProfileStore.getState().setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
}
