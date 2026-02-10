'use client';

import { useState } from 'react';
import { Zap, CalendarPlus, Scissors, UserPlus, Trash2 } from 'lucide-react';
import { Modal, Button, ProgressBar } from '@/components/ui';
import type { Task } from '@/types/database';

interface InboxProcessorProps {
  open: boolean;
  onClose: () => void;
  tasks: Task[];
  onAction: (taskId: string, action: InboxAction) => void;
}

type InboxAction = 'do-now' | 'schedule' | 'break-down' | 'delegate' | 'delete';

const actions: { value: InboxAction; label: string; icon: typeof Zap }[] = [
  { value: 'do-now', label: 'Do Now', icon: Zap },
  { value: 'schedule', label: 'Schedule', icon: CalendarPlus },
  { value: 'break-down', label: 'Break Down', icon: Scissors },
  { value: 'delegate', label: 'Delegate', icon: UserPlus },
  { value: 'delete', label: 'Delete', icon: Trash2 },
];

export function InboxProcessor({ open, onClose, tasks, onAction }: InboxProcessorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const total = tasks.length;
  const isDone = currentIndex >= total;
  const currentTask = isDone ? null : tasks[currentIndex];

  const handleAction = (action: InboxAction) => {
    if (!currentTask) return;
    onAction(currentTask.id, action);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleClose = () => {
    setCurrentIndex(0);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Process Inbox" size="md">
      <div className="space-y-5">
        {!isDone && (
          <div className="space-y-2">
            <p className="text-sm text-text-secondary">{currentIndex + 1} of {total}</p>
            <ProgressBar value={currentIndex} max={total} height="sm" />
          </div>
        )}

        {isDone ? (
          <div className="text-center py-8">
            <p className="text-lg font-semibold text-text-primary mb-2">All done.</p>
            <p className="text-sm text-text-secondary mb-6">Processed {total} items.</p>
            <Button onClick={handleClose}>Back to tasks</Button>
          </div>
        ) : currentTask ? (
          <div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] mb-4">
              <h4 className="text-base font-medium text-text-primary mb-1">{currentTask.title}</h4>
              {currentTask.description && (
                <p className="text-sm text-text-secondary line-clamp-2">{currentTask.description}</p>
              )}
              {currentTask.estimated_minutes && (
                <p className="text-xs text-text-muted mt-2">~{currentTask.estimated_minutes}m</p>
              )}
            </div>

            <div className="grid grid-cols-5 gap-2">
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.value}
                    onClick={() => handleAction(action.value)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-white/[0.06] bg-bg-secondary hover:bg-white/[0.04] transition-all duration-200 active:scale-[0.98] cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none"
                  >
                    <Icon size={16} className="text-text-secondary" />
                    <span className="text-[11px] font-medium text-text-primary text-center leading-tight">
                      {action.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

export type { InboxAction };
