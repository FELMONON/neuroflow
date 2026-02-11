'use client';

import { Inbox, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button, EmptyState } from '@/components/ui';
import type { EnergyLevel } from '@/types/database';
import clsx from 'clsx';

const ENERGY_BORDER: Record<EnergyLevel, string> = {
  high: 'border-l-energy-high',
  medium: 'border-l-energy-medium',
  low: 'border-l-energy-low',
  recharge: 'border-l-energy-recharge',
};

const ENERGY_DOT: Record<EnergyLevel, string> = {
  high: 'bg-energy-high',
  medium: 'bg-energy-medium',
  low: 'bg-energy-low',
  recharge: 'bg-energy-recharge',
};

interface UnscheduledTask {
  id: string;
  title: string;
  estimate: string;
  estimateMinutes: number;
  energy: EnergyLevel;
}

interface UnscheduledSidebarProps {
  tasks: UnscheduledTask[];
  projectedSlots: Map<string, string>;
  nextSlot: string | null;
  aiPlanLoading: boolean;
  onQuickAdd: (taskId: string) => void;
  onSmartSchedule: () => void;
  onAIPlan: () => void;
}

export function UnscheduledSidebar({
  tasks,
  projectedSlots,
  nextSlot,
  aiPlanLoading,
  onQuickAdd,
  onSmartSchedule,
  onAIPlan,
}: UnscheduledSidebarProps) {
  return (
    <Card
      header={
        <div>
          <span className="text-sm font-medium text-text-secondary">Unscheduled tasks</span>
          <p className="text-[10px] text-text-muted mt-0.5">Colored by energy needed</p>
        </div>
      }
    >
      {tasks.length === 0 ? (
        <EmptyState
          icon={<Inbox />}
          title="All tasks scheduled"
          description="Nothing left to place. Nice work."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {tasks.length > 1 && nextSlot && (
            <div className="flex flex-col gap-1.5 mb-1">
              <button
                onClick={onSmartSchedule}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-lg bg-accent-flow/[0.08] border border-accent-flow/[0.12] text-sm font-medium text-accent-flow hover:bg-accent-flow/[0.12] hover:border-accent-flow/[0.18] transition-all duration-200 cursor-pointer active:scale-[0.99]"
              >
                <Sparkles size={14} />
                <span>Smart Schedule</span>
              </button>
              <button
                onClick={onAIPlan}
                disabled={aiPlanLoading}
                className={clsx(
                  'flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-lg border text-sm font-medium transition-all duration-200 cursor-pointer active:scale-[0.99]',
                  aiPlanLoading
                    ? 'bg-accent-grow/[0.04] border-accent-grow/[0.08] text-accent-grow/60'
                    : 'bg-accent-grow/[0.08] border-accent-grow/[0.12] text-accent-grow hover:bg-accent-grow/[0.12] hover:border-accent-grow/[0.18]',
                )}
              >
                <Sparkles size={14} />
                <span>{aiPlanLoading ? 'AI is planning...' : 'AI Plan My Day'}</span>
              </button>
            </div>
          )}
          <AnimatePresence>
            {tasks.map((task) => {
              const slot = projectedSlots.get(task.id);
              return (
                <motion.button
                  key={task.id}
                  type="button"
                  layout
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                  onClick={() => onQuickAdd(task.id)}
                  disabled={!slot}
                  className={clsx(
                    'flex items-center gap-2 py-2.5 px-3 border rounded-lg transition-all duration-150 text-left w-full',
                    'border-l-2',
                    ENERGY_BORDER[task.energy],
                    slot
                      ? 'border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.10] cursor-pointer active:scale-[0.99]'
                      : 'border-white/[0.04] opacity-50',
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-text-primary block truncate">{task.title}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={clsx('w-1.5 h-1.5 rounded-full', ENERGY_DOT[task.energy])} />
                      <span className="text-xs text-text-muted">{task.estimate}</span>
                    </div>
                  </div>
                  {slot && (
                    <span className="flex items-center gap-1 text-xs text-text-muted shrink-0">
                      <ArrowRight size={12} />
                      <span className="font-mono tabular-nums">{slot}</span>
                    </span>
                  )}
                </motion.button>
              );
            })}
          </AnimatePresence>
          {tasks.length > 0 && nextSlot && (
            <p className="text-xs text-text-muted mt-1">
              Tap to schedule sequentially from <span className="font-mono tabular-nums text-accent-flow">{nextSlot}</span>
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
