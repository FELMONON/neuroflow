'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { breakDownTask } from '@/lib/ai';
import type { Subtask } from '@/types/database';

interface FirstWinStepProps {
  onComplete: (taskTitle: string, subtasks?: Subtask[]) => void;
  saving?: boolean;
}

function generateFallbackSubtasks(title: string): Subtask[] {
  return [
    { title: `Gather what you need for "${title}"`, estimated_minutes: 3, energy_required: 'low', completed: false },
    { title: 'Write down the very first step', estimated_minutes: 3, energy_required: 'low', completed: false },
    { title: 'Set a 10-minute timer and start', estimated_minutes: 10, energy_required: 'medium', completed: false },
    { title: 'Take a 2-minute breather', estimated_minutes: 2, energy_required: 'recharge', completed: false },
    { title: 'Review what you did and adjust', estimated_minutes: 5, energy_required: 'low', completed: false },
  ];
}

const quickTasks = [
  'Clean my desk',
  'Reply to that email',
  'Start that essay',
  'Do the dishes',
];

export function FirstWinStep({ onComplete, saving }: FirstWinStepProps) {
  const [taskTitle, setTaskTitle] = useState('');
  const [phase, setPhase] = useState<'input' | 'loading' | 'result'>('input');
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (phase === 'input') {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleSubmit = useCallback(async () => {
    if (!taskTitle.trim()) return;
    setPhase('loading');

    try {
      const data = await breakDownTask(taskTitle.trim());
      if (data.subtasks && Array.isArray(data.subtasks)) {
        const mapped: Subtask[] = data.subtasks.map(
          (s: { title: string; estimated_minutes: number; energy_required: Subtask['energy_required'] }) => ({
            title: s.title,
            estimated_minutes: s.estimated_minutes,
            energy_required: s.energy_required,
            completed: false,
          }),
        );
        setSubtasks(mapped);
      } else {
        throw new Error('Unexpected response');
      }
    } catch (err) {
      console.warn('[FirstWinStep] AI call failed, using fallback:', err);
      setSubtasks(generateFallbackSubtasks(taskTitle.trim()));
    }

    setPhase('result');
  }, [taskTitle]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const toggleStep = (index: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col items-center px-4 max-w-lg mx-auto">
      {phase === 'input' && (
        <div className="flex flex-col items-center w-full">
          <h2 className="text-2xl font-semibold text-text-primary text-center">
            What&apos;s one thing you&apos;ve been putting off?
          </h2>
          <p className="text-sm text-text-muted text-center mt-2">
            We&apos;ll break it into tiny steps right here.
          </p>

          <div className="w-full max-w-sm mt-8">
            <Input
              ref={inputRef}
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type something or pick one below..."
            />
          </div>

          {!taskTitle.trim() && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {quickTasks.map((task) => (
                <button
                  key={task}
                  type="button"
                  onClick={() => setTaskTitle(task)}
                  className="px-3 py-1.5 rounded-full text-xs bg-white/[0.04] border border-white/[0.06] text-text-secondary hover:text-text-primary hover:border-accent-flow/30 transition-all duration-200 active:scale-[0.98] cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none"
                >
                  {task}
                </button>
              ))}
            </div>
          )}

          <div className="mt-8 flex items-center gap-4">
            <Button size="lg" disabled={!taskTitle.trim()} onClick={handleSubmit}>
              Break it down
            </Button>
          </div>

          <button
            type="button"
            onClick={() => onComplete('')}
            className="mt-4 text-xs text-text-muted hover:text-text-secondary transition-all duration-200 cursor-pointer rounded-lg px-2 py-1 focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none"
          >
            Skip and set up later
          </button>
        </div>
      )}

      {phase === 'loading' && (
        <div className="flex flex-col items-center py-16" role="status" aria-label="Loading">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-accent-flow animate-pulse"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
          <p className="text-sm text-text-muted mt-4">Breaking it down...</p>
          <span className="sr-only">Loading...</span>
        </div>
      )}

      {phase === 'result' && (
        <div className="flex flex-col items-center w-full">
          <p className="text-sm text-text-muted mb-1">Your task</p>
          <h3 className="text-lg font-semibold text-text-primary mb-6">{taskTitle}</h3>

          <p className="text-xs text-text-muted mb-3">
            Try checking off the first step to see how it feels
          </p>

          <ol className="w-full max-w-sm space-y-2">
            <AnimatePresence>
              {subtasks.map((subtask, i) => {
                const done = completedSteps.has(i);
                return (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.2 }}
                    className="flex items-center gap-3 text-sm group"
                  >
                    <button
                      type="button"
                      onClick={() => toggleStep(i)}
                      aria-label={done ? `Mark step "${subtask.title}" incomplete` : `Mark step "${subtask.title}" complete`}
                      className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none ${
                        done
                          ? 'bg-accent-grow border-accent-grow'
                          : 'border-white/[0.2] hover:border-accent-flow'
                      }`}
                    >
                      {done && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                        >
                          <Check size={10} className="text-white" />
                        </motion.div>
                      )}
                    </button>
                    <span className={`flex-1 transition-colors duration-200 ${
                      done ? 'text-text-muted line-through' : 'text-text-primary'
                    }`}>
                      {subtask.title}
                    </span>
                    <span className="text-xs text-text-muted shrink-0 font-mono tabular-nums">
                      ~{subtask.estimated_minutes}m
                    </span>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ol>

          <p className="text-sm text-text-secondary mt-8">Nice. Let&apos;s go.</p>

          <div className="mt-4">
            <Button size="lg" loading={saving} onClick={() => onComplete(taskTitle, subtasks)}>
              Continue to dashboard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export type { FirstWinStepProps };
