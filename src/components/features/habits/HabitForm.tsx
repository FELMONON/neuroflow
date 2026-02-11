'use client';

import { useState, useCallback } from 'react';
import clsx from 'clsx';
import { Sparkles } from 'lucide-react';
import { Modal, Input, Button } from '@/components/ui';
import type { RoutineType, HabitFrequency } from '@/types/database';

interface HabitFormData {
  title: string;
  routineType: RoutineType;
  frequency: HabitFrequency;
  estimatedMinutes: number;
}

interface HabitFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: HabitFormData) => void;
}

const routineOptions: { type: RoutineType; label: string }[] = [
  { type: 'morning', label: 'Morning' },
  { type: 'evening', label: 'Evening' },
  { type: 'anytime', label: 'Anytime' },
];

const frequencyOptions: { value: HabitFrequency; label: string }[] = [
  { value: 'daily', label: 'Every day' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekends', label: 'Weekends' },
];

const suggestedHabits = [
  'Drink water',
  'Take a walk',
  '5 min meditation',
  'Stretch',
  'Read 10 pages',
];

const frequencyLabel: Record<HabitFrequency, string> = {
  daily: 'Every day',
  weekdays: 'Weekdays',
  weekends: 'Weekends',
  custom: 'Custom',
};

const routineLabel: Record<RoutineType, string> = {
  morning: 'Morning',
  evening: 'Evening',
  anytime: 'Anytime',
  custom: 'Custom',
};

export function HabitForm({ open, onClose, onSubmit }: HabitFormProps) {
  const [title, setTitle] = useState('');
  const [titleTouched, setTitleTouched] = useState(false);
  const [routineType, setRoutineType] = useState<RoutineType>('morning');
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [estimatedMinutes, setEstimatedMinutes] = useState(5);

  const titleError = titleTouched && !title.trim() ? 'Habit name is required' : undefined;

  const handleSubmit = useCallback(() => {
    if (!title.trim()) {
      setTitleTouched(true);
      return;
    }
    onSubmit({ title: title.trim(), routineType, frequency, estimatedMinutes });
    setTitle('');
    setTitleTouched(false);
    setRoutineType('morning');
    setFrequency('daily');
    setEstimatedMinutes(5);
    onClose();
  }, [title, routineType, frequency, estimatedMinutes, onSubmit, onClose]);

  return (
    <Modal open={open} onClose={onClose} title="New Habit" size="sm">
      <div className="flex flex-col gap-5">
        <div>
          <Input
            label="Habit"
            placeholder="e.g., Drink a glass of water"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setTitleTouched(true)}
            error={titleError}
          />
          {!title.trim() && (
            <div className="mt-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles size={12} className="text-accent-flow" />
                <span className="text-xs text-text-muted">Suggestions</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {suggestedHabits.map((habit) => (
                  <button
                    key={habit}
                    type="button"
                    onClick={() => { setTitle(habit); setTitleTouched(false); }}
                    className="px-2.5 py-1 rounded-lg text-xs bg-white/[0.04] border border-white/[0.06] text-text-secondary hover:text-text-primary hover:border-accent-flow/30 transition-all duration-200 active:scale-[0.98] cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none"
                  >
                    {habit}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-secondary">Routine</label>
          <div className="flex gap-2">
            {routineOptions.map((opt) => (
              <label key={opt.type} className="flex-1">
                <input
                  type="radio"
                  name="routine"
                  value={opt.type}
                  checked={routineType === opt.type}
                  onChange={() => setRoutineType(opt.type)}
                  className="sr-only"
                />
                <div
                  className={clsx(
                    'py-2 text-center rounded-xl text-sm font-medium border transition-all duration-200 active:scale-[0.98] cursor-pointer',
                    routineType === opt.type
                      ? 'bg-accent-flow/15 border-accent-flow/30 text-accent-flow'
                      : 'bg-white/[0.04] border-white/[0.06] text-text-muted hover:text-text-secondary',
                  )}
                >
                  {opt.label}
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-secondary">Frequency</label>
          <div className="flex gap-2">
            {frequencyOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFrequency(opt.value)}
                className={clsx(
                  'flex-1 py-2 rounded-xl text-xs font-medium border transition-all duration-200 active:scale-[0.98] cursor-pointer',
                  frequency === opt.value
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
          <label className="text-sm font-medium text-text-secondary">
            Duration <span className="font-mono text-xs text-accent-flow">{estimatedMinutes} min</span>
          </label>
          <input
            type="range"
            min={1}
            max={60}
            step={1}
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/[0.10] accent-accent-flow"
          />
          <div className="flex justify-between text-[10px] text-text-muted">
            <span>1 min</span>
            <span>60 min</span>
          </div>
        </div>

        {/* Habit preview */}
        {title.trim() && (
          <div className="bg-bg-secondary rounded-xl border border-white/[0.06] p-4">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Preview</p>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-white/[0.2]" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{title.trim()}</p>
                <p className="text-xs text-text-muted mt-0.5">
                  {routineLabel[routineType]} &middot; {frequencyLabel[frequency]} &middot; {estimatedMinutes} min
                </p>
              </div>
            </div>
          </div>
        )}

        <Button onClick={handleSubmit} disabled={!title.trim()}>
          Create Habit
        </Button>
      </div>
    </Modal>
  );
}
