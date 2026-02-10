'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { showToast } from '@/components/ui/Toast';
import { QuickCheckIn } from '@/components/features/reflect/QuickCheckIn';
import { EveningReflection } from '@/components/features/reflect/EveningReflection';
import { InsightsDashboard } from '@/components/features/reflect/InsightsDashboard';
import { createClient } from '@/lib/supabase/client';
import { useProfileStore } from '@/stores/useProfileStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { useHabitStore } from '@/stores/useHabitStore';
import type { CheckIn } from '@/types/database';
import clsx from 'clsx';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};
const pageTransition = { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const };

type Tab = 'checkin' | 'insights';

interface InsightDay {
  date: string;
  mood: number;
  energy: number;
  focus: number;
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'checkin', label: 'Check In' },
  { id: 'insights', label: 'Insights' },
];

export default function ReflectPage() {
  const [activeTab, setActiveTab] = useState<Tab>('checkin');
  const [insightsData, setInsightsData] = useState<InsightDay[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);

  const supabase = useMemo(() => createClient(), []);
  const setLatestCheckIn = useProfileStore((s) => s.setLatestCheckIn);

  // Read today's progress for evening reflection context
  const completedTasks = useTaskStore((s) => s.tasks.filter((t) => t.status === 'done').length);
  const totalTodayTasks = useTaskStore((s) => s.tasks.filter((t) => t.status === 'today' || t.status === 'in_progress' || t.status === 'done').length);
  const habitCompletionRate = useHabitStore((s) => s.getCompletionRate());
  // These are available for the AI summary context — currently passed through the reflection handler
  void completedTasks;
  void totalTodayTasks;
  void habitCompletionRate;

  // Load historical check-in data for insights
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
        const mapped: InsightDay[] = (data as CheckIn[]).map((c) => ({
          date: c.created_at.split('T')[0],
          mood: c.mood ?? 3,
          energy: c.energy ?? 3,
          focus: c.focus_ability ?? 3,
        }));
        setInsightsData(mapped);
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
          user_id: user.id,
          mood: data.mood,
          energy: data.energy,
          focus_ability: data.focus,
          emotions: data.emotions,
          note: data.note || null,
        })
        .select()
        .single();

      if (error) {
        showToast({ message: 'Could not save check-in. Try again?', variant: 'error' });
        return;
      }

      setLatestCheckIn(checkIn as CheckIn);
      showToast({ message: 'Check-in saved!', variant: 'success' });

      // Update insights data with the new check-in
      setInsightsData((prev) => [
        ...prev,
        {
          date: new Date().toISOString().split('T')[0],
          mood: data.mood,
          energy: data.energy,
          focus: data.focus,
        },
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

      // Upsert into daily_plans — update if a plan for today exists, otherwise create one
      const { error } = await supabase
        .from('daily_plans')
        .upsert(
          {
            user_id: user.id,
            plan_date: todayDate,
            evening_reflection: data.tomorrow || null,
            wins: data.wins,
            struggles: data.struggles,
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

  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto flex flex-col gap-6"
      variants={reducedMotion ? undefined : pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      <h1 className="text-2xl font-semibold text-text-primary">Reflect</h1>

      <div className="flex gap-1 p-1 bg-white/[0.04] rounded-xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 active:scale-[0.98] cursor-pointer',
              activeTab === tab.id
                ? 'bg-accent-flow text-white shadow-sm'
                : 'text-text-muted hover:text-text-secondary',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'checkin' && (
        <div className="flex flex-col gap-6">
          <QuickCheckIn onSubmit={handleCheckIn} />
          <EveningReflection onSubmit={handleReflection} />
        </div>
      )}

      {activeTab === 'insights' && (
        insightsLoading ? (
          <div className="flex flex-col gap-4">
            <div className="h-32 rounded-xl bg-white/[0.04] animate-pulse" />
            <div className="h-32 rounded-xl bg-white/[0.04] animate-pulse" />
          </div>
        ) : insightsData.length === 0 ? (
          <EmptyState
            icon={<Heart />}
            title="Take a moment to check in"
            description="Once you start logging how you feel, patterns will show up here to help you understand your rhythm."
            action={{ label: 'Check In Now', onClick: () => setActiveTab('checkin') }}
          />
        ) : (
          <InsightsDashboard data={insightsData} />
        )
      )}
    </motion.div>
  );
}
