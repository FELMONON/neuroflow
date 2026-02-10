'use client';

import { useState, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import { Modal, Button } from '@/components/ui';
import { breakDownTask } from '@/lib/ai';
import type { Task, Subtask, EnergyLevel } from '@/types/database';

interface AIBreakdownProps {
  open: boolean;
  onClose: () => void;
  task: Task | null;
  onApply: (taskId: string, subtasks: Subtask[]) => void;
}

const energyDot: Record<EnergyLevel, string> = {
  high: 'bg-energy-high',
  medium: 'bg-energy-medium',
  low: 'bg-energy-low',
  recharge: 'bg-energy-recharge',
};

function generateFallbackSubtasks(task: Task): Subtask[] {
  return [
    { title: `Gather requirements for "${task.title}"`, estimated_minutes: 5, energy_required: 'low', completed: false },
    { title: 'Set up workspace and open relevant files', estimated_minutes: 3, energy_required: 'low', completed: false },
    { title: 'Work on the main part', estimated_minutes: Math.max(10, (task.estimated_minutes ?? 25) - 15), energy_required: task.energy_required, completed: false },
    { title: 'Review and polish', estimated_minutes: 5, energy_required: 'medium', completed: false },
    { title: 'Mark as complete', estimated_minutes: 2, energy_required: 'low', completed: false },
  ];
}

export function AIBreakdown({ open, onClose, task, onApply }: AIBreakdownProps) {
  const [loading, setLoading] = useState(false);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    if (!task) return;
    setLoading(true);
    setSubtasks([]);
    setError(null);

    try {
      const data = await breakDownTask(task.title, task.description ?? undefined);
      if (data.subtasks && Array.isArray(data.subtasks)) {
        const mapped: Subtask[] = data.subtasks.map((s: { title: string; estimated_minutes: number; energy_required: EnergyLevel }) => ({
          title: s.title,
          estimated_minutes: s.estimated_minutes,
          energy_required: s.energy_required,
          completed: false,
        }));
        setSubtasks(mapped);
      } else {
        throw new Error('Unexpected response');
      }
    } catch (err) {
      // Fallback to local generation if AI fails (e.g. not authenticated)
      console.warn('[AIBreakdown] AI call failed, using fallback:', err);
      setSubtasks(generateFallbackSubtasks(task));
      setError('AI unavailable — showing suggested breakdown');
    } finally {
      setLoading(false);
    }
  }, [task]);

  useEffect(() => {
    if (open && task) { generate(); }
    return () => { setSubtasks([]); setError(null); };
  }, [open, task, generate]);

  const handleApply = () => {
    if (task) {
      onApply(task.id, subtasks);
      onClose();
    }
  };

  const totalMinutes = subtasks.reduce((acc, s) => acc + s.estimated_minutes, 0);

  return (
    <Modal open={open} onClose={onClose} title="Break down task" size="md">
      <div className="space-y-4">
        {task && (
          <p className="text-sm text-text-secondary">{task.title}</p>
        )}

        {loading && (
          <div className="py-8 text-center space-y-2">
            <div className="flex justify-center gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-accent-flow animate-pulse"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
            <p className="text-sm text-text-muted">AI is breaking this down...</p>
          </div>
        )}

        {error && (
          <p className="text-xs text-accent-sun/80 text-center">{error}</p>
        )}

        {!loading && subtasks.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Steps</p>
              <span className="text-xs text-text-muted font-mono tabular-nums">{totalMinutes}m total</span>
            </div>

            <ol className="space-y-2">
              {subtasks.map((sub, i) => (
                <li key={i} className="flex items-center gap-3 p-3 rounded-xl bg-bg-secondary border border-white/[0.06]">
                  <span className="text-xs font-bold text-text-muted w-5 text-center shrink-0">{i + 1}</span>
                  <span className="flex-1 text-sm text-text-primary">{sub.title}</span>
                  <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', energyDot[sub.energy_required])} aria-hidden="true" />
                  <span className="text-[10px] text-text-muted font-mono tabular-nums">{sub.estimated_minutes}m</span>
                </li>
              ))}
            </ol>

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleApply} className="flex-1">Apply</Button>
              <button
                onClick={generate}
                className="text-sm text-accent-flow hover:text-accent-flow/80 transition-all duration-200 active:scale-[0.98] cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none rounded-lg px-1 py-0.5"
              >
                Try again
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
