'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Clock, ChevronDown, Check, Circle } from 'lucide-react';
import { Button } from '@/components/ui';
import { useTaskStore } from '@/stores/useTaskStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { useSessionStore } from '@/stores/useSessionStore';
import type { FocusSession, Task } from '@/types/database';

// 5m is the ADHD secret weapon — "just do 5 minutes" breaks initiation paralysis
const DURATIONS = [5, 15, 25, 45, 90];

interface SessionSetupProps {
  onStart: (session: FocusSession) => void;
}

/** Custom dropdown that matches the dark theme — no native <select> */
function TaskPicker({
  tasks,
  selectedId,
  onSelect,
}: {
  tasks: Task[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedTask = tasks.find((t) => t.id === selectedId);
  const label = selectedTask ? selectedTask.title : 'Open session — no task';

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    },
    [],
  );

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full h-10 rounded-xl bg-bg-secondary border border-white/[0.06] text-text-primary px-3 text-sm text-left flex items-center gap-2 transition-all duration-200 cursor-pointer hover:border-white/[0.12] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
      >
        <span className="flex-1 truncate">{label}</span>
        <ChevronDown
          size={14}
          className={`text-text-muted shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute z-50 top-full mt-1 left-0 right-0 bg-bg-tertiary border border-white/[0.10] rounded-xl overflow-hidden animate-fadeIn"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)' }}
        >
          <div className="max-h-56 overflow-y-auto py-1">
            {/* Task options first — funnel toward picking a task */}
            {tasks.map((t) => (
              <button
                key={t.id}
                role="option"
                aria-selected={t.id === selectedId}
                onClick={() => {
                  onSelect(t.id);
                  setOpen(false);
                }}
                className={`w-full px-3 py-2.5 text-left text-sm flex items-center gap-2.5 transition-colors duration-150 cursor-pointer ${
                  t.id === selectedId
                    ? 'bg-accent-flow/10 text-accent-flow'
                    : 'text-text-primary hover:bg-white/[0.04]'
                }`}
              >
                {t.id === selectedId ? (
                  <Check size={14} className="shrink-0" />
                ) : (
                  <Circle size={14} className="shrink-0 text-white/[0.15]" />
                )}
                <span className="truncate">{t.title}</span>
              </button>
            ))}

            {/* "No task" at the bottom — intentional escape hatch, not the default path */}
            {tasks.length > 0 && <div className="mx-3 my-1 border-t border-white/[0.06]" />}
            <button
              role="option"
              aria-selected={selectedId === ''}
              onClick={() => {
                onSelect('');
                setOpen(false);
              }}
              className={`w-full px-3 py-2.5 text-left text-sm flex items-center gap-2.5 transition-colors duration-150 cursor-pointer ${
                selectedId === ''
                  ? 'bg-accent-flow/10 text-accent-flow'
                  : 'text-text-muted hover:bg-white/[0.04]'
              }`}
            >
              {selectedId === '' ? (
                <Check size={14} className="shrink-0" />
              ) : (
                <Circle size={14} className="shrink-0 text-white/[0.15]" />
              )}
              <span>Open session — no task</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SessionSetup({ onStart }: SessionSetupProps) {
  const profileId = useProfileStore((s) => s.profile?.id ?? '');
  const lastSession = useSessionStore((s) => s.lastCompletedSession);
  const allTasks = useTaskStore((s) => s.tasks);
  const tasks = useMemo(
    () =>
      allTasks
        .filter((t) => t.status === 'today' || t.status === 'in_progress')
        .sort((a, b) => a.sort_order - b.sort_order),
    [allTasks],
  );

  // Pre-select highest priority task — one less decision
  const [selectedTaskId, setSelectedTaskId] = useState(() => tasks[0]?.id ?? '');
  const [duration, setDuration] = useState(25);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  // Subtitle: show useful context, not redundant task name
  const subtitle = useMemo(() => {
    if (!selectedTask) return 'Pick a task and duration, then start.';
    const priority = selectedTask.priority;
    const est = selectedTask.estimated_minutes;
    const parts: string[] = [];
    if (priority && priority !== 'medium') parts.push(`${priority} priority`);
    if (est) parts.push(`~${est}m estimated`);
    if (parts.length > 0) return parts.join(' · ');
    return 'Ready when you are.';
  }, [selectedTask]);

  const handleStart = () => {
    const session: FocusSession = {
      id: crypto.randomUUID(),
      user_id: profileId,
      task_id: selectedTaskId || null,
      session_type: 'focus',
      planned_duration: duration,
      actual_duration: null,
      focus_quality: null,
      distractions_count: 0,
      notes: null,
      soundscape: 'brown_noise',
      started_at: new Date().toISOString(),
      ended_at: null,
    };
    onStart(session);
  };

  return (
    <div className="max-w-md mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Focus Session</h1>
        <p className="mt-1 text-text-secondary text-sm">{subtitle}</p>
      </div>

      {/* Task selection — custom dropdown, dark theme */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">Task</label>
        <TaskPicker tasks={tasks} selectedId={selectedTaskId} onSelect={setSelectedTaskId} />
      </div>

      {/* Duration pills */}
      <div className="space-y-2">
        <span className="text-sm font-medium text-text-secondary" id="duration-label">
          Duration
        </span>
        <div className="flex gap-2" role="radiogroup" aria-labelledby="duration-label">
          {DURATIONS.map((d) => (
            <button
              key={d}
              role="radio"
              aria-checked={d === duration}
              onClick={() => setDuration(d)}
              className={`flex-1 h-10 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98] cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none ${
                d === duration
                  ? 'bg-accent-flow text-white'
                  : 'bg-white/[0.04] text-text-secondary hover:bg-white/[0.08]'
              }`}
            >
              <span className="font-mono tabular-nums">{d}</span>m
            </button>
          ))}
        </div>
        {duration === 5 ? (
          <p className="text-xs text-text-muted">
            Just 5 minutes. Start small — you can always extend.
          </p>
        ) : lastSession ? (
          <p className="text-xs text-white/[0.15]">
            Last session: <span className="font-mono tabular-nums">{Math.round(lastSession.actual_duration ?? lastSession.planned_duration)}m</span>
          </p>
        ) : null}
      </div>

      <Button size="lg" className="w-full" onClick={handleStart}>
        Start
      </Button>

      {/* Identity stat — shown only when we have real data */}
      {lastSession && (
        <p className="text-center text-xs text-white/[0.25]">
          <Clock size={11} className="inline -mt-0.5 mr-1" />
          You&apos;ve been showing up. That&apos;s what matters.
        </p>
      )}
    </div>
  );
}

export { SessionSetup };
export type { SessionSetupProps };
