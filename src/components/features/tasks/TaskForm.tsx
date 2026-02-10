'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import clsx from 'clsx';
import { Modal, Button, Input } from '@/components/ui';
import type { Task, TaskPriority, EnergyLevel } from '@/types/database';

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (task: Partial<Task>) => void;
  initialTask?: Partial<Task>;
  mode?: 'create' | 'edit';
}

const TITLE_MAX = 100;

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const energyOptions: { value: EnergyLevel; label: string; hint: string }[] = [
  { value: 'high', label: 'High', hint: 'Deep work, complex thinking' },
  { value: 'medium', label: 'Medium', hint: 'Moderate focus tasks' },
  { value: 'low', label: 'Low', hint: 'Routine, low-effort tasks' },
  { value: 'recharge', label: 'Recharge', hint: 'Breaks, walks, rest' },
];

const timePresets = [15, 30, 45, 60];

export function TaskForm({ open, onClose, onSubmit, initialTask, mode = 'create' }: TaskFormProps) {
  const [title, setTitle] = useState(initialTask?.title ?? '');
  const [titleTouched, setTitleTouched] = useState(false);
  const [description, setDescription] = useState(initialTask?.description ?? '');
  const [priority, setPriority] = useState<TaskPriority>(initialTask?.priority ?? 'medium');
  const [energy, setEnergy] = useState<EnergyLevel>(initialTask?.energy_required ?? 'medium');
  const [estimatedMinutes, setEstimatedMinutes] = useState(initialTask?.estimated_minutes ?? 25);
  const titleRef = useRef<HTMLInputElement>(null);
  const prevInitialTaskRef = useRef(initialTask);

  useEffect(() => {
    if (initialTask !== prevInitialTaskRef.current) {
      prevInitialTaskRef.current = initialTask;
      if (initialTask) {
        const t = setTimeout(() => {
          setTitle(initialTask.title ?? '');
          setDescription(initialTask.description ?? '');
          setPriority(initialTask.priority ?? 'medium');
          setEnergy(initialTask.energy_required ?? 'medium');
          setEstimatedMinutes(initialTask.estimated_minutes ?? 25);
          setTitleTouched(false);
        }, 0);
        return () => clearTimeout(t);
      }
    }
  }, [initialTask]);

  useEffect(() => {
    if (open) {
      setTitleTouched(false);
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [open]);

  const reset = () => {
    setTitle('');
    setTitleTouched(false);
    setDescription('');
    setPriority('medium');
    setEnergy('medium');
    setEstimatedMinutes(25);
  };

  const titleError = titleTouched && !title.trim() ? 'Task title is required' : undefined;

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!title.trim()) {
      setTitleTouched(true);
      return;
    }
    onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      priority,
      energy_required: energy,
      estimated_minutes: estimatedMinutes,
      status: initialTask?.status ?? 'inbox',
    });
    reset();
    onClose();
  };

  const handleQuickAdd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && title.trim()) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const selectedEnergyHint = energyOptions.find((o) => o.value === energy)?.hint;

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title={mode === 'edit' ? 'Edit Task' : 'New Task'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Input
            ref={titleRef}
            placeholder="Task title... (Enter to quick save)"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
            onBlur={() => setTitleTouched(true)}
            onKeyDown={handleQuickAdd}
            error={titleError}
          />
          <div className="flex justify-end mt-1">
            <span className={clsx(
              'text-xs font-mono tabular-nums',
              title.length >= TITLE_MAX ? 'text-accent-spark' : 'text-text-muted',
            )}>
              {title.length}/{TITLE_MAX}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details..."
            rows={3}
            className="w-full rounded-xl bg-bg-secondary border border-white/[0.06] text-text-primary placeholder:text-text-muted p-3 text-sm resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
          />
        </div>

        <div className="flex flex-col gap-2">
          <span id="priority-label" className="text-sm font-medium text-text-secondary">Priority</span>
          <div className="flex gap-2" role="radiogroup" aria-labelledby="priority-label">
            {priorityOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={priority === opt.value}
                onClick={() => setPriority(opt.value)}
                className={clsx(
                  'flex-1 py-2 rounded-xl text-sm font-medium border transition-all duration-200 active:scale-[0.98] cursor-pointer',
                  'focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none',
                  priority === opt.value
                    ? 'bg-accent-flow/15 border-accent-flow/30 text-accent-flow'
                    : 'bg-white/[0.04] border-white/[0.06] text-text-muted hover:text-text-secondary',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span id="energy-label" className="text-sm font-medium text-text-secondary">Energy</span>
          <div className="flex gap-2" role="radiogroup" aria-labelledby="energy-label">
            {energyOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={energy === opt.value}
                onClick={() => setEnergy(opt.value)}
                className={clsx(
                  'flex-1 py-2 rounded-xl text-sm font-medium border transition-all duration-200 active:scale-[0.98] cursor-pointer',
                  'focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none',
                  energy === opt.value
                    ? 'bg-accent-flow/15 border-accent-flow/30 text-accent-flow'
                    : 'bg-white/[0.04] border-white/[0.06] text-text-muted hover:text-text-secondary',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {selectedEnergyHint && (
            <p className="text-xs text-text-muted">{selectedEnergyHint}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-text-secondary">Estimated Time</label>
            <span className="text-sm font-mono tabular-nums text-accent-flow">{estimatedMinutes}m</span>
          </div>
          <div className="flex gap-2 mb-2">
            {timePresets.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setEstimatedMinutes(t)}
                className={clsx(
                  'flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 active:scale-[0.98] cursor-pointer',
                  'focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none',
                  estimatedMinutes === t
                    ? 'bg-accent-flow/15 border-accent-flow/30 text-accent-flow'
                    : 'bg-white/[0.04] border-white/[0.06] text-text-muted hover:text-text-secondary',
                )}
              >
                {t >= 60 ? `${t / 60}hr` : `${t}m`}
              </button>
            ))}
          </div>
          <input
            type="range"
            min={5}
            max={120}
            step={5}
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
            className="w-full accent-accent-flow cursor-pointer"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={() => { reset(); onClose(); }} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={!title.trim()} className="flex-1">
            {mode === 'edit' ? 'Save' : 'Add Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
