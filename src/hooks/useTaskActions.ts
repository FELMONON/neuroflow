import { useCallback, useMemo } from 'react';
import { useTaskStore } from '@/stores/useTaskStore';
import { useGameLoop } from '@/hooks/useGameLoop';
import type { EnergyLevel, TaskPriority } from '@/types/database';

/** Shape expected by TodayTasks component */
interface TaskItem {
  id: string;
  title: string;
  energyRequired: EnergyLevel;
  priority: TaskPriority;
  completed: boolean;
}

/** Shape expected by TodayFocus component */
interface FocusTask {
  id: string;
  title: string;
  estimatedMinutes: number;
  energyRequired: EnergyLevel;
}

/**
 * Wraps useTaskStore with side effects:
 * - completeTask → marks complete + triggers game loop XP
 * - Maps store data to component prop shapes (no component changes needed)
 */
export function useTaskActions() {
  const tasks = useTaskStore((s) => s.tasks);
  const completeTaskStore = useTaskStore((s) => s.completeTask);
  const reorderTasksStore = useTaskStore((s) => s.reorderTasks);
  const { onTaskComplete } = useGameLoop();

  const completeTask = useCallback(
    (id: string) => {
      completeTaskStore(id);
      onTaskComplete(id);
    },
    [completeTaskStore, onTaskComplete],
  );

  const reorderTasks = useCallback(
    (taskIds: string[]) => {
      reorderTasksStore(taskIds);
    },
    [reorderTasksStore],
  );

  /** Today's tasks mapped to TodayTasks component shape */
  const todayTasks: TaskItem[] = useMemo(() => {
    return tasks
      .filter((t) => t.status === 'today' || t.status === 'in_progress' || t.status === 'done')
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((t) => ({
        id: t.id,
        title: t.title,
        energyRequired: t.energy_required,
        priority: t.priority,
        completed: t.status === 'done',
      }));
  }, [tasks]);

  /** Focus task: first non-completed today task */
  const focusTask: FocusTask | null = useMemo(() => {
    const candidate = tasks
      .filter((t) => (t.status === 'today' || t.status === 'in_progress') && !t.completed_at)
      .sort((a, b) => a.sort_order - b.sort_order)[0];
    if (!candidate) return null;
    return {
      id: candidate.id,
      title: candidate.title,
      estimatedMinutes: candidate.estimated_minutes ?? 25,
      energyRequired: candidate.energy_required,
    };
  }, [tasks]);

  return {
    todayTasks,
    focusTask,
    completeTask,
    reorderTasks,
  };
}
