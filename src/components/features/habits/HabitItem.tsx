'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, Flame, Zap } from 'lucide-react';
import { XPPop } from '@/components/ui';
import clsx from 'clsx';

interface HabitItemProps {
  id: string;
  title: string;
  currentStreak: number;
  estimatedMinutes: number;
  completed: boolean;
  isQuickestWin?: boolean;
  onToggle: (id: string) => void;
  className?: string;
}

export function HabitItem({
  id,
  title,
  currentStreak,
  estimatedMinutes,
  completed,
  isQuickestWin,
  onToggle,
  className,
}: HabitItemProps) {
  const prevCompleted = useRef(completed);
  const [justCompleted, setJustCompleted] = useState(false);

  useEffect(() => {
    if (completed && !prevCompleted.current) {
      prevCompleted.current = completed;
      const startTimer = setTimeout(() => setJustCompleted(true), 0);
      const endTimer = setTimeout(() => setJustCompleted(false), 300);
      return () => {
        clearTimeout(startTimer);
        clearTimeout(endTimer);
      };
    }
    prevCompleted.current = completed;
  }, [completed]);

  // Streak display: today's completion extends the streak
  const displayStreak = completed ? currentStreak + 1 : currentStreak;

  return (
    <button
      onClick={() => onToggle(id)}
      className={clsx(
        'flex items-center gap-3 w-full px-4 text-left transition-all duration-200 active:scale-[0.98] cursor-pointer',
        'focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none',
        completed ? 'py-2 opacity-60' : 'py-3 hover:bg-white/[0.02]',
        isQuickestWin && !completed && 'ring-1 ring-accent-sun/20 bg-accent-sun/[0.03]',
        className,
      )}
    >
      {/* Checkbox */}
      <div className="relative shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center">
        <div
          className={clsx(
            'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors duration-150',
            completed
              ? 'bg-accent-grow border-accent-grow'
              : 'border-white/20 hover:border-accent-grow/50',
            justCompleted && 'animate-celebrate-check',
          )}
        >
          {completed && (
            <Check
              size={12}
              className={clsx('text-white', justCompleted && 'animate-check-icon')}
              strokeWidth={3}
            />
          )}
        </div>
        <XPPop amount={15} trigger={justCompleted} />
      </div>

      {/* Title + duration */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              'text-sm font-medium truncate',
              completed ? 'text-text-muted' : 'text-text-primary',
            )}
          >
            {title}
          </span>
          {isQuickestWin && !completed && (
            <span className="flex items-center gap-0.5 text-[10px] text-accent-sun font-medium shrink-0">
              <Zap size={10} />
              Quick win
            </span>
          )}
        </div>
        <span className="text-[11px] text-white/[0.25]">~{estimatedMinutes} min</span>
      </div>

      {/* Streak indicator — always present, never shaming */}
      {displayStreak > 0 ? (
        <span
          className={clsx(
            'flex items-center gap-1 text-xs font-mono tabular-nums shrink-0',
            completed ? 'text-accent-grow' : 'text-accent-sun',
          )}
        >
          <Flame size={12} />
          {displayStreak}
        </span>
      ) : !completed ? (
        <span className="text-[10px] text-white/[0.2] shrink-0">New</span>
      ) : null}
    </button>
  );
}
