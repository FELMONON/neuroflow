'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { Card, EmptyState } from '@/components/ui';
import { LevelProgress } from '@/components/features/achievements/LevelProgress';
import { AchievementCard } from '@/components/features/achievements/AchievementCard';
import { getAllAchievements, xpForNextLevel, xpProgressInLevel } from '@/lib/achievements';
import { useProfileStore } from '@/stores/useProfileStore';
import { createClient } from '@/lib/supabase/client';
import type { AchievementCategory } from '@/types/database';
import clsx from 'clsx';

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

type TabFilter = 'all' | AchievementCategory;

const TABS: { value: TabFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'focus', label: 'Focus' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'streak', label: 'Streaks' },
  { value: 'habits', label: 'Habits' },
  { value: 'social', label: 'Social' },
  { value: 'emotional', label: 'Emotional' },
];

export default function AchievementsPage() {
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [unlockedSlugs, setUnlockedSlugs] = useState<Record<string, string>>({});
  const allAchievements = useMemo(() => getAllAchievements(), []);

  // Real profile data from store
  const profile = useProfileStore((s) => s.profile);
  const level = profile?.level ?? 1;
  const totalXP = profile?.xp_total ?? 0;

  // Load real unlocked achievements from Supabase
  useEffect(() => {
    async function loadAchievements() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch user achievements and achievement definitions separately
        const [uaRes, achRes] = await Promise.all([
          supabase.from('user_achievements').select('achievement_id, unlocked_at').eq('user_id', user.id),
          supabase.from('achievements').select('id, slug'),
        ]);

        if (uaRes.error) {
          console.error('[Achievements] Failed to load user achievements:', uaRes.error);
          return;
        }
        if (achRes.error) {
          console.error('[Achievements] Failed to load achievement definitions:', achRes.error);
          return;
        }

        if (uaRes.data && achRes.data) {
          const idToSlug = new Map(achRes.data.map((a) => [a.id, a.slug]));
          const slugMap: Record<string, string> = {};
          for (const row of uaRes.data) {
            const slug = idToSlug.get(row.achievement_id);
            if (slug) slugMap[slug] = row.unlocked_at;
          }
          setUnlockedSlugs(slugMap);
        }
      } catch (err) {
        console.error('[Achievements] Failed to load achievements:', err);
      }
    }
    loadAchievements();
  }, []);

  const UNLOCKED_SLUGS = unlockedSlugs;

  const unlockedCount = Object.keys(UNLOCKED_SLUGS).length;
  const totalCount = allAchievements.length;

  const filtered = useMemo(() => {
    const list =
      activeTab === 'all'
        ? allAchievements
        : allAchievements.filter((a) => a.category === activeTab);
    return [...list].sort((a, b) => {
      const aU = a.slug in UNLOCKED_SLUGS;
      const bU = b.slug in UNLOCKED_SLUGS;
      if (aU === bU) return 0;
      return aU ? -1 : 1;
    });
  }, [activeTab, allAchievements, UNLOCKED_SLUGS]);

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
      <h1 className="text-2xl font-semibold text-text-primary">Achievements</h1>

      <Card>
        <LevelProgress
          level={level}
          currentXP={xpProgressInLevel(totalXP, level)}
          xpForNext={xpForNextLevel(level)}
        />
      </Card>

      <div className="flex items-center justify-between">
        <div className="flex gap-2 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={clsx(
                'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 active:scale-[0.98] cursor-pointer',
                activeTab === tab.value
                  ? 'bg-accent-flow/10 text-accent-flow'
                  : 'text-text-muted hover:text-text-secondary',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-text-muted shrink-0 ml-2 font-mono tabular-nums">
          {unlockedCount} of {totalCount}
        </span>
      </div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        variants={reducedMotion ? undefined : staggerContainer}
        initial="initial"
        animate="animate"
        key={activeTab}
      >
        {filtered.map((a) => (
          <motion.div key={a.slug} variants={reducedMotion ? undefined : staggerItem}>
            <AchievementCard
              achievement={a}
              unlocked={a.slug in UNLOCKED_SLUGS}
              unlockedAt={UNLOCKED_SLUGS[a.slug]}
            />
          </motion.div>
        ))}
      </motion.div>

      {filtered.length === 0 && (
        <EmptyState
          icon={<Trophy />}
          title="Your trophy case awaits"
          description="Keep using NeuroFlow and you'll unlock achievements along the way. Every step counts."
        />
      )}
    </motion.div>
  );
}
