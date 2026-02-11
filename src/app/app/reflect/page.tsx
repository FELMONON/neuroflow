'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { QuickCheckIn } from '@/components/features/reflect/QuickCheckIn';
import { EveningReflection } from '@/components/features/reflect/EveningReflection';
import { InsightsDashboard } from '@/components/features/reflect/InsightsDashboard';
import { useReflectData } from '@/hooks/useReflectData';
import clsx from 'clsx';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};
const pageTransition = { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const };

type Tab = 'checkin' | 'insights';

const TABS: { id: Tab; label: string }[] = [
  { id: 'checkin', label: 'Check In' },
  { id: 'insights', label: 'Insights' },
];

export default function ReflectPage() {
  const [activeTab, setActiveTab] = useState<Tab>('checkin');
  const { insightsData, insightsLoading, handleCheckIn, handleReflection } = useReflectData();
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto flex flex-col gap-6"
      variants={reducedMotion ? undefined : pageVariants}
      initial="initial" animate="animate" exit="exit" transition={pageTransition}
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
            icon={<Heart />} title="Take a moment to check in"
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
