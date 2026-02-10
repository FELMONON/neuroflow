import { useMemo } from 'react';
import { useTaskStore } from '@/stores/useTaskStore';
import { useDailyPlanStore, type PlanTimeBlock } from '@/stores/useDailyPlanStore';
import { useEnergyState } from '@/hooks/useEnergyState';
import type { EnergyLevel } from '@/types/database';

/** Shape expected by TodayFocus component */
interface FocusTask {
  id: string;
  title: string;
  estimatedMinutes: number;
  energyRequired: EnergyLevel;
}

function energyLevelFromNumber(n: number | null): EnergyLevel {
  if (n === null) return 'medium';
  if (n >= 4) return 'high';
  if (n >= 3) return 'medium';
  if (n >= 2) return 'low';
  return 'recharge';
}

/**
 * Combines energy check-in state with daily plan + task data
 * to produce smart focus recommendations.
 */
export function useDailyFlow() {
  const tasks = useTaskStore((s) => s.tasks);
  const blocks = useDailyPlanStore((s) => s.blocks);
  const { currentEnergy } = useEnergyState();

  const energyState = energyLevelFromNumber(currentEnergy);

  /** Focus task suggestion based on energy match */
  const focusTask: FocusTask | null = useMemo(() => {
    const available = tasks.filter(
      (t) => (t.status === 'today' || t.status === 'in_progress') && !t.completed_at,
    );
    if (available.length === 0) return null;

    // Prefer tasks matching current energy level
    const energyMatched = available.filter((t) => t.energy_required === energyState);
    const candidate = energyMatched.length > 0
      ? energyMatched.sort((a, b) => a.sort_order - b.sort_order)[0]
      : available.sort((a, b) => a.sort_order - b.sort_order)[0];

    return {
      id: candidate.id,
      title: candidate.title,
      estimatedMinutes: candidate.estimated_minutes ?? 25,
      energyRequired: candidate.energy_required,
    };
  }, [tasks, energyState]);

  /** Suggested blocks based on energy */
  const suggestedBlocks: PlanTimeBlock[] = useMemo(() => {
    return blocks.filter((b) => !b.isBreak && b.energy === energyState);
  }, [blocks, energyState]);

  return {
    focusTask,
    suggestedBlocks,
    energyState,
  };
}
