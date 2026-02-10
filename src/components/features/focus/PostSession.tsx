'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui';
import { useSessionStore } from '@/stores/useSessionStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { createClient } from '@/lib/supabase/client';

interface PostSessionProps {
  onStartAnother: () => void;
  onGoHome: () => void;
}

function PostSession({ onStartAnother, onGoHome }: PostSessionProps) {
  const { lastCompletedSession, setStatus } = useSessionStore();
  const tasks = useTaskStore((s) => s.tasks);
  const [quality, setQuality] = useState(0);
  const [notes, setNotes] = useState('');

  const session = lastCompletedSession;

  const currentTask = session?.task_id
    ? tasks.find((t) => t.id === session.task_id) ?? null
    : null;

  // Show actual duration (how long they really focused), not planned
  const sessionMinutes = session
    ? (session.actual_duration ?? Math.round(session.planned_duration))
    : 0;

  const handleDone = () => {
    // Update the saved session with quality/notes if user provided them
    if (session && (quality > 0 || notes.trim())) {
      const supabase = createClient();
      supabase
        .from('focus_sessions')
        .update({
          focus_quality: quality > 0 ? quality : null,
          notes: notes.trim() || null,
        })
        .eq('id', session.id)
        .then(({ error }: { error: unknown }) => {
          if (error) console.error('[PostSession] Failed to update session:', error);
        });
    }
    setStatus('idle');
    onGoHome();
  };

  const handleAnother = () => {
    // Save quality/notes before starting another
    if (session && (quality > 0 || notes.trim())) {
      const supabase = createClient();
      supabase
        .from('focus_sessions')
        .update({
          focus_quality: quality > 0 ? quality : null,
          notes: notes.trim() || null,
        })
        .eq('id', session.id)
        .then(({ error }: { error: unknown }) => {
          if (error) console.error('[PostSession] Failed to update session:', error);
        });
    }
    setStatus('idle');
    onStartAnother();
  };

  return (
    <div className="max-w-md mx-auto py-8 px-4 space-y-8 relative">
      {/* Radial glow celebration */}
      <div className="absolute inset-0 flex items-start justify-center pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="w-64 h-64 rounded-full bg-accent-flow/10 blur-3xl animate-session-glow" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const }}
      >
        <h1 className="text-2xl font-semibold text-text-primary">Session complete</h1>
        <p className="mt-1 text-sm text-text-secondary">
          <span className="font-mono tabular-nums">{sessionMinutes}</span> minutes{currentTask ? ` on ${currentTask.title}` : ''}. That&apos;s real.
        </p>
      </motion.div>

      {/* Today's cumulative focus time — identity reinforcement */}
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <Clock size={12} />
        <span>
          You focused for{' '}
          <span className="font-mono tabular-nums text-text-secondary">{sessionMinutes}m</span>{' '}
          this session
        </span>
      </div>

      {/* Quality rating */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary" id="quality-label">Quality</label>
        <div className="flex gap-2" role="radiogroup" aria-labelledby="quality-label">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              role="radio"
              aria-checked={quality === n}
              onClick={() => setQuality(n)}
              className={clsx(
                'w-10 h-10 rounded-full transition-all duration-200 active:scale-[0.98] cursor-pointer border-2',
                'focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none',
                n <= quality
                  ? 'bg-accent-flow border-accent-flow shadow-sm shadow-accent-flow/30'
                  : 'bg-white/[0.04] border-white/[0.06] hover:border-white/[0.10]',
              )}
              aria-label={`Rate ${n} out of 5`}
            />
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything to remember..."
          rows={3}
          className="w-full rounded-xl bg-bg-tertiary border border-white/[0.08] text-text-primary placeholder:text-text-muted px-3 py-2 text-sm resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Button size="lg" className="w-full" onClick={handleDone}>
          Done
        </Button>
        <Button variant="secondary" size="md" className="w-full" onClick={handleAnother}>
          Start another session
        </Button>
      </div>
    </div>
  );
}

export { PostSession };
export type { PostSessionProps };
