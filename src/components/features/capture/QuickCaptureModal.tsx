'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useUIStore } from '@/stores/useUIStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { useProfileStore } from '@/stores/useProfileStore';
import type { Task } from '@/types/database';

interface CaptureClassification {
  type: 'task' | 'thought' | 'reminder';
  title?: string;
  due_date?: string;
  due_time?: string;
  original: string;
}

function buildTaskFromClassification(classification: CaptureClassification, userId: string): Task {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    user_id: userId,
    title: classification.title || classification.original,
    description: classification.title ? classification.original : null,
    status: classification.due_date ? 'scheduled' : 'inbox',
    priority: 'medium',
    energy_required: 'medium',
    estimated_minutes: null,
    actual_minutes: null,
    interest_level: 3,
    due_date: classification.due_date || null,
    due_time: classification.due_time || null,
    scheduled_date: classification.due_date || null,
    scheduled_block: null,
    parent_task_id: null,
    sort_order: 0,
    tags: classification.type === 'task' ? [] : [classification.type, 'captured'],
    ai_subtasks: null,
    completed_at: null,
    xp_value: 10,
    created_at: now,
    updated_at: now,
  };
}

export function QuickCaptureModal() {
  const { quickCaptureOpen, setQuickCaptureOpen } = useUIStore();
  const addTask = useTaskStore((s) => s.addTask);
  const userId = useProfileStore((s) => s.profile?.id ?? '');
  const [value, setValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (quickCaptureOpen) {
      const t = setTimeout(() => {
        setValue('');
        setIsSubmitting(false);
        inputRef.current?.focus();
      }, 0);
      return () => clearTimeout(t);
    }
  }, [quickCaptureOpen]);

  const handleSubmit = useCallback(async () => {
    const text = value.trim();
    if (!text || isSubmitting || !userId) return;

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/ai/classify-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      let classification: CaptureClassification;

      if (!res.ok) {
        // Fallback: create a task directly if AI classification fails
        classification = { type: 'task', title: text, original: text };
      } else {
        classification = await res.json();
      }

      if (classification.type === 'task' || classification.type === 'reminder') {
        const task = buildTaskFromClassification(classification, userId);
        addTask(task);

        const label = classification.type === 'reminder' ? 'Reminder' : 'Task';
        toast.success(`${label} added to your inbox`);
      } else {
        // "thought" — still persist as a task tagged with "thought"
        const task = buildTaskFromClassification(classification, userId);
        addTask(task);
        toast.success('Thought captured');
      }

      setQuickCaptureOpen(false);
    } catch {
      // Network error — fallback to creating a plain task
      const fallback = buildTaskFromClassification({
        type: 'task',
        title: text,
        original: text,
      }, userId);
      addTask(fallback);
      toast.success('Captured as a task');
      setQuickCaptureOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  }, [value, isSubmitting, userId, addTask, setQuickCaptureOpen]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === 'Escape') {
        setQuickCaptureOpen(false);
      }
    },
    [handleSubmit, setQuickCaptureOpen],
  );

  if (!quickCaptureOpen) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Quick capture" className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        onClick={() => !isSubmitting && setQuickCaptureOpen(false)}
        className="absolute inset-0 bg-black/50 animate-fadeIn"
      />

      {/* Input container */}
      <div className="relative max-w-lg mx-auto mt-24 px-4 animate-fadeIn">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting}
            placeholder="Capture anything..."
            aria-label="Quick capture input"
            className="w-full h-12 px-4 bg-bg-secondary border border-white/[0.06] rounded-xl text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary disabled:opacity-60"
          />
          {isSubmitting && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 border-2 border-accent-flow/40 border-t-accent-flow rounded-full animate-spin" />
            </div>
          )}
        </div>
        <p className="mt-2 text-xs text-white/[0.3] text-center">
          Type anything — we&apos;ll figure out where it goes
        </p>
      </div>
    </div>
  );
}
