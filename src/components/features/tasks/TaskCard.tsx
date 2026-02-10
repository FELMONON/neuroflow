'use client';

import { useState } from 'react';
import { GripVertical, Check } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import type { Task, EnergyLevel } from '@/types/database';

const energyDot: Record<EnergyLevel, string> = {
  high: 'bg-energy-high',
  medium: 'bg-energy-medium',
  low: 'bg-energy-low',
  recharge: 'bg-energy-recharge',
};

const priorityColor: Record<string, string> = {
  critical: 'text-accent-spark',
  high: 'text-accent-sun',
  medium: 'text-accent-sun/70',
  low: 'text-text-muted',
};

const priorityDotColor: Record<string, string> = {
  critical: 'bg-accent-spark',
  high: 'bg-accent-sun',
  medium: 'bg-accent-sun/70',
  low: 'bg-text-muted',
};

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onBreakDown: (task: Task) => void;
  onEdit?: (task: Task) => void;
}

export function TaskCard({ task, onToggleComplete, onBreakDown, onEdit }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isCompleted = task.status === 'done';

  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'group rounded-xl border bg-bg-secondary border-white/[0.06] hover:border-white/[0.10] transition-colors duration-150',
        isDragging && 'z-50 shadow-2xl border-accent-flow/30',
        !isDragging && 'hover:bg-white/[0.02]',
        isCompleted && 'opacity-60',
      )}
    >
      <div className="flex items-start gap-3 p-3">
        <button
          className="mt-1 p-0.5 rounded text-text-muted opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing shrink-0"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={14} />
        </button>

        <button
          onClick={() => onToggleComplete(task.id)}
          className={clsx(
            'mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all duration-200 active:scale-[0.98] cursor-pointer',
            isCompleted
              ? 'bg-accent-grow border-accent-grow'
              : 'border-text-muted hover:border-accent-flow',
          )}
          aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
        >
          <AnimatePresence>
            {isCompleted && (
              <motion.span
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 45 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                <Check size={12} className="text-white" strokeWidth={3} />
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <button
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              className="flex-1 text-left cursor-pointer transition-all duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none rounded-lg"
            >
              <span className={clsx(
                'text-sm font-medium',
                isCompleted ? 'line-through text-text-muted' : 'text-text-primary',
              )}>
                {task.title}
              </span>
            </button>

            <div className="flex items-center gap-2 shrink-0">
              <span className={clsx(
                'w-1.5 h-1.5 rounded-full',
                priorityDotColor[task.priority] ?? energyDot[task.energy_required],
                task.energy_required === 'high' && !isCompleted && 'animate-energy-pulse',
              )} />
              <span className={clsx('text-xs font-medium', priorityColor[task.priority] ?? 'text-text-muted')}>{task.priority}</span>
            </div>
          </div>

          {task.estimated_minutes && (
            <span className="text-xs text-text-muted font-mono tabular-nums">{task.estimated_minutes}m</span>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 ml-[52px] border-t border-white/[0.06] pt-3">
          {task.description && (
            <p className="text-sm text-text-secondary mb-3">{task.description}</p>
          )}

          {task.ai_subtasks && task.ai_subtasks.length > 0 && (
            <div className="mb-3 space-y-1">
              {task.ai_subtasks.map((sub, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className={clsx(
                    'w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0',
                    sub.completed ? 'bg-accent-grow border-accent-grow' : 'border-text-muted',
                  )}>
                    {sub.completed && <Check size={8} className="text-white" strokeWidth={3} />}
                  </div>
                  <span className={clsx(sub.completed && 'line-through text-text-muted', 'text-text-secondary')}>
                    {sub.title}
                  </span>
                  <span className="text-[10px] text-text-muted ml-auto">{sub.estimated_minutes}m</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={() => onBreakDown(task)}
              className="text-xs text-accent-flow hover:text-accent-flow/80 transition-all duration-200 active:scale-[0.98] cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none rounded-lg px-1 py-0.5"
            >
              Break down
            </button>
            {onEdit && (
              <button
                onClick={() => onEdit(task)}
                className="text-xs text-text-muted hover:text-text-primary transition-all duration-200 active:scale-[0.98] cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none rounded-lg px-1 py-0.5"
              >
                Edit
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
