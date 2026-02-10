'use client';

import { Check } from 'lucide-react';
import clsx from 'clsx';

interface ChainStep {
  id: string;
  cue: string;
  habit: string;
  completed: boolean;
}

interface HabitChainProps {
  title: string;
  steps: ChainStep[];
}

export function HabitChain({ title, steps }: HabitChainProps) {
  if (steps.length === 0) return null;

  return (
    <div className="bg-bg-secondary rounded-xl border border-white/[0.06] hover:border-white/[0.10] shadow-sm shadow-black/20 p-4 transition-all duration-200">
      <h3 className="text-sm font-medium text-text-secondary mb-3">{title}</h3>
      <div className="flex flex-col gap-0">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div
                className={clsx(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                  step.completed
                    ? 'bg-accent-grow border-accent-grow'
                    : 'border-white/20',
                )}
              >
                {step.completed && <Check size={10} className="text-white" strokeWidth={3} />}
              </div>
              {i < steps.length - 1 && (
                <div className="w-px h-6 bg-white/[0.08]" />
              )}
            </div>
            <div className="pb-4">
              <p className={clsx(
                'text-sm font-medium',
                step.completed ? 'text-text-muted' : 'text-text-primary',
              )}>
                {step.habit}
              </p>
              <p className="text-xs text-text-muted">After {step.cue}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
