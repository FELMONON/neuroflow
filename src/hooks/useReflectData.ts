'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useProfileStore } from '@/stores/useProfileStore';
import { showToast } from '@/components/ui/Toast';
import type { CheckIn } from '@/types/database';

interface InsightDay {
  date: string;
  mood: number;
  energy: number;
  focus: number;
}

export function useReflectData() {
  const [insightsData, setInsightsData] = useState<InsightDay[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);

  const supabase = useMemo(() => createClient(), []);
  const setLatestCheckIn = useProfileStore((s) => s.setLatestCheckIn);

  useEffect(() => {
    async function loadCheckIns() {
      setInsightsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setInsightsLoading(false); return; }

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data } = await supabase
        .from('check_ins')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (data && data.length > 0) {
        setInsightsData(data.map((c) => ({
          date: (c.created_at ?? '').split('T')[0],
          mood: (c.mood as number | null) ?? 3,
          energy: (c.energy as number | null) ?? 3,
          focus: (c.focus_ability as number | null) ?? 3,
        })));
      }
      setInsightsLoading(false);
    }
    loadCheckIns();
  }, [supabase]);

  const handleCheckIn = useCallback(
    async (data: { mood: number; energy: number; focus: number; emotions: string[]; note: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast({ message: 'You must be signed in to check in.', variant: 'error' });
        return;
      }

      const { data: checkIn, error } = await supabase
        .from('check_ins')
        .insert({
          user_id: user.id, mood: data.mood, energy: data.energy,
          focus_ability: data.focus, emotions: data.emotions, note: data.note || null,
        })
        .select()
        .single();

      if (error) {
        showToast({ message: 'Could not save check-in. Try again?', variant: 'error' });
        return;
      }

      if (checkIn) setLatestCheckIn(checkIn as CheckIn);
      showToast({ message: 'Check-in saved!', variant: 'success' });

      setInsightsData((prev) => [
        ...prev,
        { date: new Date().toISOString().split('T')[0], mood: data.mood, energy: data.energy, focus: data.focus },
      ]);
    },
    [supabase, setLatestCheckIn],
  );

  const handleReflection = useCallback(
    async (data: { wins: string[]; struggles: string[]; tomorrow: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast({ message: 'You must be signed in to reflect.', variant: 'error' });
        return;
      }

      const todayDate = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('daily_plans')
        .upsert(
          {
            user_id: user.id, plan_date: todayDate,
            evening_reflection: data.tomorrow || null, wins: data.wins, struggles: data.struggles,
          },
          { onConflict: 'user_id,plan_date' },
        );

      if (error) {
        showToast({ message: 'Could not save reflection. Try again?', variant: 'error' });
        return;
      }
      showToast({ message: 'Reflection saved!', variant: 'success' });
    },
    [supabase],
  );

  return { insightsData, insightsLoading, handleCheckIn, handleReflection };
}
